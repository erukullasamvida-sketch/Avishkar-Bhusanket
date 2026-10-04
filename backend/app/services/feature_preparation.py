from sqlmodel import Session, select

from ..models.location import Location
from ..models.environmental import EnvironmentalObservation


FEATURES = [
    "rainfall_24h",
    "soil_moisture",
    "slope",
    "elevation",
    "ndvi",
    "historical_events",
]


def prepare_features(
    location_id: int,
    session: Session
):
    location = session.get(Location, location_id)

    if not location:
        raise ValueError("Location not found")

    statement = (
        select(EnvironmentalObservation)
        .where(
            EnvironmentalObservation.location_id == location_id
        )
        .order_by(
            EnvironmentalObservation.observed_at.desc()
        )
    )

    observation = session.exec(statement).first()

    if not observation:
        raise ValueError(
            "No environmental observation found for this location"
        )

    features = {
        "rainfall_24h": observation.rainfall_24h,
        "soil_moisture": observation.soil_moisture * 100,
        "slope": location.slope,
        "elevation": location.elevation,
        "ndvi": location.ndvi,
        "historical_events": location.historical_events,
    }

    for name in FEATURES:
        value = features.get(name)

        if value is None:
            raise ValueError(
                f"Required feature '{name}' is missing"
            )

        if not isinstance(value, (int, float)):
            raise ValueError(
                f"Required feature '{name}' must be numerical"
            )

    return {
        "location_id": location_id,
        "observation_id": observation.id,
        "observed_at": observation.observed_at,
        "features": features,
    }