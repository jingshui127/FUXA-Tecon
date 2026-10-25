# FUXA PRO smoke test (shared by local build and CI)
# Checks: service reachability, Node-RED entry points, compiled frontend bundles, startup log markers.
# ASCII-only output on purpose: this file is read by both PowerShell 5.1 and pwsh without encoding surprises.

[CmdletBinding()]
param(
    [string]$BaseUrl = 'http://127.0.0.1:1881',
    [int]$WaitSeconds = 0,
    [string]$LogFile = '',
    [switch]$StrictDashboard
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')
$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Get-Status([string]$url) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        return [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

# 1. optional wait for startup
if ($WaitSeconds -gt 0) {
    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    $ready = $false
    while ((Get-Date) -lt $deadline) {
        if ((Get-Status "$BaseUrl/") -gt 0) { $ready = $true; break }
        Start-Sleep -Seconds 3
    }
    if (-not $ready) {
        $failures.Add("service not reachable within ${WaitSeconds}s at $BaseUrl")
    }
}

# 2. entry points
$paths = @('/', '/flows', '/nodered')
foreach ($path in $paths) {
    $status = Get-Status "$BaseUrl$path"
    if ($status -ge 200 -and $status -lt 400) {
        Write-Host "[smoke] PASS $path HTTP $status"
    } else {
        $failures.Add("$path HTTP $status")
    }
}

$dashStatus = Get-Status "$BaseUrl/dashboard"
if ($dashStatus -ge 200 -and $dashStatus -lt 400) {
    Write-Host "[smoke] PASS /dashboard HTTP $dashStatus"
} elseif ($dashStatus -eq 404 -and -not $StrictDashboard) {
    $warnings.Add('/dashboard returned 404 (normal when no Dashboard flow is configured)')
} else {
    $failures.Add("/dashboard HTTP $dashStatus")
}

# 3. compiled bundles referenced by index.html (white-screen guard)
try {
    $index = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 10
    $matches = [regex]::Matches($index.Content, '(?:src|href)="([^"]*\.(?:js|css))"')
    $bundles = @()
    foreach ($match in $matches) {
        $reference = $match.Groups[1].Value
        if ($reference -match '^(main|styles|runtime|polyfills)\.[^/]*\.(js|css)$') {
            if ($bundles -notcontains $reference) { $bundles += $reference }
        }
    }
    if ($bundles.Count -eq 0) {
        $failures.Add('no compiled bundle (main.*.js / styles.*.css) referenced by index.html')
    } else {
        foreach ($bundle in $bundles) {
            $status = Get-Status "$BaseUrl/$bundle"
            if ($status -ge 200 -and $status -lt 400) {
                Write-Host "[smoke] PASS /$bundle HTTP $status"
            } else {
                $failures.Add("/$bundle HTTP $status")
            }
        }
    }
} catch {
    $failures.Add("index.html not readable: $($_.Exception.Message)")
}

# 4. startup log markers
if ($LogFile -ne '') {
    if (-not (Test-Path $LogFile)) {
        $failures.Add("log file not found: $LogFile")
    } else {
        $log = Get-Content $LogFile -Raw
        if ($log -match '\[Node-RED\] Started at /flows') {
            Write-Host '[smoke] PASS startup log contains [Node-RED] Started at /flows'
        } else {
            $failures.Add('startup log missing "[Node-RED] Started at /flows"')
        }
        if ($log -match "Cannot find package 'got'") {
            $failures.Add("startup log contains Cannot find package 'got'")
        } else {
            Write-Host '[smoke] PASS startup log has no missing got package error'
        }
    }
}

foreach ($warning in $warnings) {
    Write-Host "[smoke] WARN $warning"
}

if ($failures.Count -gt 0) {
    foreach ($failure in $failures) {
        Write-Host "[smoke] FAIL $failure"
    }
    Write-Host "[smoke] FAILED ($($failures.Count) issue(s))"
    exit 1
}

Write-Host '[smoke] ALL CHECKS PASSED'
exit 0
