-- Script de creación para la tabla pedidos_comerciales (Optimizado para tipos enteros)
DROP TABLE IF EXISTS pedidos_comerciales;

CREATE TABLE IF NOT EXISTS pedidos_comerciales (
    id SERIAL PRIMARY KEY,
    planta VARCHAR(100),
    orden_beta VARCHAR(50),
    po VARCHAR(100),
    cultivo VARCHAR(50),
    cliente VARCHAR(200),
    consignatario VARCHAR(200),
    recibidor VARCHAR(200),
    port_id_orig VARCHAR(100),
    pais VARCHAR(100),
    pod VARCHAR(100),
    port_id_dest VARCHAR(100),
    presentacion VARCHAR(100),
    variedad VARCHAR(100),
    product VARCHAR(150),
    peso_por_caja NUMERIC(10, 2),
    additional_info TEXT,
    caja_por_pallet INTEGER,
    total_pallets INTEGER,
    total_cajas INTEGER,
    incoterm VARCHAR(50),
    tipo_precio VARCHAR(50),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de cruce con Posicionamientos
CREATE INDEX IF NOT EXISTS idx_pedidos_orden_beta ON pedidos_comerciales(ORDEN_BETA);
CREATE INDEX IF NOT EXISTS idx_pedidos_cultivo ON pedidos_comerciales(CULTIVO);
