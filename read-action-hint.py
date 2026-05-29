import openpyxl
import sys

try:
    workbook = openpyxl.load_workbook('new260520.xlsx', data_only=True)
    sheet = workbook['动作提示']
    
    print('=== 动作提示 工作表原始数据（所有行）===')
    for i, row in enumerate(sheet.iter_rows(values_only=True), 1):
        has_data = False
        print(f'行{i}:')
        for j, cell in enumerate(row, 1):
            if cell is not None and cell != '':
                print(f'  列{j}: "{cell}"')
                has_data = True
        print('---')
    
    workbook.close()
    
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)