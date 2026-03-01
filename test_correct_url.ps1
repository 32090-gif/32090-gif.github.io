# Test with Correct URL
Write-Host "🔍 Testing Dashboard API with correct URL..." -ForegroundColor Yellow
Write-Host ""

# Test URLs
$backendUrl = "http://localhost:3001/api/dashboard/logs"
$frontendUrl = "http://localhost:8081/api/dashboard/logs"

Write-Host "📡 Backend URL (Correct): $backendUrl" -ForegroundColor Green
Write-Host "🌐 Frontend URL (Wrong): $frontendUrl" -ForegroundColor Red
Write-Host ""

# Test with different keys
$blockspinKey = "KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_Blockspin_1772032064219_j2bbybmdjnd"
$bloxfruitKey = "KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_Bloxfruit_1772032064219_scfk74ikjr"

Write-Host "🔑 Testing Blockspin Key..." -ForegroundColor Cyan
try {
    $url = "$backendUrl?key=$blockspinKey&game=Bloxfruit"
    $response = Invoke-RestMethod -Uri $url -Method Get
    Write-Host "✅ Blockspin Key Test Success!" -ForegroundColor Green
    Write-Host "📝 Status: $($response.status)" -ForegroundColor White
    Write-Host "📄 Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "❌ Blockspin Key Test Failed!" -ForegroundColor Red
    Write-Host "🔍 Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔑 Testing Bloxfruit Key..." -ForegroundColor Cyan
try {
    $url = "$backendUrl?key=$bloxfruitKey&game=Bloxfruit"
    $response = Invoke-RestMethod -Uri $url -Method Get
    Write-Host "✅ Bloxfruit Key Test Success!" -ForegroundColor Green
    Write-Host "📝 Status: $($response.status)" -ForegroundColor White
    Write-Host "📄 Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "❌ Bloxfruit Key Test Failed!" -ForegroundColor Red
    Write-Host "🔍 Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 All tests completed!" -ForegroundColor Green
Write-Host "📝 Remember: Use port 3001 for API, not 8081!" -ForegroundColor Yellow
