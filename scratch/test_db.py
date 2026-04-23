import os
from sqlalchemy import create_engine
import sys

# SET ENV VARS BEFORE IMPORTS
os.environ["DATABASE_URL"] = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

engine = create_engine(os.environ["DATABASE_URL"])
try:
    with engine.connect() as conn:
        print("CONEXIÓN EXITOSA A LA BASE DE DATOS")
except Exception as e:
    print(f"ERROR DE CONEXIÓN: {e}")
