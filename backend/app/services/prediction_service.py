import logging

from sqlmodel import Session

from ..auth import AuthenticatedUser
from ..ml.predict import predict_risk
from ..models.location import Location
from ..models.risk import RiskRecord
from .alert_service import evaluate_alert_condition
from .feature_preparation import prepare_features
from .notification_service import (
    get_alert_notifications_enabled,
    send_alert_notifications,
)


logger = logging.getLogger(__name__)


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
    session: Session,
    authenticated_user: AuthenticatedUser | None = None,
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

    alert = alert_result["alert"]
    if (
        alert_result["created"]
        and alert is not None
        and alert.id is not None
        and alert.severity.upper() in {"HIGH", "CRITICAL"}
        and authenticated_user is not None
    ):
        if authenticated_user.is_demo:
            logger.info("Notifications skipped for alert %s: demo session", alert.id)
        elif not authenticated_user.phone or not authenticated_user.phone.strip():
            logger.info("Notifications skipped for alert %s: no recipient phone configured", alert.id)
        elif authenticated_user.id is None or authenticated_user.access_token is None:
            logger.warning("Notifications skipped for alert %s: verified user context is incomplete", alert.id)
        else:
            notifications_enabled = get_alert_notifications_enabled(
                authenticated_user.id,
                authenticated_user.access_token,
            )
            if notifications_enabled is False:
                logger.info("Notifications skipped for alert %s: user preference is disabled", alert.id)
            elif notifications_enabled is None:
                logger.warning("Notifications skipped for alert %s: user preference could not be verified", alert.id)
            else:
                send_alert_notifications(
                    recipient_phone=authenticated_user.phone.strip(),
                    severity=alert.severity,
                    title=alert.title,
                    message=alert.message,
                    alert_id=alert.id,
                    location_name=location.name,
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