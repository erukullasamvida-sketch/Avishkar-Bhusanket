from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..database import get_session
from ..models.alert import Alert
from ..models.location import Location

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)


@router.get("")
def get_alerts(
    location_id: int | None = None,
    session: Session = Depends(get_session),
):
    statement = select(Alert)
    if location_id is not None:
        statement = statement.where(Alert.location_id == location_id)
    alerts = session.exec(statement).all()
    locations = {
        location.id: location.name
        for location in session.exec(select(Location)).all()
    }

    return [
        {
            "id": alert.id,
            "location_id": alert.location_id,
            "location": locations.get(alert.location_id),
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity,
            "status": alert.status,
            "created_at": alert.created_at,
        }
        for alert in alerts
    ]