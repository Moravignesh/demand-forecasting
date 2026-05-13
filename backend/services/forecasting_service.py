import pandas as pd
import numpy as np
import json
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session
from models.forecast import Forecast
from models.dataset import Dataset
from services.dataset_service import load_dataframe
from fastapi import HTTPException
from datetime import datetime, timedelta


def run_linear_regression(df: pd.DataFrame, date_col: str, target_col: str, periods: int):
    df = df.copy()

    # Parse dates
    try:
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Cannot parse date column '{date_col}'")

    if target_col not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target_col}' not found")

    try:
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        df.dropna(subset=[target_col], inplace=True)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Target column must be numeric")

    # Create time-based features
    df["ordinal"] = df[date_col].map(pd.Timestamp.toordinal)
    df["month"] = df[date_col].dt.month
    df["quarter"] = df[date_col].dt.quarter
    df["dayofweek"] = df[date_col].dt.dayofweek

    feature_cols = ["ordinal", "month", "quarter", "dayofweek"]
    X = df[feature_cols].values
    y = df[target_col].values

    if len(X) < 4:
        raise HTTPException(status_code=400, detail="Not enough data points for forecasting (need at least 4)")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred_test = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred_test))
    r2 = float(r2_score(y_test, y_pred_test))

    # Generate future predictions
    last_date = df[date_col].max()
    future_dates = [last_date + timedelta(days=i+1) for i in range(periods)]
    future_df = pd.DataFrame({
        "date": future_dates,
        "ordinal": [d.toordinal() for d in future_dates],
        "month": [d.month for d in future_dates],
        "quarter": [(d.month - 1) // 3 + 1 for d in future_dates],
        "dayofweek": [d.weekday() for d in future_dates],
    })

    future_X = future_df[["ordinal", "month", "quarter", "dayofweek"]].values
    future_preds = model.predict(future_X)
    future_preds = np.maximum(future_preds, 0)  # No negative demand

    # Historical fitted values
    historical_preds = model.predict(X).tolist()
    historical_actuals = y.tolist()
    historical_dates = df[date_col].dt.strftime("%Y-%m-%d").tolist()

    predictions = {
        "future": [
            {"date": d.strftime("%Y-%m-%d"), "predicted": round(float(v), 2)}
            for d, v in zip(future_dates, future_preds)
        ],
        "historical": [
            {"date": historical_dates[i], "actual": round(historical_actuals[i], 2), "predicted": round(historical_preds[i], 2)}
            for i in range(len(historical_dates))
        ]
    }

    return predictions, mae, r2


def run_prophet_forecast(df: pd.DataFrame, date_col: str, target_col: str, periods: int):
    try:
        from prophet import Prophet
    except ImportError:
        raise HTTPException(status_code=500, detail="Prophet library not installed")

    df = df.copy()
    try:
        df[date_col] = pd.to_datetime(df[date_col])
    except Exception:
        raise HTTPException(status_code=400, detail=f"Cannot parse date column '{date_col}'")

    try:
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        df.dropna(subset=[target_col], inplace=True)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Target column must be numeric")

    prophet_df = df[[date_col, target_col]].rename(columns={date_col: "ds", target_col: "y"})
    prophet_df = prophet_df.sort_values("ds")

    if len(prophet_df) < 4:
        raise HTTPException(status_code=400, detail="Not enough data for Prophet (need at least 4)")

    model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
    model.fit(prophet_df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    historical = forecast[forecast["ds"].isin(prophet_df["ds"])][["ds", "yhat"]].copy()
    historical = historical.merge(prophet_df[["ds", "y"]], on="ds", how="left")

    future_fc = forecast[~forecast["ds"].isin(prophet_df["ds"])][["ds", "yhat", "yhat_lower", "yhat_upper"]]
    future_fc["yhat"] = future_fc["yhat"].clip(lower=0)

    y_true = historical["y"].values
    y_pred = historical["yhat"].values
    mae = float(mean_absolute_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))

    predictions = {
        "future": [
            {
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted": round(float(row["yhat"]), 2),
                "lower": round(float(row["yhat_lower"]), 2),
                "upper": round(float(row["yhat_upper"]), 2)
            }
            for _, row in future_fc.iterrows()
        ],
        "historical": [
            {
                "date": row["ds"].strftime("%Y-%m-%d"),
                "actual": round(float(row["y"]), 2),
                "predicted": round(float(row["yhat"]), 2)
            }
            for _, row in historical.iterrows()
        ]
    }

    return predictions, mae, r2


def create_forecast(db: Session, user_id: int, dataset_id: int, model_type: str,
                    periods: int, target_column: str, date_column: str):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    forecast_obj = Forecast(
        dataset_id=dataset_id,
        user_id=user_id,
        model_type=model_type,
        periods=periods,
        target_column=target_column,
        date_column=date_column,
        status="pending"
    )
    db.add(forecast_obj)
    db.commit()
    db.refresh(forecast_obj)

    try:
        df = load_dataframe(dataset)

        if model_type == "prophet":
            predictions, mae, r2 = run_prophet_forecast(df, date_column, target_column, periods)
        else:
            predictions, mae, r2 = run_linear_regression(df, date_column, target_column, periods)

        forecast_obj.predictions = json.dumps(predictions)
        forecast_obj.accuracy = mae
        forecast_obj.r2_score = r2
        forecast_obj.status = "completed"
    except HTTPException as e:
        forecast_obj.status = "error"
        forecast_obj.error_message = e.detail
    except Exception as e:
        forecast_obj.status = "error"
        forecast_obj.error_message = str(e)

    db.commit()
    db.refresh(forecast_obj)
    return forecast_obj
