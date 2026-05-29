$ErrorActionPreference = "Continue"

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open("C:\Users\13971\Downloads\FUXA-master\new260520.xlsx")
    $sheet = $workbook.Worksheets.Item("动作提示")
    
    $usedRange = $sheet.UsedRange
    $rowCount = $usedRange.Rows.Count
    $colCount = $usedRange.Columns.Count
    
    $output = "Row,Col,Value`n"
    
    for ($i = 1; $i -le $rowCount; $i++) {
        for ($j = 1; $j -le $colCount; $j++) {
            $cell = $sheet.Cells.Item($i, $j).Value2
            if ($cell -ne $null -and $cell -ne "") {
                $value = $cell.ToString().Replace('"', '""')
                $output += "$i,$j,`"$value`"`n"
            }
        }
    }
    
    $output | Out-File -FilePath "C:\Users\13971\Downloads\FUXA-master\action-hint-raw.csv" -Encoding UTF8
    
    Write-Host "数据已导出到 action-hint-raw.csv"
    Write-Host "总行数: $rowCount, 总列数: $colCount"
    
    $workbook.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}