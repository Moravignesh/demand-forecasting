import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.forecast import Forecast
from schemas.forecast import ForecastCreate, ForecastOut
from services.auth_service import get_current_user
from services.forecasting_service import create_forecast

router = APIRouter(prefix="/api/forecasts", tags=["Forecasting"])


@router.post("/", response_model=ForecastOut)
def run_forecast(
    payload: ForecastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_forecast(
        db=db,
        user_id=current_user.id,
        dataset_id=payload.dataset_id,
        model_type=payload.model_type,
        periods=payload.periods,
        target_column=payload.target_column,
        date_column=payload.date_column
    )


@router.get("/", response_model=list[ForecastOut])
def list_forecasts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Forecast).filter(Forecast.user_id == current_user.id).order_by(Forecast.created_at.desc()).all()


@router.get("/{forecast_id}", response_model=ForecastOut)
def get_forecast(forecast_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Forecast).filter(Forecast.id == forecast_id, Forecast.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    return f


@router.get("/{forecast_id}/predictions")
def get_predictions(forecast_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = db.query(Forecast).filter(Forecast.id == forecast_id, Forecast.user_id == current_user.id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Forecast not found")
    if f.status != "completed":
        raise HTTPException(status_code=400, detail="Forecast not completed")
    return json.loads(f.predictions)
