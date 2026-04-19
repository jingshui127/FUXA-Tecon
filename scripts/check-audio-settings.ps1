# Check System Volume and Audio Settings
Write-Host "Checking system audio settings..." -ForegroundColor Cyan

# Check audio service
$audioService = Get-Service Audiosrv
Write-Host "Audio Service: $($audioService.Status)" -ForegroundColor Yellow

# Check sound devices
Write-Host "`nSound Devices:" -ForegroundColor Cyan
Get-CimInstance Win32_SoundDevice | ForEach-Object {
    Write-Host "  $($_.Name) - Status: $($_.Status)" -ForegroundColor Green
}

# Test with a simple beep
Write-Host "`nTesting system beep..." -ForegroundColor Cyan
[System.Console]::Beep(1000, 500)

Write-Host "`nTesting SAPI speech..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Set volume to max
$synth.Volume = 100
Write-Host "Speech Volume: $($synth.Volume)" -ForegroundColor Yellow

# Get current voice
Write-Host "Current Voice: $($synth.Voice.Name)" -ForegroundColor Yellow

# Speak test
$synth.Speak("系统音量测试，如果您听到此消息，说明音频正常工作")

Write-Host "`nDid you hear the speech?" -ForegroundColor Yellow
