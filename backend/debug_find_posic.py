from sqlalchemy import create_engine, text
import os
import re

def get_db_url():
    try:
        env_path = ".env.local"
        with open(env_path, "r") as f:
            content = f.read()
            match = re.search(r'DATABASE_URL=(.*)', content)
            if match:
                return match.group(1).strip()
    except Exception as e:
        print(f"Error leyendo env: {e}")
    return None

def debug_fields():
    url = get_db_url()
    if not url: return
    url = url.replace('"', '').replace("'", "")
    engine = create_engine(url)
    with engine.connect() as conn:
        # Buscar el booking que tiene el problema (vimos EBKG12958744 antes, pero probemos buscar por el valor 11)
        res = conn.execute(text("SELECT booking, presentacion, cj_kg, variedad FROM ref_posicionamiento WHERE presentacion LIKE '%11%' OR cj_kg LIKE '%11%' OR cj_kg LIKE '%3.8%' LIMIT 5")).fetchall()
        for r in res:
            print(f"Booking: {r[0]} | Pres: |{r[1]}| | CJ/KG: |{r[2]}| | Var: {r[3]}")

if __name__ == "__main__":
    debug_fields()
