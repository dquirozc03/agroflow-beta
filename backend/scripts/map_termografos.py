import openpyxl
import os

file_path = r"d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend\assets\templates\TERMOGRAFOS.xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True)
sheet = wb.active # Hoja MARITIMO
header_row = 2

columns_map = {}
for c in range(1, 30):
    val = sheet.cell(row=header_row, column=c).value
    if val:
        columns_map[c] = str(val).strip()

print(f"MAPA DE COLUMNAS TERMOGRAFOS (Hoja {sheet.title}, Fila {header_row}):")
for k, v in columns_map.items():
    print(f"Col {k}: {v}")
