# FUXA PRO 版本升级编排（半自动）
# 用法：
#   .\upgrade-fuxa.ps1 -SourceZip D:\downloads\FUXA-Pro-1.3.6.zip -InspectOnly
#   .\upgrade-fuxa.ps1 -SourceZip D:\downloads\FUXA-Pro-1.3.6.zip
# 说明：只解压、建 upstream 分支、提交官方源码、合并回当前 PRO 分支，并在有冲突时停下。
#      不做构建、不跑 patch-nodered、不改 artifacts\data。

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SourceZip,
    [string]$Version = '',
    [switch]$InspectOnly,
    [switch]$AllowDeletions,
    [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$protected = @('docs/', '.trae/', 'scripts/', 'deploy/', '.github/', 'server/scripts/', '.gitignore', '.gitattributes', 'build-and-push.ps1', 'memory.md')
$excluded = '(^|/)(node_modules|artifacts|fuxa-headless|\.git)/'
$temp = $null

function Write-Step([string]$text) { Write-Host ""; Write-Host "== $text" -ForegroundColor Cyan }
function Write-Info([string]$text) { Write-Host "   $text" }
function Fail([string]$text) { Write-Host "[upgrade] FAIL $text" -ForegroundColor Red; exit 1 }

function Test-Protected([string]$path) {
    foreach ($item in $protected) {
        if ($path -eq $item) { return $true }
        if ($path.StartsWith($item)) { return $true }
    }
    return $false
}

# git 会把正常提示（如 "Switched to a new branch"）写到 stderr，
# 在 ErrorActionPreference=Stop 下会被当成异常，因此这里临时降级。
function Invoke-Git([string[]]$arguments) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & git @arguments 2>&1
        $lines = @($output | ForEach-Object { "$_" })
        return @{ Code = $LASTEXITCODE; Lines = $lines }
    } finally {
        $ErrorActionPreference = $previous
    }
}

