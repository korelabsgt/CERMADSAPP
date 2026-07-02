-- Campos de forma de pago y comprobante de transferencia en ven_ventas
ALTER TABLE ven_ventas
  ADD COLUMN IF NOT EXISTS metodo_pago text DEFAULT 'Efectivo',
  ADD COLUMN IF NOT EXISTS numero_boleta text,
  ADD COLUMN IF NOT EXISTS banco text,
  ADD COLUMN IF NOT EXISTS fecha_transferencia timestamptz,
  ADD COLUMN IF NOT EXISTS img_comprobante_url text;

-- Si ya creaste la columna como date, conviértela:
-- ALTER TABLE ven_ventas ALTER COLUMN fecha_transferencia TYPE timestamptz USING fecha_transferencia::timestamptz;

-- Nombre: ventas-comprobantes
-- Políticas: lectura/escritura para usuarios autenticados
