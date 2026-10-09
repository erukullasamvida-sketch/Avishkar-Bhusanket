from datetime import datetime
from typing import Dict, List, Literal

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):

    rainfall_24h: float
    soil_moisture: float = Field(
        description="Volumetric moisture percentage points (0-100) for model input."
    )
    slope: float
    elevation: float
    ndvi: float
    historical_events: int


SearchablePredictionFeature = Literal[
    "rainfall_24h",
    "soil_moisture",
    "slope",
    "elevation",
    "ndvi",
]


class ScenarioSearchRequest(BaseModel):
    location_id: int = Field(gt=0)
    target_class: Literal["moderate", "high", "critical"]
    selected_features: List[SearchablePredictionFeature] = Field(
        min_length=1,
        max_length=5,
    )


class PredictionResponse(BaseModel):

    location_id: int
    observation_id: int
    observed_at: datetime
    features: Dict[str, float]
    risk_level: str
    probability: float
    probabilities: Dict[str, float]
    risk_record_id: int
    risk_score: float
    explanation: List[str]