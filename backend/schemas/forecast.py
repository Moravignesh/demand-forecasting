from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ForecastCreate(BaseModel):
    dataset_id: int
    model_type: str = "linear_regression"
    periods: int = 30
    target_column: str
    date_column: str
    feature_column: Optional[str] = None


class ForecastOut(BaseModel):
    id: int
    dataset_id: int
    model_type: str
    periods: int
    accuracy: Optional[float]
    r2_score: Optional[float]
    predictions: Optional[str]
    target_column: Optional[str]
    date_column: Optional[str]
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
