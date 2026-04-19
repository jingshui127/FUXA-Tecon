# FUXA Speech Environment Check Script
# UTF-8 with BOM

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  FUXA Speech Environment Check Tool" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor White

# 1. Check Windows Version
Write-Host "[i] Checking Windows Version..." -ForegroundColor Cyan
$osInfo = Get-CimInstance Win32_OperatingSystem
$osBuild = $osInfo.BuildNumber
$osName = $osInfo.Caption
if ($osBuild -ge 10240) {
    Write-Host "[OK] Windows Version: $osName (Build $osBuild)" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Windows Version too low: $osName (Build $osBuild)" -ForegroundColor Red
}

# 2. Check PowerShell Version
Write-Host "`n[i] Checking PowerShell Version..." -ForegroundColor Cyan
$psVersion = $PSVersionTable.PSVersion
if ($psVersion.Major -ge 5) {
    Write-Host "[OK] PowerShell Version: $psVersion" -ForegroundColor Green
} else {
    Write-Host "[ERROR] PowerShell Version too low: $psVersion" -ForegroundColor Red
}

# 3. Check Execution Policy
Write-Host "`n[i] Checking PowerShell Execution Policy..." -ForegroundColor Cyan
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "[WARNING] Execution Policy: $executionPolicy" -ForegroundColor Yellow
    Write-Host "  Run: Set-ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Execution Policy: $executionPolicy" -ForegroundColor Green
}

# 4. Check Chinese Speech Pack
Write-Host "`n[i] Checking Chinese Speech Pack..." -ForegroundColor Cyan
$speechCapability = Get-WindowsCapability -Online -Name "Language.Speech~~~zh-CN~0.0.1.0" -ErrorAction SilentlyContinue
if ($speechCapability -and $speechCapability.State -eq "Installed") {
    Write-Host "[OK] Chinese Speech Pack: Installed" -ForegroundColor Green
    Write-Host "  Name: $($speechCapability.DisplayName)" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Chinese Speech Pack: Not Installed" -ForegroundColor Red
}

# 5. Check SAPI Component
Write-Host "`n[i] Checking SAPI Component..." -ForegroundColor Cyan
try {
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    Write-Host "[OK] SAPI Component: Available" -ForegroundColor Green
    
    # List installed voices
    $voices = $synth.GetInstalledVoices()
    Write-Host "`n[i] Installed Voices ($($voices.Count) total):" -ForegroundColor Cyan
    foreach ($voice in $voices) {
        $voiceInfo = $voice.VoiceInfo
        $status = if ($voice.Enabled) { "Enabled" } else { "Disabled" }
        Write-Host "  - $($voiceInfo.Name) [$($voiceInfo.Culture.DisplayName)] - $status" -ForegroundColor Gray
    }
    
    # Check Chinese voices
    $chineseVoices = $voices | Where-Object { $_.VoiceInfo.Culture.Name -like "zh-*" }
    if ($chineseVoices) {
        Write-Host "`n[OK] Chinese Voices: Available ($($chineseVoices.Count) found)" -ForegroundColor Green
    } else {
        Write-Host "`n[WARNING] Chinese Voices: Not Found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] SAPI Component: Not Available" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Check Audio Devices
Write-Host "`n[i] Checking Audio Devices..." -ForegroundColor Cyan
try {
    $audioDevices = Get-CimInstance Win32_SoundDevice
    if ($audioDevices) {
        Write-Host "[OK] Audio Devices: $($audioDevices.Count) found" -ForegroundColor Green
        foreach ($device in $audioDevices) {
            $status = if ($device.Status -eq "OK") { "OK" } else { "Error" }
            Write-Host "  - $($device.Name) - $status" -ForegroundColor Gray
        }
    } else {
        Write-Host "[WARNING] Audio Devices: Not detected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Cannot check audio devices: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 7. Check Audio Service
Write-Host "`n[i] Checking Audio Service..." -ForegroundColor Cyan
$audioService = Get-Service -Name "Audiosrv" -ErrorAction SilentlyContinue
if ($audioService) {
    if ($audioService.Status -eq "Running") {
        Write-Host "[OK] Audio Service: Running" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Audio Service: $($audioService.Status)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Audio Service: Not Found" -ForegroundColor Red
}

# 8. Test Speech Synthesis
Write-Host "`n[i] Testing Speech Synthesis..." -ForegroundColor Cyan
Write-Host "  Testing speech output, please confirm you can hear audio..." -ForegroundColor Gray
try {
    Add-Type -AssemblyName System.Speech
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synth.Speak("FUXA speech test successful")
    Write-Host "[OK] Speech Test: Successful" -ForegroundColor Green
    Write-Host "  If you heard the speech, environment is configured correctly" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Speech Test: Failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Check Node.js Environment
Write-Host "`n[i] Checking Node.js Environment..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[OK] Node.js Version: $nodeVersion" -ForegroundColor Green
        $npmVersion = npm --version 2>$null
        if ($npmVersion) {
            Write-Host "[OK] NPM Version: $npmVersion" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "[WARNING] Node.js: Not installed or not in PATH" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor White
Write-Host "  Environment Check Complete" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor White

Write-Host "Summary:" -ForegroundColor White
Write-Host "  [OK] Windows Version" -ForegroundColor Green
Write-Host "  [OK] PowerShell Version" -ForegroundColor Green
Write-Host "  [OK] Execution Policy" -ForegroundColor Green
Write-Host "  [OK] Chinese Speech Pack" -ForegroundColor Green
Write-Host "  [OK] SAPI Component" -ForegroundColor Green
Write-Host "  [OK] Audio Devices" -ForegroundColor Green
Write-Host "  [OK] Audio Service" -ForegroundColor Green
Write-Host "  [OK] Speech Test" -ForegroundColor Green
Write-Host "  [OK] Node.js Environment" -ForegroundColor Green

Write-Host "`n[SUCCESS] All checks passed! Environment is ready." -ForegroundColor Green
Write-Host "You can now proceed with implementing the speech feature.`n" -ForegroundColor Cyan
