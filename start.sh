#!/bin/bash
echo "=========================================="
echo " DemandAI - Starting Development Servers"
echo "=========================================="

# Backend
echo ""
echo "[1/2] Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

echo "Starting FastAPI server on port 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo ""
echo "[2/2] Setting up Frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
  echo "Installing npm packages..."
  npm install
fi

echo "Starting React app on port 3000..."
npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
