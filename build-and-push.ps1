[CmdletBinding()]
param(
    [string]$Branch = '1.3.5-PRO',
    [string]$CommitMessage = 'chore: build and publish latest changes',
    [string]$OutputPath = 'artifacts\fuxa-pro-headless.exe',
    [switch]$SkipCommit,
    [switch]$SkipPush
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root
$BuildMutex = New-Object System.Threading.Mutex($false, 'Global\FuxaProHeadlessBuild')
if (-not $BuildMutex.WaitOne(0)) {
    throw 'Another FUXA build is already running. Stop it before starting a new build.'
}

$BuildLog = Join-Path $Root 'artifacts\build-parallel.log'
$BuildErrorLog = Join-Path $Root 'artifacts\build-parallel-error.log'
$PushLog = Join-Path $Root 'artifacts\push-parallel.log'
$PushErrorLog = Join-Path $Root 'artifacts\push-parallel-error.log'
New-Item -ItemType Directory -Force (Split-Path $BuildLog) | Out-Null
Remove-Item $BuildLog, $BuildErrorLog, $PushLog, $PushErrorLog -Force -ErrorAction SilentlyContinue

function Start-ParallelProcess {
    param([string]$Name, [string]$Command, [string]$LogPath, [string]$ErrorLogPath)
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
    $args = "-NoProfile -ExecutionPolicy Bypass -EncodedCommand $encoded"
    $process = Start-Process powershell.exe -ArgumentList $args -WorkingDirectory $Root -RedirectStandardOutput $LogPath -RedirectStandardError $ErrorLogPath -PassThru
    Write-Host "[$Name] started (PID $($process.Id))"
    return $process
}

$buildCommand = @"
`$ErrorActionPreference = 'Stop'
`$start = Get-Date
Write-Output '[BUILD] Syncing server source'
robocopy 'server' 'fuxa-headless/server' /E /NFL /NDL /NJH /NJS /XD '.git' 'node_modules' '_pkg' '_appdata' 'data' | Out-Null
if (`$LASTEXITCODE -ge 8) { throw "server sync failed: `$LASTEXITCODE" }
Write-Output '[BUILD] Syncing client dist'
robocopy 'client/dist' 'fuxa-headless/client/dist' /E /NFL /NDL /NJH /NJS | Out-Null
if (`$LASTEXITCODE -ge 8) { throw "client sync failed: `$LASTEXITCODE" }
Copy-Item 'app/headless/headless-guardian.js' 'fuxa-headless/main.js' -Force
Write-Output '[BUILD] Installing headless dependencies'
Push-Location 'fuxa-headless'
& npm ci --omit=dev --no-audit --no-fund
if (`$LASTEXITCODE -ne 0) { Pop-Location; throw "npm ci failed: `$LASTEXITCODE" }
Pop-Location
Write-Output '[BUILD] Patching Node-RED'
& node 'fuxa-headless/server/scripts/patch-nodered.js'
if (`$LASTEXITCODE -ne 0) { throw "Node-RED patch failed: `$LASTEXITCODE" }
if (-not (Test-Path 'fuxa-headless/node_modules/got/package.json')) { throw 'fuxa-headless/node_modules/got is missing' }
Write-Output '[BUILD] Packaging EXE'
& pkg 'fuxa-headless/package.json' --targets node18-win-x64 --output '$OutputPath'
if (`$LASTEXITCODE -ne 0) { throw "pkg failed: `$LASTEXITCODE" }
`$exe = Get-Item '$OutputPath'
`$seconds = [math]::Round(((Get-Date)-`$start).TotalSeconds)
`$sizeMb = [math]::Round(`$exe.Length/1MB, 1)
Write-Output "[BUILD] SUCCESS seconds=`$seconds sizeMB=`$sizeMb path=`$(`$exe.FullName)"
"@

$skipCommitValue = if ($SkipCommit.IsPresent) { '$true' } else { '$false' }
$skipPushValue = if ($SkipPush.IsPresent) { '$true' } else { '$false' }

if (-not $SkipCommit) {
    Write-Host '[GIT] Preparing commit before parallel tasks'
    $currentBranch = (git branch --show-current).Trim()
    if ($currentBranch -ne $Branch) { throw "expected branch '$Branch', got '$currentBranch'" }
    git add -u -- docs server fuxa-headless/main.js node-red .github/workflows/headless_tecon.yml fuxa-headless/package.json server/package.json server/package-lock.json fuxa-headless/server/package-lock.json
    git add -- build-and-push.ps1
    if ($LASTEXITCODE -ne 0) { throw "git add failed: $LASTEXITCODE" }
    if (-not (git diff --cached --quiet)) {
        git commit -m $CommitMessage
        if ($LASTEXITCODE -ne 0) { throw "git commit failed: $LASTEXITCODE" }
    } else {
        Write-Host '[GIT] No staged changes to commit'
    }
}

$pushCommand = @"
`$ErrorActionPreference = 'Stop'
Write-Output '[GIT] Checking branch'
`$branch = (git branch --show-current).Trim()
if (`$branch -ne '$Branch') { throw "expected branch '$Branch', got '`$branch'" }
if (-not $skipPushValue) {
    git push origin '$Branch'
    if (`$LASTEXITCODE -ne 0) { throw "git push failed: `$LASTEXITCODE" }
    Write-Output '[GIT] SUCCESS pushed origin/$Branch'
} else {
    Write-Output '[GIT] Push skipped'
}
"@

$build = Start-ParallelProcess -Name 'BUILD' -Command $buildCommand -LogPath $BuildLog -ErrorLogPath $BuildErrorLog
$push = Start-ParallelProcess -Name 'GIT' -Command $pushCommand -LogPath $PushLog -ErrorLogPath $PushErrorLog

$build.WaitForExit()
$push.WaitForExit()
$build.Refresh()
$push.Refresh()

Write-Host "`n===== BUILD RESULT ====="
Get-Content $BuildLog -ErrorAction SilentlyContinue | Write-Host
Write-Host "ExitCode=$($build.ExitCode)"
Get-Content $BuildErrorLog -ErrorAction SilentlyContinue | Write-Host
Write-Host "`n===== GIT RESULT ====="
Get-Content $PushLog -ErrorAction SilentlyContinue | Write-Host
Write-Host "ExitCode=$($push.ExitCode)"
Get-Content $PushErrorLog -ErrorAction SilentlyContinue | Write-Host

if ($build.ExitCode -ne 0 -or $push.ExitCode -ne 0) {
    Write-Error 'Parallel build/push finished with errors. Check artifacts\build-parallel*.log and artifacts\push-parallel*.log.'
    exit 1
}

Write-Host "`nParallel build and Git push completed successfully."
