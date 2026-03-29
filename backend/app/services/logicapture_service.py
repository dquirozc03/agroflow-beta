from sqlalchemy.orm import Session
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
                logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/Logo_AgroFlow.png"))
                img = ExcelImage(logo_path)
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
