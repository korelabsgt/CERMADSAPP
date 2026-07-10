-- Permite desvincular ventas anuladas al eliminar un cliente incorrecto.
ALTER TABLE ven_ventas
  ALTER COLUMN cliente_id DROP NOT NULL;
