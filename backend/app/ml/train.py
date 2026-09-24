import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier


DATA_PATH = "data/sample_landslide_data.csv"
MODEL_PATH = "app/ml/model.pkl"


def train_model():

    df = pd.read_csv(DATA_PATH)

    features = [
        "rainfall_24h",
        "soil_moisture",
        "slope",
        "elevation",
        "ndvi",
        "historical_events"
    ]

    X = df[features]
    y = df["risk_level"]

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)

    print("Model trained successfully.")


if __name__ == "__main__":
    train_model()