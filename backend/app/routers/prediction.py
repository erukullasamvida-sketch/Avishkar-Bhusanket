from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..database import get_session
from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..ml.predict import model, predict_risk
from ..services.feature_preparation import prepare_features
from ..services.prediction_service import predict_location_risk
from ..services.risk_engine import get_feature_importance


router = APIRouter(
    prefix="/api/predictions",
    tags=["AI Prediction"]
)


@router.post("")
def create_prediction(
    data: PredictionRequest
):

    result = predict_risk(
        data.model_dump()
    )

    return result


@router.get("/feature-importance")
def get_prediction_feature_importance():
    return get_feature_importance(model)


@router.post("/{location_id}/run")
def run_location_prediction(
    location_id: int,
    session: Session = Depends(get_session)
):
    try:
        return predict_location_risk(location_id, session)

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )


@router.get("/features/{location_id}")
def get_prediction_features(
    location_id: int,
    session: Session = Depends(get_session)
):

    try:
        return prepare_features(
            location_id,
            session
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )