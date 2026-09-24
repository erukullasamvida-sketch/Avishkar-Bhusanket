from typing import Optional
from sqlmodel import Field, SQLModel


class Location(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    district: str

    latitude: float
    longitude: float

    elevation: float
    slope: float

    vegetation: str = "Moderate"

    ndvi: float = 0.5
    historical_events: int = 0

    monitored: bool = True