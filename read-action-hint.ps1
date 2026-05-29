$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open("C:\Users\13971\Downloads\FUXA-master\new260520.xlsx")
$sheet = $workbook.Worksheets.Item("动作提示")

$usedRange = $sheet.UsedRange
$rowCount = $usedRange.Rows.Count
$colCount = $usedRange.Columns.Count

Write-Host "=== 动作提示 工作表原始数据（所有行）===" -ForegroundColor Green
for ($i = 1; $i -le $rowCount; $i++) {
    Write-Host "行$i:" -ForegroundColor Yellow
    for ($j = 1; $j -le $colCount; $j++) {
        $cell = $sheet.Cells.Item($i, $j).Value2
        if ($cell -ne $null -and $cell -ne "") {
            Write-Host "  列$j: `"$cell`"" -ForegroundColor Cyan
        }
    }
    Write-Host "---"
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null