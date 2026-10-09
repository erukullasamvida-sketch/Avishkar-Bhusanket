from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..auth import AuthenticatedUser, require_supabase_auth
from ..database import get_session
from ..schemas.prediction import PredictionRequest, ScenarioSearchRequest
from ..ml.predict import model, predict_risk
from ..services.feature_preparation import prepare_features
from ..services.prediction_service import predict_location_risk
from ..services.risk_engine import get_feature_importance
from ..services.scenario_search import search_higher_risk_scenarios


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


@router.post("/scenario-search")
def search_prediction_scenarios(
    data: ScenarioSearchRequest,
    session: Session = Depends(get_session),
):
    try:
        prepared = prepare_features(data.location_id, session)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    try:
        return search_higher_risk_scenarios(
            prepared["features"],
            data.selected_features,
            data.target_class,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/feature-importance")
def get_prediction_feature_importance():
    return get_feature_importance(model)


@router.post("/{location_id}/run")
def run_location_prediction(
    location_id: int,
    session: Session = Depends(get_session),
    authenticated_user: AuthenticatedUser = Depends(require_supabase_auth),
):
    try:
        return predict_location_risk(
            location_id,
            session,
            authenticated_user=authenticated_user,
        )

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