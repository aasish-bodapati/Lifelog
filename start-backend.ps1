# Start Lifelog Backend Server
Write-Host "🚀 Starting Lifelog Backend Server..." -ForegroundColor Green

Set-Location backend

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Start FastAPI server
Write-Host "Starting FastAPI server on http://localhost:8000..." -ForegroundColor Yellow
uvicorn main:app --reload --host 0.0.0.0 --port 8000
