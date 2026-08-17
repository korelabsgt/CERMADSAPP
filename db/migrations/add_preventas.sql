-- Módulo Preventas (Saldo a Favor / Anticipos)
-- Los anticipos viven en tablas propias y NUNCA en ven_ventas,
-- por lo que jamás cuentan como venta del día.

CREATE TABLE IF NOT EXISTS ven_preventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES ven_clientes (id) ON DELETE CASCADE,
  monto numeric(12, 2) NOT NULL CHECK (monto > 0),
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  numero_comprobante text,
  img_comprobante_url text,
  metodo_pago text NOT NULL DEFAULT 'Efectivo',
  usuario_id uuid REFERENCES profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ven_preventa_movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES ven_clientes (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'consumo')),
  monto numeric(12, 2) NOT NULL CHECK (monto > 0),
  saldo_resultante numeric(12, 2) NOT NULL DEFAULT 0,
  metodo_pago text,
  preventa_id uuid REFERENCES ven_preventas (id) ON DELETE CASCADE,
  venta_id uuid REFERENCES ven_ventas (id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ven_preventas_cliente ON ven_preventas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_ven_preventa_mov_cliente ON ven_preventa_movimientos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_ven_preventa_mov_venta ON ven_preventa_movimientos (venta_id);

ALTER TABLE ven_preventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ven_preventa_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ven_preventas_authenticated_all" ON ven_preventas;
CREATE POLICY "ven_preventas_authenticated_all" ON ven_preventas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ven_preventa_mov_authenticated_all" ON ven_preventa_movimientos;
CREATE POLICY "ven_preventa_mov_authenticated_all" ON ven_preventa_movimientos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
