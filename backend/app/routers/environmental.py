from datetime import datetime, timezone
import math
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


def _data_status(observation: EnvironmentalObservation) -> str:
    core_values = (observation.rainfall_24h, observation.soil_moisture)
    if not all(math.isfinite(value) for value in core_values):
        return "INVALID"
    if observation.rainfall_24h < 0 or not 0 <= observation.soil_moisture <= 1:
        return "INVALID"
    if observation.temperature is not None and (
        not math.isfinite(observation.temperature)
        or not -90 <= observation.temperature <= 60
    ):
        return "INVALID"
    if observation.humidity is not None and (
        not math.isfinite(observation.humidity)
        or not 0 <= observation.humidity <= 100
    ):
        return "INVALID"
    if observation.temperature is None or observation.humidity is None:
        return "PARTIAL"
    return "VALID"


def _observation_response(
    observation: EnvironmentalObservation,
    fetched_at: datetime | None = None,
) -> dict:
    is_forecast = observation.source.casefold() == "open-meteo"
    return {
        **observation.model_dump(),
        "data_type": "FORECAST" if is_forecast else "UNKNOWN",
        "data_status": _data_status(observation),
        "timestamp_type": "FORECAST_VALID_TIME" if is_forecast else "RECORDED_AT",
        "timestamp_timezone": "Asia/Kolkata" if is_forecast else None,
        "fetched_at": fetched_at,
    }


@router.get("")
def get_environmental_data(
    location_id: int | None = None,
    session: Session = Depends(get_session),
):
    statement = select(EnvironmentalObservation)
    if location_id is not None:
        statement = statement.where(
            EnvironmentalObservation.location_id == location_id
        )
    observations = session.exec(
        statement.order_by(EnvironmentalObservation.observed_at.desc()).limit(100)
    ).all()
    return [_observation_response(observation) for observation in observations]


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

    try:
        series = (
            parsed["time"],
            parsed["precipitation"],
            parsed["soil_moisture"],
            parsed["temperature"],
            parsed["humidity"],
        )
    except (KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Incomplete environmental data received: {exc}"
        )
    if any(not isinstance(values, (list, tuple)) for values in series):
        raise HTTPException(
            status_code=502,
            detail="Environmental forecast fields must be hourly lists"
        )
    if not series[0] or any(len(values) != len(series[0]) for values in series[1:]):
        raise HTTPException(
            status_code=502,
            detail="Incomplete or misaligned environmental data received"
        )

    latest_index = len(parsed["time"]) - 1
    try:
        precipitation = [float(value) for value in parsed["precipitation"]]
        soil_moisture = float(parsed["soil_moisture"][latest_index])
        temperature = float(parsed["temperature"][latest_index])
        humidity = float(parsed["humidity"][latest_index])
        forecast_time = datetime.fromisoformat(parsed["time"][latest_index])
    except (TypeError, ValueError, IndexError, OverflowError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Invalid environmental data received: {exc}"
        )

    values = (*precipitation, soil_moisture, temperature, humidity)
    if (
        not all(math.isfinite(value) for value in values)
        or any(value < 0 for value in precipitation)
        or not 0 <= soil_moisture <= 1
        or not -90 <= temperature <= 60
        or not 0 <= humidity <= 100
    ):
        raise HTTPException(
            status_code=502,
            detail="Environmental data contains missing or out-of-range values"
        )

    fetched_at = datetime.now(timezone.utc)
    observation = EnvironmentalObservation(
        location_id=location_id,
        rainfall_24h=sum(precipitation),
        soil_moisture=soil_moisture,
        temperature=temperature,
        humidity=humidity,
        source="Open-Meteo",
        observed_at=forecast_time,
    )

    session.add(observation)
    session.commit()
    session.refresh(observation)

    return _observation_response(observation, fetched_at)