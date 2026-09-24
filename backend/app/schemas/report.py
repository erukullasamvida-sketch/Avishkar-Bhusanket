from pydantic import BaseModel, Field


class FieldReportCreate(BaseModel):

    location_name: str = Field(min_length=1, max_length=200)

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)

    report_type: str = Field(min_length=1, max_length=100)

    severity: str = Field(min_length=1, max_length=20)

    description: str = Field(min_length=1, max_length=2000)

    image_url: str | None = None