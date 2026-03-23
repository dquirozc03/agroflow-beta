import os
import sys
from sqlalchemy import create_engine, MetaData, text, inspect

# Agregar el directorio actual al path para importar la app
sys.path.append(os.getcwd())

from app.configuracion import settings

def purge_db():
    print(f"Purging database: {settings.DATABASE_URL.split('@')[-1]}")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Desactivar llaves foráneas temporalmente si psql lo permite (CASCADE es mejor)
        trans = conn.begin()
        try:
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            if not tables:
                print("No se encontraron tablas para purgar.")
                return

            print(f"Eliminando {len(tables)} tablas...")
            for table in tables:
                # Usar comillas dobles para nombres de tabla que puedan tener Mayúsculas o guiones
                conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
            
            # También borrar la tabla de versiones de alembic si existe
            conn.execute(text(f'DROP TABLE IF EXISTS "alembic_version"'))
            
            trans.commit()
            print("Purga completada con éxito.")
        except Exception as e:
            trans.rollback()
            print(f"Error durante la purga: {e}")
            raise

if __name__ == "__main__":
    confirm = input("¿ESTÁ SEGURO DE QUE DESEA BORRAR COMPLETAMENTE ESTA BASE DE DATOS? (si/no): ")
    if confirm.lower() == "si":
        purge_db()
    else:
        print("Operación cancelada.")
