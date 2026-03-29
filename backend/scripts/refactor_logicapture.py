import os
import re

logicapture_path = 'app/routers/logicapture.py'
service_path = 'app/services/logicapture_service.py'

with open(logicapture_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Create the service file
service_content = '''from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import pandas as pd
import io
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.drawing.image import Image as ExcelImage
import os

from app.models.posicionamiento import Posicionamiento
from app.models.embarque import ControlEmbarque
from app.models.maestros import Chofer, VehiculoTracto, VehiculoCarreta, Transportista
from app.models.logicapture import LogiCaptureRegistro, LogiCaptureDetalle
from app.utils.formatters import clean_booking, clean_plate, clean_container, clean_dni

class LogiCaptureService:
    @staticmethod
    def generate_excel_report(db: Session):
        regs = db.query(LogiCaptureRegistro).all()
        data = []
        for r in regs:
            placas = f"{r.placa_tracto} / {r.placa_carreta}" if r.placa_tracto else "-"
            tuc_t = r.cert_tracto if r.cert_tracto else "**"
            tuc_c = r.cert_carreta if r.cert_carreta else "**"
            tuc = f"{tuc_t} / {tuc_c}"
            
            senasa_codes = ", ".join(r.precinto_senasa) if r.precinto_senasa else "**"
            linea_codes = ", ".join(r.precinto_linea) if r.precinto_linea else "**"
            senasa_linea = f"{senasa_codes} / PS.LIN: {linea_codes}"
            
            data.append({
                "FECHA EMBARQUE": r.fecha_registro.strftime("%Y-%m-%d") if r.fecha_registro else "-",
                "ORDEN BETA": r.orden_beta,
                "BOOKING": r.booking,
                "CONTENEDOR": r.contenedor,
                "MARCA": r.marca_tracto,
                "PLACAS": placas,
                "CHOFER": r.nombre_chofer,
                "DNI": r.dni_chofer,
                "LICENCIA": r.licencia_chofer,
                "TERMOGRAFOS": " / ".join(r.termografos) if r.termografos else "-",
                "CODIGO SAP": r.codigo_sap,
                "TRANSPORTISTA": r.empresa_transporte,
                "NUMERO DE DAM": r.dam,
                "PRECINTOS BETA": " / ".join(r.precintos_beta) if r.precintos_beta else "-",
                "PRECINTO ADUANA": " / ".join(r.precinto_aduana) if r.precinto_aduana else "-",
                "PRECINTO OPERADOR": " / ".join(r.precinto_operador) if r.precinto_operador else "-",
                "SENASA/PS LÍNEA": senasa_linea,
                "PARTIDA REGISTRAL": r.partida_registral,
                "TUC (CERTIFICADOS)": tuc,
                "ESTATUS": r.status
            })
        
        df = pd.DataFrame(data)
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='LogiCapture_Auditoria', startrow=4)
            workbook = writer.book
            worksheet = writer.sheets['LogiCapture_Auditoria']
            
            try:
                img = ExcelImage("../public/Logo_AgroFlow.png")
                # Resize the image if needed or just insert it
                img.height = 60
                img.width = 170
                worksheet.add_image(img, 'A1')
            except Exception as e:
                pass # If image doesn't exist, we skip
            
            # --- Formateo Excel Premium Carlos Style ---
            last_col = chr(64 + len(df.columns))
            last_row = len(df) + 5
            ref = f"A5:{last_col}{last_row-1}"
            tab = Table(displayName="TablaAuditoria", ref=ref)
            
            style = TableStyleInfo(name="TableStyleMedium9", showFirstColumn=False,
                                   showLastColumn=False, showRowStripes=True, showColumnStripes=False)
            tab.tableStyleInfo = style
            worksheet.add_table(tab)
            
            for col in worksheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except: pass
                worksheet.column_dimensions[column].width = (max_length + 6)
                
        output.seek(0)
        return output
'''

with open(service_path, 'w', encoding='utf-8') as f:
    f.write(service_content)

# Replace validations in logicapture.py
content = re.sub(r'clean_booking = booking\.strip\(\)\.upper\(\)', 'clean_booking_str = clean_booking(booking)', content)
# Ensure we use the clean variables
content = content.replace('clean_booking', 'clean_booking_str')

content = re.sub(r'clean_dni = dni\.strip\(\)\.upper\(\)', 'clean_dni_str = clean_dni(dni)', content)
content = content.replace('clean_dni', 'clean_dni_str')

content = re.sub(r'clean_placa = placa\.strip\(\)\.upper\(\)\.replace\("-", ""\)', 'clean_placa_str = clean_plate(placa)', content)
content = content.replace('clean_placa', 'clean_placa_str')

content = re.sub(r'clean_val = value\.strip\(\)\.upper\(\)', 'clean_val_str = clean_container(value) if "contenedor" in field else value.strip().upper()', content)
content = content.replace('clean_val', 'clean_val_str')

content = re.sub(r'clean_q = q\.strip\(\)\.upper\(\)', 'clean_q = clean_booking(q)', content)

# I also need to update exactly where the excel logic is in backend/app/routers/logicapture.py. 
# We'll just replace the entire export_to_excel function.
content = re.sub(r'@router\.get\("/export/excel"\).*', '''@router.get("/export/excel")
def export_to_excel(db: Session = Depends(get_db)):
    """Generación de reporte Excel Premium con formateo de tabla y auto-ajuste."""
    from app.services.logicapture_service import LogiCaptureService
    output = LogiCaptureService.generate_excel_report(db)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=LogiCapture_Auditoria_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )
''', content, flags=re.DOTALL)

# Add imports for formatters
content = "from app.utils.formatters import clean_booking, clean_plate, clean_container, clean_dni\n" + content

with open(logicapture_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Refactor successful')
