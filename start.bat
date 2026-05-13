@echo off
echo ==========================================
echo  DemandAI - Starting Development Servers
echo ==========================================

echo.
echo [1/2] Starting Backend (FastAPI)...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo.
echo [2/2] Starting Frontend (Vite + React)...
cd ..\frontend
if not exist node_modules (
    echo Installing npm packages...
    npm install
)
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ==========================================
