import logging
import sys

def setup_logging():
    # Configuración básica en consola para Render/Cloud
    logger = logging.getLogger("agroflow")
    logger.setLevel(logging.INFO)

    # Formato profesional
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Handler para consola (Stdout) — Render captura esto automáticamente
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Limpiamos handlers previos por si acaso (para evitar duplicados en recargas)
    if logger.hasHandlers():
        logger.handlers.clear()
        
    logger.addHandler(console_handler)

    return logger

logger = setup_logging()
