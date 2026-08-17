import { z } from "zod";

export const METODOS_PAGO_PREVENTA = [
  "Efectivo",
  "Transferencia",
  "Depósito",
] as const;

export function codigoCorto(id?: string | null) {
  if (!id) return "";
  return `${id.substring(0, 3).toUpperCase()}-${id.substring(3, 6).toUpperCase()}`;
}

export function formatReciboVentaLabel(mov: {
  simulado?: boolean;
  venta_numero?: number | null;
  venta_id?: string | null;
}): string {
  if (mov.simulado) {
    return String(mov.venta_numero ?? 1).padStart(5, "0");
  }
  if (mov.venta_id) {
    return codigoCorto(mov.venta_id);
  }
  return "—";
}

export function slugCliente(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const PreventaSchema = z.object({
  cliente_id: z.string().uuid("Seleccione un cliente válido"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha_emision: z.string().min(1, "La fecha de emisión es requerida"),
  metodo_pago: z.enum(METODOS_PAGO_PREVENTA),
  img_comprobante_url: z.string().nullable().optional(),
});

export type PreventaFormValues = z.infer<typeof PreventaSchema>;

export const AplicarPreventaSchema = z.object({
  cliente_id: z.string().uuid("Cliente inválido"),
  venta_id: z.string().uuid("Venta inválida"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
});

export type AplicarPreventaValues = z.infer<typeof AplicarPreventaSchema>;

export const ActualizarComprobantePreventaSchema = z.object({
  preventa_id: z.string().uuid(),
  img_comprobante_url: z.string().nullable(),
});

export type ActualizarComprobantePreventaValues = z.infer<
  typeof ActualizarComprobantePreventaSchema
>;

export const EditarCargaPreventaSchema = z.object({
  movimiento_id: z.string().uuid(),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha_emision: z.string().min(1, "La fecha de emisión es requerida"),
  metodo_pago: z.enum(METODOS_PAGO_PREVENTA),
});

export type EditarCargaPreventaValues = z.infer<typeof EditarCargaPreventaSchema>;

export const EliminarMovimientoPreventaSchema = z.object({
  movimiento_id: z.string().uuid(),
});

export type EliminarMovimientoPreventaValues = z.infer<
  typeof EliminarMovimientoPreventaSchema
>;

export const EliminarPreventaClienteSchema = z.object({
  cliente_id: z.string().uuid("Cliente inválido"),
});

export type EliminarPreventaClienteValues = z.infer<
  typeof EliminarPreventaClienteSchema
>;

export interface ClientePreventa {
  cliente_id: string;
  nombre: string;
  nit: string;
  telefono: string;
  saldo: number;
  cantidadMovimientos: number;
}

export interface ClienteLista {
  id: string;
  nombre: string;
  nit: string;
  telefono?: string | null;
}

export interface PreventaMovimiento {
  id: string;
  cliente_id: string;
  tipo: "ingreso" | "consumo";
  monto: number;
  saldo_resultante: number;
  metodo_pago?: string | null;
  preventa_id?: string | null;
  venta_id?: string | null;
  usuario_id?: string | null;
  usuario_nombre?: string;
  numero_comprobante?: string | null;
  fecha_emision?: string | null;
  img_comprobante_url?: string | null;
  created_at: string;
  venta_numero?: number | null;
  simulado?: boolean;
}

export function formatReciboMovimientoLabel(mov: PreventaMovimiento): string {
  if (mov.tipo === "ingreso") {
    return codigoCorto(mov.preventa_id || mov.id);
  }
  return formatReciboVentaLabel(mov);
}

export function tipoMovimientoLabel(tipo: PreventaMovimiento["tipo"]): string {
  return tipo === "ingreso" ? "Anticipo" : "Consumo";
}

export function requiereComprobantePreventa(metodo?: string | null): boolean {
  return metodo === "Transferencia" || metodo === "Depósito";
}

export function razonMovimientoLabel(mov: PreventaMovimiento): string {
  if (mov.tipo === "consumo") return "Consumo";
  const metodo = mov.metodo_pago ?? "Efectivo";
  const slug = metodo === "Depósito" ? "Deposito" : metodo;
  return `Anticipo-${slug}`;
}

export interface ReciboPreventa {
  tipo: "ingreso" | "consumo";
  codigo: string;
  cliente_nombre: string;
  cliente_nit: string;
  monto: number;
  saldo_resultante: number;
  metodo_pago?: string | null;
  venta_codigo?: string | null;
  usuario_nombre?: string;
  fecha: string;
}
