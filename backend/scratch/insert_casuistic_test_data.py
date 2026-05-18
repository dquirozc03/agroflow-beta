from sqlalchemy import create_engine, text
from datetime import date

DATABASE_URL = "postgresql://postgres.pngjnfncravlteonjeyv:OQtIdgASy3WfZ76C@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # 1. Clean existing test data if any
    conn.execute(text("DELETE FROM choferes WHERE dni = '99999999';"))
    conn.execute(text("DELETE FROM vehiculos_tracto WHERE placa_tracto = 'TEST999';"))
    conn.execute(text("DELETE FROM vehiculos_carreta WHERE placa_carreta = 'TRA999';"))
    conn.commit()
    print("Cleaned up old test data.")

    # 2. Insert Chofer with EXPIRED LICENSE
    # Columns: dni, nombres, apellido_paterno, apellido_materno, licencia, estado, vencimiento_licencia
    conn.execute(text("""
        INSERT INTO choferes (dni, nombres, apellido_paterno, apellido_materno, licencia, estado, vencimiento_licencia)
        VALUES ('99999999', 'JUAN PRUEBA VENCIDO', 'PEREZ', 'GOMEZ', 'Q99999999', 'ACTIVO', '2025-01-01');
    """))
    print("Inserted expired driver: DNI 99999999 (Licencia Vencida: 2025-01-01)")

    # 3. Insert VehiculoTracto with EXPIRED SOAT
    # Columns: placa_tracto, marca, certificado_vehicular_tracto, peso_neto_tracto, numero_ejes, estado, transportista_id, vencimiento_tarjeta_circulacion, vencimiento_soat
    conn.execute(text("""
        INSERT INTO vehiculos_tracto (placa_tracto, marca, certificado_vehicular_tracto, peso_neto_tracto, numero_ejes, estado, transportista_id, vencimiento_tarjeta_circulacion, vencimiento_soat)
        VALUES ('TEST999', 'VOLVO', 'MTC-TESTT', 8000.0, 6, 'ACTIVO', 8, '2028-12-31', '2025-01-01');
    """))
    print("Inserted tracto with expired SOAT: Placa TEST999 (Venc. SOAT: 2025-01-01, Venc. Tarjeta: 2028-12-31)")

    # 4. Insert VehiculoCarreta with EXPIRED CIRCULATION CARD
    # Columns: placa_carreta, peso_neto_carreta, certificado_vehicular_carreta, estado, transportista_id, vencimiento_tarjeta_circulacion, vencimiento_soat
    conn.execute(text("""
        INSERT INTO vehiculos_carreta (placa_carreta, peso_neto_carreta, certificado_vehicular_carreta, estado, transportista_id, vencimiento_tarjeta_circulacion, vencimiento_soat)
        VALUES ('TRA999', 4000.0, 'MTC-TESTC', 'ACTIVO', 8, '2025-01-01', '2028-12-31');
    """))
    print("Inserted carreta with expired Tarjeta Circulacion: Placa TRA999 (Venc. Tarjeta: 2025-01-01, Venc. SOAT: 2028-12-31)")

    conn.commit()

print("Test data injection completed successfully!")
