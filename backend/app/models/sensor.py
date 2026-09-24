from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class Sensor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str

    sensor_type: str

    status: str

    last_update: datetime = Field(
        default_factory=datetime.utcnow
    )

    value: Optional[float] = None