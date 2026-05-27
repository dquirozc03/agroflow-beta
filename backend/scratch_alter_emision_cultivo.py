import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine

def upgrade_db():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE emision_packing_list ADD COLUMN cultivo VARCHAR(50);"))
            print("Successfully added 'cultivo' column to 'emision_packing_list' table.")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicada" in str(e).lower():
            print("Column 'cultivo' already exists in 'emision_packing_list'.")
        else:
            print(f"Error altering table: {e}")

if __name__ == "__main__":
    upgrade_db()
