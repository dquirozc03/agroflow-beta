import os
import time
import pandas as pd
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.ref_posicionamiento import RefPosicionamiento
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ExcelSync")

EXCEL_PATH = "app/data/posicionamiento.xlsx"

class ExcelHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("posicionamiento.xlsx"):
            logger.info(f"Detectado cambio en {event.src_path}. Procesando...")
            # Pequeña espera para asegurar que el archivo no esté bloqueado por Excel
            time.sleep(1)
            self.process_excel()

    def process_excel(self):
        if not os.path.exists(EXCEL_PATH):
            logger.warning(f"Archivo no encontrado: {EXCEL_PATH}")
            return

        try:
            df = pd.read_excel(EXCEL_PATH)
            # Normalizar nombres de columnas a minúsculas y sin espacios
            df.columns = [str(c).strip().lower() for c in df.columns]
            
            db: Session = SessionLocal()
            upserts = 0
            
            for _, row in df.iterrows():
                booking = str(row.get('booking', '')).strip().upper()
                if not booking or booking == 'NAN':
                    continue
                
                db_row = db.query(RefPosicionamiento).filter(RefPosicionamiento.booking == booking).first()
                if not db_row:
                    db_row = RefPosicionamiento(booking=booking)
                    db.add(db_row)
                
                # Mapeo de campos (ajustar según encabezados reales)
                db_row.naviera = self.clean(row.get('naviera'))
                db_row.nave = self.clean(row.get('nave'))
                db_row.pol = self.clean(row.get('pol'))
                db_row.pod = self.clean(row.get('pod'))
                db_row.temperatura = self.clean(row.get('temperatura'))
                db_row.ventilacion = self.clean(row.get('ventilacion'))
                db_row.planta_llenado = self.clean(row.get('planta'))
                db_row.hora_posicionamiento = self.clean(row.get('hora'))
                db_row.ac_option = 1 if str(row.get('ac', '')).upper() in ['SI', 'S', 'YES', 'Y', '1'] else 0
                db_row.ct_option = 1 if str(row.get('ct', '')).upper() in ['SI', 'S', 'YES', 'Y', '1'] else 0
                db_row.operador_logistico = self.clean(row.get('operador'))
                db_row.cultivo = self.clean(row.get('cultivo'))
                db_row.es_reprogramado = 1 if str(row.get('reprogramado', '')).upper() in ['SI', 'S', 'YES', 'Y', '1'] else 0
                
                upserts += 1
            
            db.commit()
            db.close()
            logger.info(f"Sincronización exitosa: {upserts} registros procesados.")
            
        except Exception as e:
            logger.error(f"Error procesando Excel: {e}")

    def clean(self, val):
        if pd.isna(val):
            return None
        return str(val).strip()

def start_sync_service():
    path = os.path.dirname(os.path.abspath(EXCEL_PATH))
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
        
    event_handler = ExcelHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    observer.start()
    logger.info(f"Servicio de Monitoreo de Excel iniciado en: {path}")
    
    # Procesar una vez al inicio
    event_handler.process_excel()
    
    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    start_sync_service()
