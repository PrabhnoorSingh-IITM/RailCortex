import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

BASE_DIR = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

np.random.seed(42)

N = 5000

g_force = np.random.uniform(1, 12, N)

velocity = np.random.uniform(10, 140, N)

temperature = np.random.uniform(5, 45, N)

humidity = np.random.uniform(20, 100, N)

obstacle_distance = np.random.uniform(
    0,
    500,
    N
)

risk_score = (
    g_force * velocity
    + humidity * 0.5
    - obstacle_distance * 0.2
)

severity = []

for score in risk_score:

    if score > 800:
        severity.append("HIGH")

    elif score > 400:
        severity.append("MEDIUM")

    else:
        severity.append("LOW")

casualties = (
    risk_score / 20
).astype(int)

casualties = np.clip(
    casualties,
    1,
    100
)

df = pd.DataFrame(
    {
        "g_force": g_force,
        "velocity": velocity,
        "temperature": temperature,
        "humidity": humidity,
        "obstacle_distance": obstacle_distance,
        "severity": severity,
        "casualties": casualties,
    }
)

X = df[
    [
        "g_force",
        "velocity",
        "temperature",
        "humidity",
        "obstacle_distance",
    ]
]

y_severity = df["severity"]

y_casualties = df["casualties"]

severity_model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

casualty_model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

severity_model.fit(
    X,
    y_severity
)

casualty_model.fit(
    X,
    y_casualties
)

joblib.dump(
    severity_model,
    os.path.join(MODELS_DIR, "severity_model.pkl"),
)

joblib.dump(
    casualty_model,
    os.path.join(MODELS_DIR, "casualty_model.pkl"),
)

print("Models saved successfully.")