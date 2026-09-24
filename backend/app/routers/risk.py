from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models.location import Location
from ..models.risk import RiskRecord

router = APIRouter(
    prefix="/api/risk",
    tags=["Risk Map"]
)


@router.get("/zones")
def get_risk_zones():

    return [
        {
            "location": "Dima Hasao",
            "latitude": 25.5,
            "longitude": 93.0,
            "risk_level": "Critical",
            "risk_score": 91
        },
        {
            "location": "Karbi Anglong",
            "latitude": 26.0,
            "longitude": 93.4,
            "risk_level": "High",
            "risk_score": 78
        },
        {
            "location": "Cachar",
            "latitude": 24.8,
            "longitude": 92.8,
            "risk_level": "High",
            "risk_score": 72
        }
    ]


@router.get("/{location_id}")
def get_location_risk(
    location_id: int,
    session: Session = Depends(get_session),
):
    location = session.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    risk_record = session.exec(
        select(RiskRecord)
        .where(RiskRecord.location_id == location_id)
        .order_by(RiskRecord.created_at.desc())
    ).first()

    return {
        "location": {
            "id": location.id,
            "name": location.name,
            "district": location.district,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "elevation": location.elevation,
            "slope": location.slope,
            "ndvi": location.ndvi,
            "historical_events": location.historical_events,
            "monitored": location.monitored,
        },
        "risk_record": risk_record,
        "risk_available": risk_record is not None,
    }