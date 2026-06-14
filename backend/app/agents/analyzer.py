from __future__ import annotations

import logging
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.models.emergency_state import EmergencyState

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

FEATURE_COLUMNS = [
    "g_force",
    "velocity",
    "temperature",
    "humidity",
    "obstacle_distance",
]

FEATURE_LABELS = {
    "g_force": "impact force (G)",
    "velocity": "train speed (km/h)",
    "temperature": "ambient temperature (°C)",
    "humidity": "humidity (%)",
    "obstacle_distance": "obstacle distance (m)",
}

_severity_model: Any | None = None
_casualty_model: Any | None = None
_models_loaded = False
_model_load_error: str | None = None


def _load_models() -> tuple[Any | None, Any | None]:
    """Load ML models with proper fallback handling."""
    global _severity_model, _casualty_model, _models_loaded, _model_load_error

    if _models_loaded:
        return _severity_model, _casualty_model

    _models_loaded = True
    severity_path = os.path.join(MODELS_DIR, "severity_model.pkl")
    casualty_path = os.path.join(MODELS_DIR, "casualty_model.pkl")

    try:
        if os.path.isfile(severity_path) and os.path.isfile(casualty_path):
            _severity_model = joblib.load(severity_path)
            _casualty_model = joblib.load(casualty_path)
            logger.info("ML models loaded successfully")
        else:
            _model_load_error = (
                "ML model files not found; using heuristic severity calculator"
            )
            logger.warning(_model_load_error)
    except Exception as exc:
        _model_load_error = f"ML model load failed ({str(exc)[:100]}); using heuristic calculator"
        logger.error(_model_load_error, exc_info=exc)
        _severity_model = None
        _casualty_model = None

    return _severity_model, _casualty_model


def _build_feature_frame(state: EmergencyState) -> pd.DataFrame:
    """Build feature dataframe from emergency state."""
    return pd.DataFrame(
        [
            {
                "g_force": float(state.peak_g_force),
                "velocity": float(state.velocity_kmh),
                "temperature": float(state.temperature),
                "humidity": float(state.humidity),
                "obstacle_distance": float(state.obstacle_distance),
            }
        ]
    )


def _heuristic_analyze(state: EmergencyState) -> EmergencyState:
    risk_score = state.peak_g_force * state.velocity_kmh + state.humidity * 0.5 - state.obstacle_distance * 0.2

    if risk_score > 800:
        severity = "HIGH"
    elif risk_score > 400:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    casualties = int(np.clip(risk_score / 20, 1, 100))
    confidence = min(99, round(55 + (risk_score / 50)))

    reasons = _heuristic_reasons(state)
    if _model_load_error:
        reasons.insert(0, _model_load_error)

    state.severity = severity
    state.casualties = casualties
    state.risk_score = round(risk_score, 2)
    state.confidence = confidence
    state.reasoning = reasons
    return state

def _heuristic_reasons(state: EmergencyState) -> list[str]:
    """Generate rule-based reasoning when ML model is unavailable."""
    reasons: list[str] = []
    
    if state.peak_g_force > 7:
        reasons.append(f"Critical impact force detected ({state.peak_g_force:.1f}G) — severe structural damage expected")
    elif state.peak_g_force > 5:
        reasons.append(f"High impact force ({state.peak_g_force:.1f}G) — significant trauma injuries likely")
    
    if state.velocity_kmh > 120:
        reasons.append(f"Excessive speed at impact ({state.velocity_kmh:.0f} km/h) — high casualty risk")
    elif state.velocity_kmh > 100:
        reasons.append(f"Train speed exceeded safety threshold ({state.velocity_kmh:.0f} km/h)")
    
    if state.humidity > 85:
        reasons.append(f"Severe weather conditions (humidity {state.humidity:.0f}%) — rescue operations hampered")
    elif state.humidity > 80:
        reasons.append(f"Adverse weather (humidity {state.humidity:.0f}%) — response delays expected")
    
    if state.temperature < 5:
        reasons.append(f"Cold environment ({state.temperature:.0f}°C) — hypothermia risk for casualties")
    elif state.temperature > 38:
        reasons.append(f"Extreme heat ({state.temperature:.0f}°C) — heat-related complications likely")
    
    if state.obstacle_distance < 30:
        reasons.append(f"Obstacle extremely close ({state.obstacle_distance:.0f}m) — potential secondary collision")
    elif state.obstacle_distance < 100:
        reasons.append(f"Obstacle detected at {state.obstacle_distance:.0f}m — collision avoidance failed")
    
    if not reasons:
        reasons.append("Heuristic assessment based on multi-sensor telemetry integration")
    
    return reasons


