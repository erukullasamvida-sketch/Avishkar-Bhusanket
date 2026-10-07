from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models.alert import Alert
from ..models.location import Location
from ..models.risk import RiskRecord
from ..schemas.alert import AlertResponse
from ..services.alert_service import get_response_recommendation

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)


def _alert_response(
    alert: Alert,
    location_name: str | None,
    risk_record: RiskRecord | None,
) -> AlertResponse:
    return AlertResponse(
        id=alert.id,
        location_id=alert.location_id,
        location_name=location_name,
        severity=alert.severity.upper(),
        title=alert.title,
        message=alert.message,
        status=alert.status.upper(),
        created_at=alert.created_at,
        risk_score=risk_record.risk_score if risk_record else None,
        probability=risk_record.probability if risk_record else None,
        risk_timestamp=risk_record.created_at if risk_record else None,
        acknowledged_at=alert.acknowledged_at,
        resolved_at=alert.resolved_at,
        response_recommendation=get_response_recommendation(alert.severity),
    )


@router.get("", response_model=list[AlertResponse])
def get_alerts(
    location_id: int | None = None,
    session: Session = Depends(get_session),
):
    statement = select(Alert).order_by(Alert.created_at.desc())
    if location_id is not None:
        statement = statement.where(Alert.location_id == location_id)
    alerts = session.exec(statement).all()
    locations = {
        location.id: location.name
        for location in session.exec(select(Location)).all()
    }
    risk_record_ids = {
        alert.risk_record_id for alert in alerts if alert.risk_record_id is not None
    }
    risk_records = (
        session.exec(
            select(RiskRecord).where(RiskRecord.id.in_(risk_record_ids))
        ).all()
        if risk_record_ids
        else []
    )
    risk_records_by_id = {record.id: record for record in risk_records}

    return [
        _alert_response(
            alert,
            locations.get(alert.location_id),
            risk_records_by_id.get(alert.risk_record_id),
        )
        for alert in alerts
    ]


def _transition_alert(
    alert_id: int,
    session: Session,
    target_status: str,
) -> AlertResponse:
    alert = session.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    if target_status == "ACKNOWLEDGED":
        if alert.status == "RESOLVED":
            raise HTTPException(
                status_code=409,
                detail="Resolved alerts cannot be acknowledged",
            )
        if alert.status == "ACTIVE":
            alert.status = target_status
            alert.acknowledged_at = datetime.now(timezone.utc)
    elif alert.status != "RESOLVED":
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)

    session.add(alert)
    session.commit()
    session.refresh(alert)
    location = session.get(Location, alert.location_id)
    risk_record = (
        session.get(RiskRecord, alert.risk_record_id)
        if alert.risk_record_id is not None
        else None
    )
    return _alert_response(alert, location.name if location else None, risk_record)


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    session: Session = Depends(get_session),
):
    return _transition_alert(alert_id, session, "ACKNOWLEDGED")


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    session: Session = Depends(get_session),
):
    return _transition_alert(alert_id, session, "RESOLVED")