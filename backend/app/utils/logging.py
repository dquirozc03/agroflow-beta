import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Configuración básica
LOG_PATH = Path("logs")
LOG_PATH.mkdir(exist_ok=True)

def setup_logging():
    logger = logging.getLogger("agroflow")
    logger.setLevel(logging.INFO)

    # Formato profesional
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Handler para archivo (rotativo: 5MB por archivo, máximo 5 backups)
    file_handler = RotatingFileHandler(
        LOG_PATH / "agroflow.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

logger = setup_logging()