def _extract_shap_explanations(
    severity_model: Any,
    casualty_model: Any,
    features: pd.DataFrame,
    predicted_severity: str,
    predicted_casualties: int,
) -> list[str]:
    """Extract SHAP-based feature importance explanations."""
    reasons: list[str] = []

    try:
        import shap
        
        # Initialize SHAP explainer based on model type
        if hasattr(severity_model, 'predict_proba'):  # Tree-based models
            severity_explainer = shap.TreeExplainer(severity_model)
            casualty_explainer = shap.TreeExplainer(casualty_model)
        else:
            # Fallback to Kernel explainer for other model types
            severity_explainer = shap.KernelExplainer(severity_model.predict, features)
            casualty_explainer = shap.KernelExplainer(casualty_model.predict, features)

        # Compute SHAP values
        severity_shap = severity_explainer.shap_values(features)
        casualty_shap = casualty_explainer.shap_values(features)

        # Handle multi-class severity predictions
        if isinstance(severity_shap, list):
            if hasattr(severity_model, 'classes_'):
                class_index = list(severity_model.classes_).index(predicted_severity)
            else:
                class_index = 0
            severity_contribs = severity_shap[class_index][0]
        else:
            severity_contribs = severity_shap[0]

        # Handle casualty predictions
        casualty_contribs = casualty_shap[0] if len(np.shape(casualty_shap)) > 1 else casualty_shap

        # Combine impact scores and rank features
        combined = {}
        for idx, col in enumerate(FEATURE_COLUMNS):
            severity_impact = abs(float(severity_contribs[idx])) if idx < len(severity_contribs) else 0
            casualty_impact = abs(float(casualty_contribs[idx])) if idx < len(casualty_contribs) else 0
            combined[col] = severity_impact + casualty_impact

        # Get top 3 impactful features
        ranked = sorted(combined.items(), key=lambda item: item[1], reverse=True)[:3]
        value_map = features.iloc[0].to_dict()

        reasons.append(f"ML-based analysis (severity={predicted_severity}, casualties={predicted_casualties})")
        
        for feature, impact in ranked:
            label = FEATURE_LABELS.get(feature, feature)
            value = value_map.get(feature, 0)
            reasons.append(
                f"{label.title()} = {value:.1f} (SHAP impact: {impact:.3f})"
            )
        
        return reasons
    except Exception as exc:
        logger.warning(f"SHAP analysis failed: {exc}", exc_info=exc)
    
    return []


def _extract_feature_importance_explanations(
    severity_model: Any,
    casualty_model: Any,
    features: pd.DataFrame,
    predicted_severity: str,
    predicted_casualties: int,
) -> list[str]:
    """Extract feature importance from tree-based models."""
    reasons: list[str] = []
    
    try:
        value_map = features.iloc[0].to_dict()
        feature_impacts = {}
        
        # Collect feature importances from severity model
        if hasattr(severity_model, 'feature_importances_'):
            for idx, col in enumerate(FEATURE_COLUMNS):
                if idx < len(severity_model.feature_importances_):
                    feature_impacts[col] = severity_model.feature_importances_[idx]
        
        # Normalize and sort
        if feature_impacts:
            total_importance = sum(feature_impacts.values())
            if total_importance > 0:
                reasons.append(f"ML-based analysis (severity={predicted_severity}, casualties={predicted_casualties})")
                
                ranked_features = sorted(
                    feature_impacts.items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:3]
                
                for feature, importance in ranked_features:
                    if importance > 0.02:  # Only show significant features
                        label = FEATURE_LABELS.get(feature, feature)
                        value = value_map.get(feature, 0)
                        norm_importance = (importance / total_importance) * 100
                        reasons.append(
                            f"{label.title()} = {value:.1f} (importance: {norm_importance:.1f}%)"
                        )
        
        return reasons
    except Exception as exc:
        logger.warning(f"Feature importance extraction failed: {exc}", exc_info=exc)
    
    return []


