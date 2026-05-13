from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from database import engine, Base
import models  # noqa: F401

from routers import auth, datasets, forecasting, dashboard, reports

# ── Every column the models define ───────────────────────────────────────────
COLUMNS_TO_ADD = [
    # users
    ("users", "full_name",        "VARCHAR(255) NULL"),
    ("users", "created_at",       "DATETIME DEFAULT CURRENT_TIMESTAMP"),
    # datasets
    ("datasets", "user_id",           "INT NOT NULL DEFAULT 1"),
    ("datasets", "filename",          "VARCHAR(255) NOT NULL DEFAULT ''"),
    ("datasets", "original_filename", "VARCHAR(255) NOT NULL DEFAULT ''"),
    ("datasets", "file_path",         "VARCHAR(500) NOT NULL DEFAULT ''"),
    ("datasets", "row_count",         "INT DEFAULT 0"),
    ("datasets", "column_count",      "INT DEFAULT 0"),
    ("datasets", "columns_info",      "TEXT NULL"),
    ("datasets", "status",            "VARCHAR(50) DEFAULT 'uploaded'"),
    ("datasets", "created_at",        "DATETIME DEFAULT CURRENT_TIMESTAMP"),
    # forecasts
    ("forecasts", "user_id",          "INT NOT NULL DEFAULT 1"),
    ("forecasts", "dataset_id",       "INT NOT NULL DEFAULT 1"),
    ("forecasts", "model_type",       "VARCHAR(50) DEFAULT 'linear_regression'"),
    ("forecasts", "periods",          "INT DEFAULT 30"),
    ("forecasts", "accuracy",         "FLOAT NULL"),
    ("forecasts", "r2_score",         "FLOAT NULL"),
    ("forecasts", "predictions",      "LONGTEXT NULL"),
    ("forecasts", "feature_column",   "VARCHAR(255) NULL"),
    ("forecasts", "target_column",    "VARCHAR(255) NULL"),
    ("forecasts", "date_column",      "VARCHAR(255) NULL"),
    ("forecasts", "status",           "VARCHAR(50) DEFAULT 'pending'"),
    ("forecasts", "error_message",    "TEXT NULL"),
    ("forecasts", "created_at",       "DATETIME DEFAULT CURRENT_TIMESTAMP"),
]


def _col_exists(conn, table, column) -> bool:
    n = conn.execute(
        text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() "
            "AND TABLE_NAME = :t AND COLUMN_NAME = :c"
        ),
        {"t": table, "c": column},
    ).scalar()
    return int(n) > 0


def run_migrations():
    """Add any missing columns to existing tables (safe / idempotent)."""
    with engine.begin() as conn:
        for table, col, defn in COLUMNS_TO_ADD:
            try:
                if not _col_exists(conn, table, col):
                    conn.execute(text(
                        f"ALTER TABLE `{table}` ADD COLUMN `{col}` {defn}"
                    ))
                    print(f"[migration] ✅ Added {table}.{col}")
            except Exception as e:
                print(f"[migration] ⚠ skipped {table}.{col}: {e}")


# Boot sequence: create new tables first, then patch missing columns
Base.metadata.create_all(bind=engine)
run_migrations()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Demand Forecasting API",
    description="Backend API for AI-powered demand forecasting application",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(datasets.router)
app.include_router(forecasting.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"message": "AI Demand Forecasting API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
