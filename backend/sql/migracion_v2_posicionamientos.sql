-- ==========================================================
-- SCRIPT DE MIGRACIÓN: AGROFLOW V2 (INGE DANIEL EDITION)
-- PROPÓSITO: Limpiar tablas legadas y crear tabla maestra Posicionamientos
-- ==========================================================

-- 1. ELIMINACIÓN DE TABLAS NO DESEADAS (LIMPIEZA DE PROYECTO)
DROP TABLE IF EXISTS cat_choferes CASCADE;
DROP TABLE IF EXISTS cat_clientes_ie CASCADE;
DROP TABLE IF EXISTS cat_transportistas CASCADE;
DROP TABLE IF EXISTS cat_vehiculos CASCADE;
DROP TABLE IF EXISTS ope_registros CASCADE;
DROP TABLE IF EXISTS ope_unicos CASCADE;
DROP TABLE IF EXISTS ref_booking_dam CASCADE;
DROP TABLE IF EXISTS ref_posicionamiento CASCADE; -- Eliminando la versión antigua para usar la nueva 'posicionamientos'

-- 2. CREACIÓN DE LA TABLA MAESTRA 'posicionamientos'
-- Nota: Los nombres de columnas están en MAYÚSCULAS según requerimiento.
CREATE TABLE IF NOT EXISTS posicionamientos (
    "ID" SERIAL PRIMARY KEY,
    "PLANTA_LLENADO" VARCHAR(100),
    "CULTIVO" VARCHAR(50),
    "BOOKING" VARCHAR(50) UNIQUE NOT NULL,
    "NAVE" VARCHAR(100),
    "ETD" DATE,
    "ETA" DATE,
    "POL" VARCHAR(50),
    "ORDEN_BETA" VARCHAR(50),
    "PRECINTO_SENASA" VARCHAR(100),
    "OPERADOR_LOGISTICO" VARCHAR(100),
    "NAVIERA" VARCHAR(100),
    "TERMOREGISTROS" VARCHAR(100),
    "AC" VARCHAR(50),
    "CT" VARCHAR(50),
    "VENTILACION" VARCHAR(50),
    "TEMPERATURA" VARCHAR(50),
    "HUMEDAD" VARCHAR(50),
    "FILTROS" VARCHAR(100),
    "FECHA_PROGRAMADA" DATE,
    "HORA_PROGRAMADA" TIME,
    "CAJAS_VACIAS" INTEGER,
    "ESTADO" VARCHAR(20) DEFAULT 'PROGRAMADO',
    "FECHA_CREACION" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES DE ALTO RENDIMIENTO (OPTIMIZADO PARA EXCEL)
CREATE INDEX IF NOT EXISTS idx_posicionamientos_booking ON posicionamientos("BOOKING");
CREATE INDEX IF NOT EXISTS idx_posicionamientos_orden_beta ON posicionamientos("ORDEN_BETA");

-- COMENTARIO: Script listo para ser ejecutado en el SQL Editor de Supabase.
