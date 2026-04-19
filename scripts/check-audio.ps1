# Check Audio Output Devices
Write-Host "Checking audio output devices..." -ForegroundColor Cyan

# Get audio devices using .NET
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class AudioDevices {
    [DllImport("winmm.dll", SetLastError = true)]
    public static extern int waveOutGetNumDevs();
}
"@

$deviceCount = [AudioDevices]::waveOutGetNumDevs()
Write-Host "Number of audio output devices: $deviceCount" -ForegroundColor Yellow

# Check default audio device using PowerShell
Get-CimInstance Win32_SoundDevice | ForEach-Object {
    Write-Host "Sound Device: $($_.Name) - Status: $($_.Status)" -ForegroundColor Green
}

# Test audio
Write-Host "`nTesting audio with PowerShell..." -ForegroundColor Cyan
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Speak("Audio test")

Write-Host "`nDid you hear 'Audio test'?" -ForegroundColor Yellow
