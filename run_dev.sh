#!/bin/bash
# Start backend
echo "Starting FastAPI backend..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting Vite frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "====================================="
echo "Both servers are running."
echo "Backend API: http://localhost:8000"
echo "Frontend App: http://localhost:5173"
echo "IMPORTANT: Ensure MongoDB is running on mongodb://localhost:27017"
echo "Press Ctrl+C to stop both servers."
echo "====================================="

# Handle termination
trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