def _format_model_reasoning(
    severity_model: Any,
    casualty_model: Any,
    features: pd.DataFrame,
    predicted_severity: str,
    predicted_casualties: int,
) -> list[str]:
    """Format model-based reasoning with SHAP or feature importance."""
    reasons: list[str] = []

    # Try SHAP first
    shap_reasons = _extract_shap_explanations(
        severity_model, casualty_model, features, predicted_severity, predicted_casualties
    )
    if shap_reasons:
        return shap_reasons

    # Fallback to feature importance
    fi_reasons = _extract_feature_importance_explanations(
        severity_model, casualty_model, features, predicted_severity, predicted_casualties
    )
    if fi_reasons:
        return fi_reasons

    # Last resort: basic model explanation
    return [f"ML-based analysis (severity={predicted_severity}, casualties={predicted_casualties})"]


def _heuristic_analyze(state: EmergencyState) -> EmergencyState:
    """Fallback heuristic analysis when models unavailable."""
    risk_score = state.peak_g_force * state.velocity_kmh + state.humidity * 0.5 - state.obstacle_distance * 0.2

    if risk_score > 800:
        severity = "HIGH"
    elif risk_score > 400:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    casualties = int(np.clip(risk_score / 20, 1, 100))
    confidence = min(99, round(55 + (risk_score / 50)))

    reasons = _heuristic_reasons(state)
    if _model_load_error:
        reasons.insert(0, f"[FALLBACK] {_model_load_error}")

    state.severity = severity
    state.casualties = casualties
    state.risk_score = round(risk_score, 2)
    state.confidence = confidence
    state.reasoning = reasons
    return state


def analyze(state: EmergencyState) -> EmergencyState:
    """
    Analyze emergency state using ML models with SHAP explainability.
    Falls back to heuristic analysis if models unavailable.
    """
    severity_model, casualty_model = _load_models()
    features = _build_feature_frame(state)

    # Use heuristic fallback if models unavailable
    if severity_model is None or casualty_model is None:
        return _heuristic_analyze(state)

    try:
        # ML-based prediction
        severity = severity_model.predict(features)[0]
        casualties = int(np.clip(casualty_model.predict(features)[0], 1, 500))

        # Calculate risk score
        risk_score = state.peak_g_force * state.velocity_kmh
        
        # Get confidence from model probability if available
        proba_method = getattr(severity_model, "predict_proba", None)
        if proba_method:
            try:
                proba_array = proba_method(features)
                if hasattr(severity_model, 'classes_'):
                    class_index = list(severity_model.classes_).index(severity)
                else:
                    class_index = 0
                confidence = round(float(proba_array[0][class_index]) * 100, 1)
            except Exception:
                confidence = min(99, round(70 + (risk_score / 40)))
        else:
            confidence = min(99, round(70 + (risk_score / 40)))

        # Get model-based reasoning with explainability
        reasoning = _format_model_reasoning(
            severity_model,
            casualty_model,
            features,
            severity,
            casualties,
        )
        
        # Add heuristic context if available
        heuristic_context = _heuristic_reasons(state)
        if heuristic_context:
            reasoning.extend(heuristic_context[:2])  # Add top 2 heuristic reasons

        state.severity = severity
        state.casualties = casualties
        state.risk_score = round(risk_score, 2)
        state.confidence = confidence
        state.reasoning = reasoning
        
        return state

    except Exception as exc:
        logger.error(f"Model prediction failed: {exc}", exc_info=exc)
        state.errors.append(f"ML prediction failed ({str(exc)[:50]}); using fallback heuristic")
        return _heuristic_analyze(state)
