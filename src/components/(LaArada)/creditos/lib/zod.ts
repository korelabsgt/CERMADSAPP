import { z } from "zod";

export const PagoCreditoSchema = z.object({
  venta_id: z.string().min(1, "El ID de la venta es requerido"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  metodo_pago: z.string().min(1, "El método de pago es obligatorio"),
  observaciones: z.string().optional(),
});

export type PagoCreditoValues = z.infer<typeof PagoCreditoSchema>;

export interface ClienteCredito {
  cliente_id: string;
  nombre: string;
  nit: string;
  telefono: string;
  totalDeuda: number;
  cantidadPedidos: number;
}

export interface DteDocumentoCredito {
  id?: string;
  estado: string;
  serie?: string | null;
  numero?: number | string | null;
  uuid_infile?: string | null;
  fecha_certificacion?: string | null;
  id_receptor?: string | null;
  nombre_receptor?: string | null;
  gran_total?: number | string | null;
}

export interface PagoCreditoHistorial {
  id: string;
  monto: number;
  usuario_id: string;
  cajero_nombre?: string;
  created_at?: string;
  fecha_pago?: string;
}

export interface DetalleVentaCredito {
  id: string;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
  inv_productos?: {
    nombre: string;
    medida: string;
  };
}

export interface VentaCredito {
  id: string;
  cliente_id: string;
  usuario_id: string;
  vendedor_nombre?: string;
  tipo_venta: string;
  estado: string;
  total: number;
  fecha_entrega: string;
  numero_recibo?: number;
  created_at?: string;
  tipo_comprobante?: string;
  metodo_pago?: string | null;
  saldo_pendiente?: number;
  ven_clientes?: {
    nombre: string;
    nit: string;
    telefono: string;
  };
  ven_detalle?: DetalleVentaCredito[];
  ven_pagos?: PagoCreditoHistorial[];
  dte_documentos?: DteDocumentoCredito[] | null;
}
