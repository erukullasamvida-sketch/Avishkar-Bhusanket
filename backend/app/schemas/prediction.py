from datetime import datetime
from typing import Dict, List

from pydantic import BaseModel


class PredictionRequest(BaseModel):

    rainfall_24h: float
    soil_moisture: float
    slope: float
    elevation: float
    ndvi: float
    historical_events: int


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