"""
Run this ONCE to fully sync your existing database with the current models.
  python migrate.py

Safe to run multiple times — skips columns that already exist.
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost:3306/demand_forecasting"
)

engine = create_engine(DATABASE_URL)

# (table, column, SQL definition)
COLUMNS_TO_ADD = [
    # ── users ─────────────────────────────────────────────────────────
    ("users", "full_name",       "VARCHAR(255) NULL"),
    ("users", "created_at",      "DATETIME DEFAULT CURRENT_TIMESTAMP"),

    # ── datasets ──────────────────────────────────────────────────────
    ("datasets", "user_id",          "INT NOT NULL DEFAULT 1"),
    ("datasets", "filename",         "VARCHAR(255) NOT NULL DEFAULT ''"),
    ("datasets", "original_filename","VARCHAR(255) NOT NULL DEFAULT ''"),
    ("datasets", "file_path",        "VARCHAR(500) NOT NULL DEFAULT ''"),
    ("datasets", "row_count",        "INT DEFAULT 0"),
    ("datasets", "column_count",     "INT DEFAULT 0"),
    ("datasets", "columns_info",     "TEXT NULL"),
    ("datasets", "status",           "VARCHAR(50) DEFAULT 'uploaded'"),
    ("datasets", "created_at",       "DATETIME DEFAULT CURRENT_TIMESTAMP"),

    # ── forecasts ─────────────────────────────────────────────────────
    ("forecasts", "user_id",         "INT NOT NULL DEFAULT 1"),
    ("forecasts", "dataset_id",      "INT NOT NULL DEFAULT 1"),
    ("forecasts", "model_type",      "VARCHAR(50) DEFAULT 'linear_regression'"),
    ("forecasts", "periods",         "INT DEFAULT 30"),
    ("forecasts", "accuracy",        "FLOAT NULL"),
    ("forecasts", "r2_score",        "FLOAT NULL"),
    ("forecasts", "predictions",     "LONGTEXT NULL"),
    ("forecasts", "feature_column",  "VARCHAR(255) NULL"),
    ("forecasts", "target_column",   "VARCHAR(255) NULL"),
    ("forecasts", "date_column",     "VARCHAR(255) NULL"),
    ("forecasts", "status",          "VARCHAR(50) DEFAULT 'pending'"),
    ("forecasts", "error_message",   "TEXT NULL"),
    ("forecasts", "created_at",      "DATETIME DEFAULT CURRENT_TIMESTAMP"),
]

def col_exists(conn, table, column):
    n = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() "
        "AND TABLE_NAME = :t AND COLUMN_NAME = :c"
    ), {"t": table, "c": column}).scalar()
    return int(n) > 0

def table_exists(conn, table):
    n = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t"
    ), {"t": table}).scalar()
    return int(n) > 0

with engine.begin() as conn:
    for table, col, defn in COLUMNS_TO_ADD:
        if not table_exists(conn, table):
            print(f"  ⏭  Table '{table}' does not exist yet — will be created by app startup")
            continue
        if not col_exists(conn, table, col):
            try:
                conn.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{col}` {defn}"))
                print(f"  ✅ Added   {table}.{col}")
            except Exception as e:
                print(f"  ❌ Failed  {table}.{col}: {e}")
        else:
            print(f"  ✔  Exists  {table}.{col}")

print("\n✅ Migration complete. Restart uvicorn now.")
