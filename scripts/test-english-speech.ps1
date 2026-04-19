# Simple English Speech Test
$baseUrl = "http://localhost:1881"

Write-Host "Testing English speech..." -ForegroundColor Cyan

$body = @{
    text = "Hello, this is a test"
} | ConvertTo-Json -Compress

$result = Invoke-RestMethod -Uri "$baseUrl/api/alarms/speech/test" -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
Write-Host "Result: $($result.message)" -ForegroundColor Green
Write-Host "Did you hear 'Hello, this is a test'?" -ForegroundColor Yellow
