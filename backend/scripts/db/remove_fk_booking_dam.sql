-- Script para remover la restricción de clave foránea en Neon
-- Esto permite que la tabla de DAM/Transporte tenga datos de Bookings que aún no están en la tabla principal.

ALTER TABLE ref_booking_dam DROP CONSTRAINT IF EXISTS ref_booking_dam_booking_fkey;
