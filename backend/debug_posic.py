from sqlalchemy import create_engine, text
import os
import re

def get_db_url():
    try:
        # Intentar leer desde backend/.env.local (estamos en backend/)
        env_path = ".env.local"
        if not os.path.exists(env_path):
            env_path = "../.env.local"
        
        with open(env_path, "r") as f:
            content = f.read()
            match = re.search(r'DATABASE_URL=(.*)', content)
            if match:
                return match.group(1).strip()
    except Exception as e:
        print(f"Error leyendo env: {e}")
    return None

def debug_booking(booking_id):
    url = get_db_url()
    if not url: 
        print("No URL")
        return
    
    # Limpiar URL si tiene comillas
    url = url.replace('"', '').replace("'", "")
    
    engine = create_engine(url)
    with engine.connect() as conn:
        query = text("SELECT presentacion, cj_kg FROM ref_posicionamiento WHERE booking = :b")
        res = conn.execute(query, {"b": booking_id}).fetchone()
        if res:
            print(f"Booking: {booking_id}")
            print(f"DB presentacion: |{res[0]}|")
            print(f"DB cj_kg: |{res[1]}|")
        else:
            print(f"Booking {booking_id} not found")

if __name__ == "__main__":
    debug_booking("EBKG12958744")