Push-Location $repo
try {
    # ---------- 预检 ----------
    Write-Step '预检'
    if (-not (Test-Path $SourceZip)) { Fail "源码包不存在: $SourceZip" }

    $status = (Invoke-Git @('status', '--porcelain')).Lines
    if (($status -join '').Trim() -ne '') {
        Write-Info '工作区有未提交改动：'
        $status | ForEach-Object { Write-Info "  $_" }
        Fail '请先提交或暂存改动，再执行升级'
    }
    if (Test-Path (Join-Path $repo '.git\MERGE_HEAD')) { Fail '存在进行中的合并，请先处理' }
    if (Test-Path (Join-Path $repo '.git\rebase-merge')) { Fail '存在进行中的 rebase，请先处理' }

    $branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Lines[0].Trim()
    if ($branch -notmatch '-PRO$') { Fail "当前分支 $branch 不是 PRO 分支，升级应在 1.3.x-PRO 上执行" }
    Write-Info "当前分支: $branch"

    # 官方基线 = 上一次升级留下的 upstream-<旧版本> 分支。
    # 以它为新 upstream 分支的起点，合并回 PRO 时 Git 才能做三方合并，
    # 冲突才会集中在我们改过的文件上；首次升级没有基线，只能直接覆盖 PRO。
    $upstreamBranches = @((Invoke-Git @('branch', '--list', 'upstream-*', '--format=%(refname:short)')).Lines |
            ForEach-Object { $_.Trim() } |
            Where-Object { $_ -match '^upstream-\d+(\.\d+)+$' })
    $baseBranch = $branch
    $firstUpgrade = $true
    if ($upstreamBranches.Count -gt 0) {
        $baseBranch = @($upstreamBranches | Sort-Object { [version]($_ -replace '^upstream-', '') })[-1]
        $firstUpgrade = $false
        Write-Info "官方基线: $baseBranch"
    } else {
        Write-Info '官方基线: 无 upstream-* 分支（首次升级，无法三方合并）'
    }

    # ---------- 解压与定位 ----------
    Write-Step '解压源码包'
    $temp = Join-Path $env:TEMP ("fuxa-upgrade-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Path $temp -Force | Out-Null
    Expand-Archive -Path $SourceZip -DestinationPath $temp -Force
    Write-Info "临时目录: $temp"

    $pkgPath = Get-ChildItem $temp -Recurse -Depth 3 -Filter 'package.json' |
        Where-Object { $_.DirectoryName -match '\\server$' } |
        Select-Object -First 1
    if (-not $pkgPath) { Fail '源码包内未找到 server\package.json，可能不是官方 PRO 源码包' }
    $root = Split-Path -Parent $pkgPath.DirectoryName

    $pkg = Get-Content $pkgPath.FullName -Raw | ConvertFrom-Json
    $newVersion = $pkg.version
    if ($Version -ne '' -and $Version -ne $newVersion) {
        Fail "源码包版本为 $newVersion，与参数 -Version $Version 不一致"
    }
    Write-Info "源码包版本: $newVersion"
    Write-Info "源码根目录: $root"

    # ---------- 清单 ----------
    Write-Step '文件清单'
    $zipFiles = @(Get-ChildItem $root -Recurse -File | ForEach-Object {
            $_.FullName.Substring($root.Length + 1).Replace('\', '/')
        } | Where-Object { $_ -notmatch $excluded })

    $tracked = @((Invoke-Git @('ls-tree', '-r', '--name-only', $baseBranch)).Lines | Where-Object { $_.Trim() -ne '' })
    $zipSet = @{}
    foreach ($file in $zipFiles) { $zipSet[$file] = $true }
    $trackedSet = @{}
    foreach ($file in $tracked) { $trackedSet[$file] = $true }

    $added = @($zipFiles | Where-Object { -not $trackedSet.ContainsKey($_) })
    $missing = @($tracked | Where-Object { -not $zipSet.ContainsKey($_) -and -not (Test-Protected $_) })
    # 前端编译产物按二进制资产整体镜像官方版本：旧 bundle 必须删除，否则会随 EXE 一起发布。
    $missingDist = @($missing | Where-Object { $_ -like 'client/dist/*' })
    $missingOther = @($missing | Where-Object { $_ -notlike 'client/dist/*' })

    Write-Info "压缩包文件数: $($zipFiles.Count)（已排除 node_modules / artifacts / fuxa-headless）"
    Write-Info "仓库已跟踪文件数: $($tracked.Count)"
    Write-Info "新增（压缩包有、仓库无）: $($added.Count)"
    if ($added.Count -gt 0 -and $added.Count -le 20) { $added | ForEach-Object { Write-Info "  + $_" } }
    Write-Info "前端产物中已不存在（将删除）: $($missingDist.Count)"
    if ($missingDist.Count -gt 0 -and $missingDist.Count -le 20) { $missingDist | ForEach-Object { Write-Info "  - $_" } }
    Write-Info "其他路径中已不存在（默认保留）: $($missingOther.Count)"
    if ($missingOther.Count -gt 0 -and $missingOther.Count -le 20) { $missingOther | ForEach-Object { Write-Info "  - $_" } }

    # 前端与后端版本一致性
    $distDir = Join-Path $root 'client\dist'
    $mainBundle = Get-ChildItem $distDir -Filter 'main.*.js' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $mainBundle) { Fail '源码包内未找到 client\dist\main.*.js，缺少前端编译产物，无法升级' }
    $content = Get-Content $mainBundle.FullName -Raw
    if ($content -match [regex]::Escape($newVersion)) {
        Write-Info "版本一致性: 前端产物包含 $newVersion"
    } else {
        Write-Info "版本一致性: 警告 — 前端产物中未找到版本号 $newVersion，请人工确认前后端是否配套"
    }
    Write-Info "前端产物: $($mainBundle.Name)"

    if ($InspectOnly) {
        Write-Step '仅检查模式，未改动仓库'
        Write-Info '如需继续，去掉 -InspectOnly 重新执行'
        exit 0
    }

    # ---------- 建 upstream 分支 ----------
    Write-Step '创建 upstream 分支并提交官方源码'
    $upstream = "upstream-$newVersion"
    $exists = (Invoke-Git @('branch', '--list', $upstream)).Lines
    if (($exists -join '').Trim() -ne '') { Fail "分支 $upstream 已存在，请先删除：git branch -D $upstream" }

    $result = Invoke-Git @('checkout', '-b', $upstream, $baseBranch)
    if ($result.Code -ne 0) { Fail "创建分支失败: $($result.Lines -join ' ')" }

    $copied = 0
    $skipped = 0
    foreach ($rel in $zipFiles) {
        if (Test-Protected $rel) { $skipped++; continue }
        $source = Join-Path $root ($rel -replace '/', '\')
        $target = Join-Path $repo ($rel -replace '/', '\')
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $source $target -Force
        $copied++
    }
    Write-Info "已覆盖/新增文件: $copied，跳过受保护路径: $skipped"

    foreach ($file in $missingDist) { Invoke-Git @('rm', '--quiet', '--', $file) | Out-Null }
    if ($missingDist.Count -gt 0) {
        Write-Info "已从索引移除 $($missingDist.Count) 个旧前端产物"
    }
    if ($AllowDeletions -and $missingOther.Count -gt 0) {
        foreach ($file in $missingOther) { Invoke-Git @('rm', '--quiet', '--', $file) | Out-Null }
        Write-Info "已从索引移除 $($missingOther.Count) 个版本包中不存在的其他文件"
    } elseif ($missingOther.Count -gt 0) {
        Write-Info '保留其他路径中版本包已不存在的文件（如需清理，加 -AllowDeletions）'
    }

    Invoke-Git @('add', '-A') | Out-Null
    $result = Invoke-Git @('commit', '--quiet', '-m', "vendor: FUXA PRO $newVersion 源码（后端源码 + 前端编译产物）")
    if ($result.Code -ne 0) { Fail "提交官方源码失败: $($result.Lines -join ' ')" }

    Write-Step '本次升级变更规模'
    $changed = @((Invoke-Git @('diff', '--name-only', 'HEAD~1', 'HEAD')).Lines | Where-Object { $_.Trim() -ne '' })
    Write-Info "变更文件数: $($changed.Count)"
    if ($changed.Count -le 30) { $changed | ForEach-Object { Write-Info "  * $_" } }
    (Invoke-Git @('diff', '--shortstat', 'HEAD~1', 'HEAD')).Lines | ForEach-Object { Write-Info $_ }
    if ($firstUpgrade) {
        Write-Host '[upgrade] 警告：首次升级没有 upstream 基线，以上为官方包覆盖的文件。' -ForegroundColor Yellow
        Write-Info '请逐个确认这些文件中是否包含本地定制（品牌、补丁），必要时手工合并。'
        Write-Info '本次会自动留下 upstream 分支，之后的升级即可正常三方合并。'
    }

    # ---------- 合并 ----------
    Write-Step "合并 $upstream 到 $branch"
    $result = Invoke-Git @('checkout', $branch)
    if ($result.Code -ne 0) { Fail "切回 $branch 失败" }
    $result = Invoke-Git @('merge', '--no-commit', '--no-ff', $upstream)

    $conflicts = @((Invoke-Git @('diff', '--name-only', '--diff-filter=U')).Lines | Where-Object { $_.Trim() -ne '' })

    # client/dist 按二进制资产整体采用官方版本：冲突一律取 upstream 版本，
    # 品牌与地图随后由 patch 脚本回填，避免把机械冲突抛给人工。
    $distConflicts = @($conflicts | Where-Object { $_ -like 'client/dist/*' })
    foreach ($rel in $distConflicts) {
        if ((Invoke-Git @('cat-file', '-e', ($upstream + ':' + $rel))).Code -eq 0) {
            Invoke-Git @('checkout', '--theirs', '--', $rel) | Out-Null
            Invoke-Git @('add', '--', $rel) | Out-Null
        } else {
            Invoke-Git @('rm', '--quiet', '-f', '--', $rel) | Out-Null
        }
    }
    if ($distConflicts.Count -gt 0) {
        Write-Info "前端产物冲突 $($distConflicts.Count) 个，已按官方版本解决"
        $conflicts = @($conflicts | Where-Object { $_ -notlike 'client/dist/*' })
    }

    if ($conflicts.Count -gt 0) {
        Write-Host "[upgrade] 存在 $($conflicts.Count) 个冲突文件，合并已暂停：" -ForegroundColor Yellow
        $conflicts | ForEach-Object { Write-Info "  ! $_" }
        Write-Info '请逐个确认后执行 git add <file> 与 git commit 完成合并，然后运行：'
        Write-Info '  node server/scripts/patch-brand-assets.js'
        Write-Info '  node server/scripts/patch-map-tiles.js'
        exit 2
    }
    if ($result.Code -ne 0) { Fail "合并失败: $($result.Lines -join ' ')" }

    $result = Invoke-Git @('commit', '--quiet', '-m', "merge: FUXA PRO $newVersion")
    if ($result.Code -ne 0) { Fail "提交合并结果失败: $($result.Lines -join ' ')" }

    # ---------- 重新打品牌与地图补丁 ----------
    Write-Step '回填品牌与地图瓦片'
    & node 'server/scripts/patch-brand-assets.js'
    if ($LASTEXITCODE -ne 0) { Fail '品牌回填失败，请检查 docs/customization' }
    & node 'server/scripts/patch-map-tiles.js'
    if ($LASTEXITCODE -ne 0) { Fail '地图瓦片补丁失败，可能官方更换了瓦片源，需人工确认' }

    $distStatus = (Invoke-Git @('status', '--porcelain', 'client/dist')).Lines
    if (($distStatus -join '').Trim() -ne '') {
        Invoke-Git @('add', 'client/dist') | Out-Null
        $result = Invoke-Git @('commit', '--quiet', '-m', "chore: 回填品牌资源与地图瓦片（$newVersion）")
        if ($result.Code -eq 0) { Write-Info '品牌/地图改动已提交' } else { Write-Info '品牌/地图改动提交失败，请手工检查' }
    } else {
        Write-Info '品牌/地图与仓库现有内容一致，无需提交'
    }

    # ---------- 后续 ----------
    Write-Step '后续步骤（未自动执行）'
    Write-Info '1. 构建 fuxa-headless 后执行 patch-nodered.js，确认 verification passed'
    Write-Info '2. 本地打包: .\build-and-push.ps1 -SkipCommit -SkipPush'
    Write-Info '3. 部署机: node scripts\verify-native-plugins.js'
    Write-Info '4. 部署机: powershell -File scripts\smoke-test.ps1 -LogFile <启动日志>'
    Write-Info "5. 确认无误后推送: git push origin $branch"

    Write-Host "[upgrade] SUCCESS 已合并 FUXA PRO $newVersion" -ForegroundColor Green
    exit 0
} finally {
    Pop-Location
    if ($temp -and -not $KeepTemp -and (Test-Path $temp)) {
        Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
    }
}
