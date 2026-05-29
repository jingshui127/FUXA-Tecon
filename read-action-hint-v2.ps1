$ErrorActionPreference = "Stop"

try {
    Import-Module ImportExcel -ErrorAction Stop
    
    $data = Import-Excel -Path "C:\Users\13971\Downloads\FUXA-master\new260520.xlsx" -WorksheetName "动作提示"
    
    Write-Host "=== 动作提示 工作表原始数据（所有行）===" -ForegroundColor Green
    $rowNum = 1
    foreach ($row in $data) {
        Write-Host "行$rowNum:" -ForegroundColor Yellow
        $colNum = 1
        foreach ($prop in $row.PSObject.Properties) {
            if ($prop.Value -ne $null -and $prop.Value -ne "") {
                Write-Host "  列$colNum: `"$($prop.Value)`"" -ForegroundColor Cyan
            }
            $colNum++
        }
        Write-Host "---"
        $rowNum++
    }
    
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
    Write-Host "尝试安装 ImportExcel 模块..." -ForegroundColor Yellow
    Install-Module -Name ImportExcel -Scope CurrentUser -Force -SkipPublisherCheck
    Write-Host "模块已安装，请重新运行脚本" -ForegroundColor Green
}