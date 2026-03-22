import openpyxl
import os

file_path = r"d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend\assets\templates\TERMOGRAFOS.xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True)
sheet = wb.active
print(f"Hoja: {sheet.title}")

for r in range(1, 15):
    row_data = [str(sheet.cell(row=r, column=c).value) for c in range(1, 20)]
    if any(row_data):
        print(f"Row {r}: {row_data}")
