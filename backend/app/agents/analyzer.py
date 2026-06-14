from __future__ import annotations

import os
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.models.emergency_state import EmergencyState

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
        else:
            _model_load_error = (
                "ML model files not found; using heuristic severity calculator"
            )
    except Exception as exc:
        _model_load_error = f"ML model load failed ({exc}); using heuristic calculator"
        _severity_model = None
        _casualty_model = None

    return _severity_model, _casualty_model


def _build_feature_frame(state: EmergencyState) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "g_force": state.peak_g_force,
                "velocity": state.velocity_kmh,
                "temperature": state.temperature,
                "humidity": state.humidity,
                "obstacle_distance": state.obstacle_distance,
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
    reasons: list[str] = []
    if state.peak_g_force > 7:
        reasons.append(f"High impact force detected ({state.peak_g_force:.1f}G)")
    if state.velocity_kmh > 100:
        reasons.append(f"Train speed exceeded 100 km/h ({state.velocity_kmh:.0f} km/h)")
    if state.humidity > 80:
        reasons.append(f"Adverse weather conditions (humidity {state.humidity:.0f}%)")
    if state.obstacle_distance < 50:
        reasons.append(f"Obstacle detected very close ({state.obstacle_distance:.0f}m)")
    if not reasons:
        reasons.append("Heuristic assessment based on sensor telemetry")
    return reasons


def _format_shap_reasons(
    severity_model: Any,
    casualty_model: Any,
    features: pd.DataFrame,
    predicted_severity: str,
    predicted_casualties: int,
) -> list[str]:
    reasons: list[str] = []

    try:
        import shap

        severity_explainer = shap.TreeExplainer(severity_model)
        casualty_explainer = shap.TreeExplainer(casualty_model)

        severity_shap = severity_explainer.shap_values(features)
        casualty_shap = casualty_explainer.shap_values(features)

        if isinstance(severity_shap, list):
            class_index = list(severity_model.classes_).index(predicted_severity)
            severity_contribs = severity_shap[class_index][0]
        else:
            severity_contribs = severity_shap[0]

        casualty_contribs = casualty_shap[0] if len(np.shape(casualty_shap)) > 1 else casualty_shap

        combined = {}
        for idx, col in enumerate(FEATURE_COLUMNS):
            combined[col] = abs(float(severity_contribs[idx])) + abs(float(casualty_contribs[idx]))

        ranked = sorted(combined.items(), key=lambda item: item[1], reverse=True)[:3]
        value_map = features.iloc[0].to_dict()

        for feature, impact in ranked:
            label = FEATURE_LABELS[feature]
            value = value_map[feature]
            reasons.append(
                f"{label.title()} ({value:.1f}) drove the prediction "
                f"(combined SHAP impact {impact:.3f})"
            )

        reasons.append(
            f"Model output: severity={predicted_severity}, estimated casualties={predicted_casualties}"
        )
        return reasons
    except Exception:
        pass

    for feature in FEATURE_COLUMNS:
        importance = float(getattr(severity_model, "feature_importances_", [0])[FEATURE_COLUMNS.index(feature)])
        value = float(features.iloc[0][feature])
        if importance > 0.05:
            reasons.append(
                f"{FEATURE_LABELS[feature].title()} ({value:.1f}) "
                f"— feature importance {importance:.2f}"
            )

    if not reasons:
        reasons = _heuristic_reasons_from_frame(features.iloc[0])

    reasons.append(
        f"Model output: severity={predicted_severity}, estimated casualties={predicted_casualties}"
    )
    return reasons


def _heuristic_reasons_from_frame(row: pd.Series) -> list[str]:
    reasons: list[str] = []
    if row["g_force"] > 7:
        reasons.append(f"High impact force ({row['g_force']:.1f}G)")
    if row["velocity"] > 100:
        reasons.append(f"High train speed ({row['velocity']:.0f} km/h)")
    if row["humidity"] > 80:
        reasons.append(f"High humidity ({row['humidity']:.0f}%)")
    if row["obstacle_distance"] < 50:
        reasons.append(f"Close obstacle ({row['obstacle_distance']:.0f}m)")
    return reasons or ["Telemetry-driven model assessment"]


def analyze(state: EmergencyState) -> EmergencyState:
    severity_model, casualty_model = _load_models()
    features = _build_feature_frame(state)

    if severity_model is None or casualty_model is None:
        return _heuristic_analyze(state)

    severity = severity_model.predict(features)[0]
    casualties = int(casualty_model.predict(features)[0])

    risk_score = state.peak_g_force * state.velocity_kmh
    proba = getattr(severity_model, "predict_proba", None)
    if proba:
        class_index = list(severity_model.classes_).index(severity)
        confidence = round(float(proba(features)[0][class_index]) * 100, 1)
    else:
        confidence = min(99, round(70 + (risk_score / 40)))

    state.severity = severity
    state.casualties = casualties
    state.risk_score = round(risk_score, 2)
    state.confidence = confidence
    state.reasoning = _format_shap_reasons(
        severity_model,
        casualty_model,
        features,
        severity,
        casualties,
    )
    return state
