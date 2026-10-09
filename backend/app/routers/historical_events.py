import json
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import AnyHttpUrl, BaseModel
from sqlmodel import Session

from ..database import get_session
from ..models.location import Location


router = APIRouter(
    prefix="/api/historical-events",
    tags=["Historical Landslide Events"],
)

EVENTS_FILE = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "historical_landslide_events.json"
)


class HistoricalLandslideEvent(BaseModel):
    event_id: str
    location_name: str
    event_date: date
    district: str
    description: str
    reported_impact: str | None = None
    source_name: str
    source_url: AnyHttpUrl


class HistoricalEventsResponse(BaseModel):
    location_id: int
    location_name: str
    events: list[HistoricalLandslideEvent]


def _load_historical_events() -> list[HistoricalLandslideEvent]:
    dataset = json.loads(EVENTS_FILE.read_text(encoding="utf-8"))
    return [
        HistoricalLandslideEvent.model_validate(event)
        for event in dataset["events"]
    ]


@router.get("/{location_id}", response_model=HistoricalEventsResponse)
def get_historical_events(
    location_id: int,
    session: Session = Depends(get_session),
):
    location = session.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")

    normalized_name = location.name.strip().casefold()
    normalized_district = location.district.strip().casefold()
    events = [
        event
        for event in _load_historical_events()
        if event.location_name.strip().casefold() == normalized_name
        and event.district.strip().casefold() == normalized_district
    ]

    return HistoricalEventsResponse(
        location_id=location_id,
        location_name=location.name,
        events=events,
    )
