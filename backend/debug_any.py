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

def check_any_data():
    url = get_db_url()
    if not url: return
    url = url.replace('"', '').replace("'", "")
    engine = create_engine(url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT booking, presentacion, cj_kg FROM ref_posicionamiento WHERE presentacion IS NOT NULL OR cj_kg IS NOT NULL ORDER BY id DESC LIMIT 50")).fetchall()
        print(f"Registros con datos: {len(res)}")
        for r in res:
            print(f"Booking: {r[0]} | Pres: |{r[1]}| | CJ/KG: |{r[2]}|")

if __name__ == "__main__":
    check_any_data()
