# Test Dashboard API - Fixed Version
$dashboardKey = "KD_1c6d0c1d-6e85-457c-9fd0-de871b7818f9_Bloxfruit_1772032064219_scfk74ikjr"
$gameName = "Bloxfruit"

Write-Host "🔍 Testing Dashboard API..." -ForegroundColor Yellow
Write-Host "🔑 Dashboard Key: $dashboardKey" -ForegroundColor Cyan
Write-Host "🎮 Game: $gameName" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check dashboard logs
Write-Host "📊 Test 1: Checking dashboard logs..." -ForegroundColor Green
try {
    # Build URL with proper escaping
    $baseUrl = "http://localhost:3001/api/dashboard/logs"
    $queryParams = "key=$dashboardKey&game=$gameName"
    $fullUrl = "$baseUrl`?$queryParams"
    
    Write-Host "🔗 Requesting: $fullUrl" -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri $fullUrl -Method Get
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "📝 Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "📄 Message: $($response.message)" -ForegroundColor Cyan
    Write-Host "👤 Players: $($response.data.players)" -ForegroundColor Cyan
    Write-Host "🕐 Last Updated: $($response.data.lastUpdated)" -ForegroundColor Cyan
    Write-Host ""
    
    # Show player data if exists
    if ($response.data.playersData) {
        Write-Host "👥 Player Data:" -ForegroundColor Yellow
        $response.data.playersData.PSObject.Properties | ForEach-Object {
            Write-Host "  📝 $($_.Name): $($_.Value)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "🔍 Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Send test data
Write-Host "📤 Test 2: Sending test data..." -ForegroundColor Green
$testData = @{
    key = $dashboardKey
    data = @{
        "TestPlayer" = @{
            accessories = "Test Hat,Test Cape"
            bounty = 1000000
            dark_fragment = 0
            devil_fruit = "Test Fruit"
            fragment = 5000
            fruit_inventory = "Test Fruit"
            gun = "Test Gun"
            level = "100"
            lever = $true
            leviathan_heart = 0
            material = "None"
            melee = "Test Sword"
            mirror = $true
            money = 500000
            pc = "CHANGE-ME"
            race = "Human"
            sword = "Test Sword"
            type = "TEST | PLAYER"
            updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss")
            valkyrie = $true
            world = 1
        }
    }
}

try {
    $jsonBody = $testData | ConvertTo-Json -Depth 10
    Write-Host "📤 Sending JSON: $jsonBody" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard/update" -Method Post -Body $jsonBody -ContentType "application/json"
    
    Write-Host "✅ Data sent successfully!" -ForegroundColor Green
    Write-Host "📝 Status: $($response.success)" -ForegroundColor Cyan
    Write-Host "📄 Message: $($response.message)" -ForegroundColor Cyan
    Write-Host ""
    
    # Show updated data
    if ($response.data) {
        Write-Host "📊 Updated Data:" -ForegroundColor Yellow
        Write-Host "  👥 Total Players: $($response.data.stats.totalPlayers)" -ForegroundColor White
        Write-Host "  💰 Total Money: $($response.data.stats.totalMoney)" -ForegroundColor White
        Write-Host "  📈 Average Level: $($response.data.stats.avgLevel)" -ForegroundColor White
        Write-Host "  🕐 Last Update: $($response.data.stats.lastUpdate)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "🔍 Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Test completed!" -ForegroundColor Green
Write-Host "📝 Check the dashboard at: http://localhost:8081/dashboard" -ForegroundColor Cyan
