# Start Lifelog Frontend Development Server (Expo)
Write-Host "🚀 Starting Lifelog Frontend Development Server (Expo)..." -ForegroundColor Green

Set-Location frontend

# Start Expo development server
Write-Host "Starting Expo development server..." -ForegroundColor Yellow
Write-Host "`n📱 To run on device:" -ForegroundColor Cyan
Write-Host "  1. Install Expo Go app on your phone" -ForegroundColor White
Write-Host "  2. Scan the QR code that appears" -ForegroundColor White
Write-Host "`n💻 To run on emulator:" -ForegroundColor Cyan
Write-Host "  Android: npm run android" -ForegroundColor White
Write-Host "  iOS: npm run ios" -ForegroundColor White
Write-Host "  Web: npm run web" -ForegroundColor White

npm start
