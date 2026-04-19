# Direct SAPI Test
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

Write-Host "Testing SAPI directly..." -ForegroundColor Cyan
Write-Host "Available voices:" -ForegroundColor Yellow
$voices = $synth.GetInstalledVoices()
foreach ($v in $voices) {
    Write-Host "  - $($v.VoiceInfo.Name) [$($v.VoiceInfo.Culture.Name)]"
}

Write-Host "`nSpeaking English: 'Hello, this is a test'" -ForegroundColor Yellow
$synth.Speak("Hello, this is a test")

Write-Host "`nSpeaking Chinese: '语音播报测试'" -ForegroundColor Yellow
$synth.Speak("语音播报测试")

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "Did you hear both messages?" -ForegroundColor Yellow
