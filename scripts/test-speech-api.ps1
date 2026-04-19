# FUXA Speech API Test Script (No Authentication Required)
# FUXA 语音播报 API 测试脚本（无需认证）
# UTF-8 Encoding with BOM

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

$baseUrl = "http://localhost:1881"

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  FUXA Speech API Test" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor White

# Test 1: Get Speech Status
Write-Host "[Test 1] Getting speech status..." -ForegroundColor Cyan
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/api/alarms/speech/status" -Method Get
    Write-Host "  Status:" -ForegroundColor Green
    Write-Host "    Enabled: $($status.enabled)"
    Write-Host "    Total spoken: $($status.totalSpoken)"
    Write-Host "    Errors: $($status.errors)"
    Write-Host "  Result: SUCCESS`n" -ForegroundColor Green
} catch {
    Write-Host "  Result: FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 2: Test Speech with English
Write-Host "[Test 2] Testing speech synthesis (English)..." -ForegroundColor Cyan
try {
    $jsonBody = '{"text":"Hello, this is a test"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    
    $result = Invoke-RestMethod -Uri "$baseUrl/api/alarms/speech/test" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes
    Write-Host "  Speaking: 'Hello, this is a test'"
    Write-Host "  Result: $($result.message)`n" -ForegroundColor Green
} catch {
    Write-Host "  Result: FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 3: Test Speech with Chinese
Write-Host "[Test 3] Testing speech synthesis (Chinese)..." -ForegroundColor Cyan
try {
    $jsonBody = '{"text":"语音播报测试成功"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    
    $result = Invoke-RestMethod -Uri "$baseUrl/api/alarms/speech/test" -Method Post -ContentType "application/json; charset=utf-8" -Body $bytes
    Write-Host "  Speaking: '语音播报测试成功'"
    Write-Host "  Result: $($result.message)`n" -ForegroundColor Green
} catch {
    Write-Host "  Result: FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Get Available Voices
Write-Host "[Test 4] Getting available voices..." -ForegroundColor Cyan
try {
    $voices = Invoke-RestMethod -Uri "$baseUrl/api/alarms/speech/voices" -Method Get
    Write-Host "  Found $($voices.Count) voices:" -ForegroundColor Green
    foreach ($voice in $voices) {
        Write-Host "    - $($voice.name) [$($voice.cultureName)]"
    }
    Write-Host "  Result: SUCCESS`n" -ForegroundColor Green
} catch {
    Write-Host "  Result: FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor White
Write-Host "  All tests completed!" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor White
