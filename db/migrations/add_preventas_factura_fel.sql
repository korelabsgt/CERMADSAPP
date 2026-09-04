-- Facturación electrónica opcional del anticipo (preventa).
-- El DTE se guarda ÚNICAMENTE en ven_preventas: no se crea venta ni se toca
-- dte_documentos, por lo que contabilidad y ventas quedan intactas.
-- El monto sigue quedando como saldo a favor para despacharse luego en ventas.

ALTER TABLE ven_preventas
  ADD COLUMN IF NOT EXISTS dte_uuid text,
  ADD COLUMN IF NOT EXISTS dte_serie text,
  ADD COLUMN IF NOT EXISTS dte_numero text,
  ADD COLUMN IF NOT EXISTS dte_estado text,
  ADD COLUMN IF NOT EXISTS dte_fecha_emision timestamptz,
  ADD COLUMN IF NOT EXISTS dte_fecha_certificacion timestamptz,
  ADD COLUMN IF NOT EXISTS dte_id_receptor text,
  ADD COLUMN IF NOT EXISTS dte_nombre_receptor text,
  ADD COLUMN IF NOT EXISTS dte_correo_receptor text,
  ADD COLUMN IF NOT EXISTS dte_items jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ven_preventas_dte_uuid
  ON ven_preventas (dte_uuid)
  WHERE dte_uuid IS NOT NULL;
