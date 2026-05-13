import pandas as pd
import json
import os
from sqlalchemy.orm import Session
from models.dataset import Dataset
from fastapi import HTTPException


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _clean_df(df: pd.DataFrame) -> pd.DataFrame:
    """Drop duplicates and fill missing values (compatible with all pandas versions)."""
    df = df.drop_duplicates()
    df = df.ffill()   # forward-fill
    df = df.bfill()   # back-fill any remaining NaNs at the start
    return df


def save_dataset(db: Session, user_id: int, filename: str,
                 original_filename: str, file_path: str) -> Dataset:
    try:
        if original_filename.lower().endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        df = _clean_df(df)

        columns_info = json.dumps({
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
        })

        dataset = Dataset(
            user_id=user_id,
            filename=filename,
            original_filename=original_filename,
            file_path=file_path,
            row_count=len(df),
            column_count=len(df.columns),
            columns_info=columns_info,
            status="processed",
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing dataset: {str(e)}")


def get_dataset_preview(db: Session, dataset_id: int, user_id: int):
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id, Dataset.user_id == user_id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = load_dataframe(dataset)
        preview_rows = df.head(50).fillna("").to_dict(orient="records")
        missing = {col: int(df[col].isnull().sum()) for col in df.columns}
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}

        return {
            "columns": list(df.columns),
            "rows": preview_rows,
            "total_rows": len(df),
            "missing_values": missing,
            "dtypes": dtypes,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading dataset: {str(e)}")


def load_dataframe(dataset: Dataset) -> pd.DataFrame:
    if dataset.original_filename.lower().endswith(".csv"):
        df = pd.read_csv(dataset.file_path)
    else:
        df = pd.read_excel(dataset.file_path)
    return _clean_df(df)
