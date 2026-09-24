from datetime import datetime
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models.location import Location
from ..models.environmental import EnvironmentalObservation
from ..services.weather_service import get_weather, parse_environmental_data


router = APIRouter(
    prefix="/api/environmental",
    tags=["Environmental Data"]
)


@router.get("")
def get_environmental_data(
    session: Session = Depends(get_session),
):
    return session.exec(
        select(EnvironmentalObservation)
        .order_by(EnvironmentalObservation.observed_at.desc())
        .limit(100)
    ).all()


@router.post("/{location_id}")
def collect_environmental_data(
    location_id: int,
    session: Session = Depends(get_session)
):
    location = session.get(Location, location_id)

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    try:
        data = get_weather(
            location.latitude,
            location.longitude
        )

        parsed = parse_environmental_data(data)

    except (requests.RequestException, KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch environmental data: {exc}"
        )

    parsed = parse_environmental_data(data)

    latest_index = len(parsed["time"]) - 1
    if latest_index < 0:
        raise HTTPException(
            status_code=502,
            detail="Incomplete environmental data received"
        )

    observation = EnvironmentalObservation(
        location_id=location_id,
        rainfall_24h=sum(parsed["precipitation"]),
        soil_moisture=parsed["soil_moisture"][latest_index],
        temperature=parsed["temperature"][latest_index],
        humidity=parsed["humidity"][latest_index],
        source="Open-Meteo",
        observed_at=datetime.fromisoformat(
            parsed["time"][latest_index]
        ),
    )

    session.add(observation)
    session.commit()
    session.refresh(observation)

    return observation