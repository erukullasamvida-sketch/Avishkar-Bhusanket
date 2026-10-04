from sqlmodel import Session

from ..ml.predict import predict_risk
from ..models.location import Location
from ..models.risk import RiskRecord
from .alert_service import evaluate_alert_condition
from .feature_preparation import prepare_features


def build_explanation(features: dict, risk_level: str):
    explanation = [
        f"Predicted risk level is {risk_level}.",
        f"Rainfall in the latest observation is {features['rainfall_24h']}.",
        f"Soil moisture in the latest observation is {features['soil_moisture']}.",
        f"Slope at the location is {features['slope']}.",
        f"Elevation at the location is {features['elevation']}.",
        f"NDVI at the location is {features['ndvi']}.",
        f"Historical landslide events recorded for the location: {features['historical_events']}."
    ]

    return explanation


def predict_location_risk(
    location_id: int,
    session: Session
):
    prepared = prepare_features(location_id, session)
    prediction = predict_risk(prepared["features"])

    risk_score = prediction["probability"] * 100

    explanation = build_explanation(
        prepared["features"],
        prediction["risk_level"]
    )

    risk_record = RiskRecord(
        location_id=prepared["location_id"],
        rainfall_24h=prepared["features"]["rainfall_24h"],
        soil_moisture=prepared["features"]["soil_moisture"],
        slope=prepared["features"]["slope"],
        elevation=prepared["features"]["elevation"],
        ndvi=prepared["features"]["ndvi"],
        historical_events=prepared["features"]["historical_events"],
        risk_score=risk_score,
        risk_level=prediction["risk_level"],
        probability=prediction["probability"],
    )

    session.add(risk_record)
    session.commit()
    session.refresh(risk_record)

    location = session.get(Location, prepared["location_id"])
    alert_result = evaluate_alert_condition(
        session=session,
        location_id=prepared["location_id"],
        location_name=location.name,
        risk_level=prediction["risk_level"],
        risk_record_id=risk_record.id,
    )

    return {
        "location_id": prepared["location_id"],
        "observation_id": prepared["observation_id"],
        "observed_at": prepared["observed_at"],
        "features": prepared["features"],
        **prediction,
        "risk_record_id": risk_record.id,
        "risk_score": risk_score,
        "explanation": explanation,
        "alert_created": alert_result["created"],
        "alert_reused": alert_result["reused"],
    }