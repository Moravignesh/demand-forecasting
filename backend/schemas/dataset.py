from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class DatasetOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    row_count: int
    column_count: int
    columns_info: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DatasetPreview(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    total_rows: int
    missing_values: Dict[str, int]
    dtypes: Dict[str, str]
