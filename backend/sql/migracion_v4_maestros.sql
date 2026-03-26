-- Script de creación para Datos Maestros (Transportistas y Vehículos)
-- Módulo: Logística V4

-- 1. Tabla de Transportistas
CREATE TABLE IF NOT EXISTS transportistas (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(20) UNIQUE NOT NULL,
    nombre_transportista VARCHAR(255) NOT NULL,
    partida_registral VARCHAR(50),
    codigo_sap VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO / INACTIVO
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Vehículos Tracto (Placa del Cabezal)
CREATE TABLE IF NOT EXISTS vehiculos_tracto (
    id SERIAL PRIMARY KEY,
    transportista_id INTEGER REFERENCES transportistas(id) ON DELETE CASCADE,
    placa_tracto VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(100),
    certificado_vehicular_tracto VARCHAR(100),
    largo_tracto NUMERIC(10, 2),
    ancho_tracto NUMERIC(10, 2),
    alto_tracto NUMERIC(10, 2),
    numero_ejes INTEGER,
    peso_neto_tracto NUMERIC(10, 2),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Vehículos Carreta (Remolque/Semi-remolque)
CREATE TABLE IF NOT EXISTS vehiculos_carreta (
    id SERIAL PRIMARY KEY,
    transportista_id INTEGER REFERENCES transportistas(id) ON DELETE CASCADE,
    placa_carreta VARCHAR(20) UNIQUE NOT NULL,
    certificado_vehicular_carreta VARCHAR(100),
    largo_carreta NUMERIC(10, 2),
    ancho_carreta NUMERIC(10, 2),
    alto_carreta NUMERIC(10, 2),
    numero_ejes INTEGER,
    peso_neto_carreta NUMERIC(10, 2),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);
