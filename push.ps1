<#
  带重试的推送脚本
  适用场景：github.com:443 时通时断、连接被重置，单次推送经常失败。
  用法：
    .\push.ps1                        # 推送当前分支到 private
    .\push.ps1 -Branch 1.3.5-2918     # 指定分支
    .\push.ps1 -Retries 20            # 增加重试次数
    .\push.ps1 -Remote upstream       # 换远端
#>
param(
    [string]$Remote = 'private',
    [string]$Branch = '',
    [int]$Retries = 10,
    [int]$DelaySeconds = 12
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot
try {
    if (-not $Branch) {
        $Branch = (git rev-parse --abbrev-ref HEAD).Trim()
    }

    $null = git rev-parse --verify "$Remote/$Branch" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[push] 远端分支 $Remote/$Branch 尚不存在，将新建。" -ForegroundColor Yellow
        $pending = (git rev-list --count HEAD)
    }
    else {
        $pending = (git rev-list --count "$Remote/$Branch..HEAD").Trim()
        if ($pending -eq '0') {
            Write-Host "[push] $Branch 已与 $Remote/$Branch 同步，无需推送。" -ForegroundColor Green
            exit 0
        }
    }

    Write-Host "[push] 待推送 $pending 个提交 -> $Remote/$Branch" -ForegroundColor Cyan
    git --no-pager log --oneline -n $pending
    Write-Host ""

    for ($i = 1; $i -le $Retries; $i++) {
        Write-Host "[push] 第 $i/$Retries 次尝试..." -ForegroundColor Yellow
        $out = git -c http.postBuffer=524288000 push $Remote "HEAD:$Branch" 2>&1 | Out-String

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[push] 成功：$Branch 已推送到 $Remote。" -ForegroundColor Green
            exit 0
        }

        $reason = ($out -split "`n" | Where-Object { $_ -match 'fatal|error|rejected|denied' } | Select-Object -First 1)
        if ($reason) { Write-Host "[push] 失败：$($reason.Trim())" -ForegroundColor Red }

        if ($out -match 'rejected|non-fast-forward') {
            Write-Host "[push] 远端有本地未包含的提交，请先执行 git pull --rebase 再推送。" -ForegroundColor Red
            exit 2
        }
        if ($out -match 'Authentication failed|could not read Username|403') {
            Write-Host "[push] 认证失败，请检查远端地址中的令牌是否有效。" -ForegroundColor Red
            exit 3
        }

        if ($i -lt $Retries) {
            Write-Host "[push] $DelaySeconds 秒后重试..." -ForegroundColor DarkGray
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    Write-Host "[push] $Retries 次尝试均失败，请检查网络或代理后重试。" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
