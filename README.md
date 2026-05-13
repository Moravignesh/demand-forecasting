# ⚡ DemandAI — AI-Powered Demand Forecasting Platform

A full-stack web application that allows users to upload historical sales datasets, generate AI-based demand predictions, and visualize analytics through interactive dashboards.

---

## 🏗️ Tech Stack

| Layer     | Technologies                                              |
|-----------|-----------------------------------------------------------|
| Backend   | FastAPI, SQLAlchemy, MySQL, JWT Auth, Pandas, Scikit-learn, Prophet |
| Frontend  | React.js, Tailwind CSS, Axios, Recharts                   |

---

## 📁 Project Structure

```
demand-forecasting/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # DB connection & session
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── dataset.py
│   │   └── forecast.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── user.py
│   │   ├── dataset.py
│   │   └── forecast.py
│   ├── routers/                 # API route handlers
│   │   ├── auth.py
│   │   ├── datasets.py
│   │   ├── forecasting.py
│   │   ├── dashboard.py
│   │   └── reports.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── dataset_service.py
│   │   ├── forecasting_service.py
│   │   └── report_service.py
│   └── uploads/                 # Uploaded dataset files
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js / index.css
        ├── api/axios.js
        ├── context/AuthContext.js
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Datasets.jsx
            ├── Forecast.jsx
            └── Reports.jsx
```

---

## ⚙️ Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **MySQL 8+** running locally

---

## 🚀 Setup Instructions

### 1. MySQL Database

Open MySQL and run:

```sql
CREATE DATABASE demand_forecasting;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start server
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`  
API Docs (Swagger): `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React app
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## 🔧 Environment Variables (backend/.env)

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/demand_forecasting
SECRET_KEY=your-super-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 📦 Features

### ✅ Authentication
- User registration and login
- JWT token-based authentication
- Protected routes on both frontend and backend

### ✅ Dataset Management
- Upload CSV and Excel files
- Automatic data cleaning (duplicates, missing values)
- Dataset preview with column types and missing value counts
- Dataset deletion

### ✅ AI Forecasting
- **Linear Regression** — Fast, time-feature based forecasting
- **Prophet** — Facebook's time series forecasting model
- Configurable: date column, target column, forecast periods
- View historical fit + future predictions in interactive charts
- Accuracy metrics: MAE and R² Score

### ✅ Dashboard
- Total datasets, forecasts, accuracy metrics
- Monthly forecast trend bar chart
- Recent forecast history

### ✅ Reports
- Export forecast reports as **Excel** (3 sheets: Summary, Future, Historical)
- Export as **PDF** (formatted with tables and metrics)

---

## 📊 Sample Dataset Format

Your CSV/Excel file should have at least:
- A **date column** (e.g., `date`, `Date`, `order_date`)
- A **numeric target column** (e.g., `sales`, `demand`, `quantity`)

Example:
```
date,product,sales
2023-01-01,Widget A,150
2023-01-02,Widget A,162
2023-01-03,Widget A,145
...
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/datasets/` | List datasets |
| POST | `/api/datasets/upload` | Upload dataset |
| GET  | `/api/datasets/{id}/preview` | Preview dataset |
| DELETE | `/api/datasets/{id}` | Delete dataset |
| POST | `/api/forecasts/` | Run forecast |
| GET  | `/api/forecasts/` | List forecasts |
| GET  | `/api/forecasts/{id}/predictions` | Get predictions |
| GET  | `/api/dashboard/analytics` | Dashboard data |
| GET  | `/api/dashboard/sales-summary/{id}` | Sales summary |
| GET  | `/api/reports/{id}/excel` | Download Excel report |
| GET  | `/api/reports/{id}/pdf` | Download PDF report |

---

## 🛠️ Troubleshooting

**MySQL connection error:** Check your `.env` DATABASE_URL credentials and ensure MySQL is running.

**Prophet installation issues:** Try `pip install prophet --no-cache-dir`. On Windows, you may need Visual C++ Build Tools.

**CORS errors:** Ensure backend is running on port 8000. The frontend proxies to `localhost:8000`.

**Port conflicts:** Backend uses `8000`, frontend uses `3000`. Make sure both are free.
