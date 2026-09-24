from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class EnvironmentalObservation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    location_id: int

    rainfall_24h: float = 0.0
    soil_moisture: float = 0.0

    temperature: Optional[float] = None
    humidity: Optional[float] = None

    source: str = "Open-Meteo"

    observed_at: datetime = Field(default_factory=datetime.utcnow)