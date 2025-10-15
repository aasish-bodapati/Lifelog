# Fix Expo SDK 54 Setup
Write-Host "🔧 Fixing Expo SDK 54 setup..." -ForegroundColor Green

Set-Location frontend

Write-Host "Removing old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }

Write-Host "Installing fresh dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Starting Expo..." -ForegroundColor Yellow
npx expo start --clear

