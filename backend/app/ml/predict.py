import joblib
import pandas as pd


MODEL_PATH = "app/ml/model.pkl"

model = joblib.load(MODEL_PATH)


FEATURES = [
    "rainfall_24h",
    "soil_moisture",
    "slope",
    "elevation",
    "ndvi",
    "historical_events"
]


def predict_risk(data: dict):

    X = pd.DataFrame([data])[FEATURES]

    probabilities = model.predict_proba(X)[0]

    classes = model.classes_
    prediction = classes[
        max(range(len(probabilities)), key=probabilities.__getitem__)
    ]

    probability_map = {
        cls: float(prob)
        for cls, prob in zip(classes, probabilities)
    }

    predicted_probability = probability_map[prediction]

    return {
        "risk_level": prediction,
        "probability": round(
            predicted_probability,
            3
        ),
        "probabilities": probability_map
    }