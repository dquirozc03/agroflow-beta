-- ============================================================
-- Datos de prueba para LogiCapture (ejecutar en PostgreSQL)
-- No pegar el archivo .md: solo este .sql en tu cliente (pgAdmin, DBeaver, psql).
-- ============================================================

-- 1. Transportistas
INSERT INTO cat_transportistas (codigo_sap, ruc, nombre_transportista, partida_registral, estado)
VALUES
  ('SAP001', '20100000001', 'Transportes Alpha S.A.C.', 'PR-001', 'activo'),
  ('SAP002', '20100000002', 'Logística Beta E.I.R.L.', NULL, 'activo'),
  ('SAP003', '20100000003', 'Carga Rápida S.A.', 'PR-003', 'activo')
ON CONFLICT (codigo_sap) DO NOTHING;

-- 2. Choferes
INSERT INTO cat_choferes (dni, primer_nombre, apellido_paterno, apellido_materno, licencia, estado)
VALUES
  ('12345678', 'Juan', 'Pérez', 'García', 'B2', 'activo'),
  ('87654321', 'María', 'López', 'Sánchez', 'B2', 'activo')
ON CONFLICT (dni) DO NOTHING;

-- 3. Vehículos (con transportista_id)
INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'ABC123', 'XYZ789', 'ABC123/XYZ789',
  'Volvo', 'CERT-001',
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/S3', 6500, 8500, 48000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP001' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789');

INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'DEF456', NULL, 'DEF456',
  'Scania', NULL,
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/S2', 6000, 8000, 43000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP002' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'DEF456');

INSERT INTO cat_vehiculos (
  placa_tracto, placa_carreta, placas,
  marca, cert_vehicular,
  largo_tracto, ancho_tracto, alto_tracto,
  largo_carreta, ancho_carreta, alto_carreta,
  configuracion_vehicular, peso_neto_carreta, peso_neto_tracto, peso_bruto_vehicular,
  estado, transportista_id
)
SELECT
  'GHI999', 'GHI999', 'GHI999/GHI999',
  'Mercedes', NULL,
  2.60, 2.55, 4.00,
  12.20, 2.55, 2.70,
  'T3/Se2', 6200, 8200, 47000,
  'activo', (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP003' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'GHI999/GHI999');

-- 4. (Opcional) Un registro procesado para probar botón Editar
INSERT INTO ope_registros (
  chofer_id, vehiculo_id, transportista_id,
  estado, booking, o_beta, awb, dam,
  ps_beta, ps_aduana, ps_operador, senasa, ps_linea, senasa_ps_linea,
  termografos, processed_at
)
SELECT
  (SELECT id FROM cat_choferes LIMIT 1),
  (SELECT id FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789' LIMIT 1),
  (SELECT id FROM cat_transportistas WHERE codigo_sap = 'SAP001' LIMIT 1),
  'procesado', 'BKG-TEST-001', 'OB-001', 'AWB-TEST-001', 'DAM-001',
  'PS-B', 'PS-A', '**', '*', 'PS-L', 'SENASA-PS',
  'OK', NOW()
WHERE EXISTS (SELECT 1 FROM cat_choferes LIMIT 1)
  AND EXISTS (SELECT 1 FROM cat_vehiculos WHERE placas = 'ABC123/XYZ789')
  AND EXISTS (SELECT 1 FROM cat_transportistas WHERE codigo_sap = 'SAP001');
