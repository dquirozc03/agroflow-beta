import sys
import os
import bcrypt
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env vars
load_dotenv(".env.local")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env.local")
    sys.exit(1)

def hash_password(plain: str) -> str:
    raw = (plain or "").encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")

try:
    engine = create_engine(DATABASE_URL)
    new_hash = hash_password("BetaTester")
    
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # Update DQUIROZ (or the first admin user found if DQUIROZ doesn't exist, but we know it does)
            result = connection.execute(
                text("UPDATE auth_usuarios SET password_hash = :p WHERE usuario = 'DQUIROZ'"),
                {"p": new_hash}
            )
            print(f"Filas actualizadas: {result.rowcount}")
            trans.commit()
            if result.rowcount > 0:
                print("Password reset successfully for user DQUIROZ to '123456'")
            else:
                print("User DQUIROZ not found?")
        except Exception as e:
            trans.rollback()
            print(f"Error executing update: {e}")
            
except Exception as e:
    print(f"Error connecting to DB: {e}")
