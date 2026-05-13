import json
import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.dataset import Dataset
from models.forecast import Forecast
from services.auth_service import get_current_user
from services.dataset_service import load_dataframe

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_datasets = db.query(Dataset).filter(Dataset.user_id == current_user.id).count()
    total_forecasts = db.query(Forecast).filter(Forecast.user_id == current_user.id).count()
    completed_forecasts = db.query(Forecast).filter(
        Forecast.user_id == current_user.id, Forecast.status == "completed"
    ).count()

    # Average accuracy
    acc_row = db.query(func.avg(Forecast.accuracy)).filter(
        Forecast.user_id == current_user.id, Forecast.status == "completed"
    ).scalar()
    avg_accuracy = round(float(acc_row), 4) if acc_row else None

    avg_r2 = db.query(func.avg(Forecast.r2_score)).filter(
        Forecast.user_id == current_user.id, Forecast.status == "completed"
    ).scalar()
    avg_r2 = round(float(avg_r2), 4) if avg_r2 else None

    # Recent forecasts
    recent_forecasts = db.query(Forecast).filter(
        Forecast.user_id == current_user.id
    ).order_by(Forecast.created_at.desc()).limit(5).all()

    recent_list = []
    for f in recent_forecasts:
        recent_list.append({
            "id": f.id,
            "model_type": f.model_type,
            "dataset_id": f.dataset_id,
            "status": f.status,
            "accuracy": f.accuracy,
            "r2_score": f.r2_score,
            "created_at": str(f.created_at)
        })

    # Monthly forecast count
    monthly_data = db.query(
        func.date_format(Forecast.created_at, "%Y-%m").label("month"),
        func.count(Forecast.id).label("count")
    ).filter(
        Forecast.user_id == current_user.id
    ).group_by("month").order_by("month").all()

    return {
        "total_datasets": total_datasets,
        "total_forecasts": total_forecasts,
        "completed_forecasts": completed_forecasts,
        "avg_mae": avg_accuracy,
        "avg_r2": avg_r2,
        "recent_forecasts": recent_list,
        "monthly_forecast_trend": [{"month": m, "count": c} for m, c in monthly_data]
    }


@router.get("/sales-summary/{dataset_id}")
def get_sales_summary(dataset_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        return {"error": "Dataset not found"}

    try:
        df = load_dataframe(dataset)
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        date_cols = []
        for col in df.columns:
            try:
                pd.to_datetime(df[col])
                date_cols.append(col)
            except Exception:
                pass

        summary = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "numeric_columns": numeric_cols,
            "date_columns": date_cols,
            "numeric_summary": {}
        }

        for col in numeric_cols[:5]:
            summary["numeric_summary"][col] = {
                "min": round(float(df[col].min()), 2),
                "max": round(float(df[col].max()), 2),
                "mean": round(float(df[col].mean()), 2),
                "sum": round(float(df[col].sum()), 2),
                "std": round(float(df[col].std()), 2),
            }

        # Monthly sales if date + numeric available
        monthly_sales = []
        if date_cols and numeric_cols:
            try:
                date_col = date_cols[0]
                val_col = numeric_cols[0]
                temp = df[[date_col, val_col]].copy()
                temp[date_col] = pd.to_datetime(temp[date_col])
                temp["month"] = temp[date_col].dt.to_period("M").astype(str)
                monthly = temp.groupby("month")[val_col].sum().reset_index()
                monthly.columns = ["month", "total"]
                monthly_sales = monthly.to_dict(orient="records")
            except Exception:
                pass

        summary["monthly_sales"] = monthly_sales
        return summary
    except Exception as e:
        return {"error": str(e)}
