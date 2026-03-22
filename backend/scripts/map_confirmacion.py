import openpyxl
import os

file_path = r"d:\PROJECTS\BETA\BETA LogiCapture 1.0\backend\assets\templates\CONFIRMACION.xlsx"
wb = openpyxl.load_workbook(file_path, data_only=True)
sheet = wb["FORMATO"]
header_row = 6

columns_map = {}
for c in range(1, 40):
    val = sheet.cell(row=header_row, column=c).value
    if val:
        columns_map[c] = str(val).strip()

print(f"MAPA DE COLUMNAS (Hoja FORMATO, Fila {header_row}):")
for k, v in columns_map.items():
    print(f"Col {k}: {v}")
