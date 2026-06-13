import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

severity_model_path = os.path.join(
    BASE_DIR,
    "models",
    "severity_model.pkl"
)

casualty_model_path = os.path.join(
    BASE_DIR,
    "models",
    "casualty_model.pkl"
)

severity_model = joblib.load(
    severity_model_path
)

casualty_model = joblib.load(
    casualty_model_path
)


def analyze(state):

    temperature = getattr(
        state,
        "temperature",
        30
    )

    humidity = getattr(
        state,
        "humidity",
        60
    )

    obstacle_distance = getattr(
        state,
        "obstacle_distance",
        100
    )

    X = pd.DataFrame(
        [
            {
                "g_force": state.peak_g_force,
                "velocity": state.velocity_kmh,
                "temperature": temperature,
                "humidity": humidity,
                "obstacle_distance": obstacle_distance,
            }
        ]
    )

    severity = severity_model.predict(X)[0]

    casualties = int(
        casualty_model.predict(X)[0]
    )

    risk_score = (
        state.peak_g_force
        * state.velocity_kmh
    )

    confidence = min(
        99,
        round(
            70
            + (risk_score / 40)
        )
    )

    reasons = []

    if state.peak_g_force > 7:
        reasons.append(
            "High impact force detected"
        )

    if state.velocity_kmh > 100:
        reasons.append(
            "Train speed exceeded 100 km/h"
        )

    if humidity > 80:
        reasons.append(
            "Adverse weather conditions"
        )

    if obstacle_distance < 50:
        reasons.append(
            "Obstacle detected very close to train"
        )

    state.severity = severity
    state.casualties = casualties

    state.risk_score = round(
        risk_score,
        2
    )

    state.confidence = confidence

    state.reasoning = reasons

    return state