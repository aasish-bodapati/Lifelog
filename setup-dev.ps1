# Lifelog Development Setup Script
# Run this script to set up the development environment

Write-Host "🚀 Setting up Lifelog development environment..." -ForegroundColor Green

# Check if Python is installed
Write-Host "`n📋 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host "`n📋 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 16+ first." -ForegroundColor Red
    exit 1
}

# Setup Backend
Write-Host "`n🔧 Setting up FastAPI backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host "✅ Backend setup complete!" -ForegroundColor Green

# Setup Frontend
Write-Host "`n🔧 Setting up React Native frontend..." -ForegroundColor Yellow
Set-Location ..\frontend

# Install dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

Write-Host "✅ Frontend setup complete!" -ForegroundColor Green

# Return to root directory
Set-Location ..

Write-Host "`n🎉 Development environment setup complete!" -ForegroundColor Green
Write-Host "`n📖 Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: .\start-backend.ps1" -ForegroundColor White
Write-Host "2. Start the frontend: .\start-frontend.ps1" -ForegroundColor White
Write-Host "3. Install Expo Go on your phone and scan the QR code" -ForegroundColor White
Write-Host "4. Or run on emulator: cd frontend && npm run android/ios" -ForegroundColor White

Write-Host "`n🔗 API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📱 Expo development server will be available at: http://localhost:8081" -ForegroundColor Cyan
Write-Host "🌐 Web version available at: http://localhost:19006" -ForegroundColor Cyan
