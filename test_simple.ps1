# Simple Test Script
Write-Host "🚀 Starting simple test..." -ForegroundColor Green

# Test basic REST call to BACKEND port 3001
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/logs?key=KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_Blockspin_1772032064219_j2bbybmdjnd&game=Bloxfruit" -Method Get
    Write-Host "✅ API Test Success!" -ForegroundColor Green
    Write-Host "📝 Response: $($response | ConvertTo-Json -Depth 5)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API Test Failed!" -ForegroundColor Red
    Write-Host "🔍 Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎯 Test completed!" -ForegroundColor Green
