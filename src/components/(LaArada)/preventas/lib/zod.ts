import { z } from "zod";
import { isConsumidorFinalNit } from "@/lib/fel-anulacion";

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

export const PreventaDetalleSchema = z.object({
  producto_id: z.string().uuid("Producto inválido"),
  nombre_producto: z.string().min(1, "Producto inválido"),
  medida: z.string().optional(),
  cantidad: z.coerce.number().min(0.5, "La cantidad mínima es 0.5"),
  precio_unitario: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  subtotal: z.coerce.number().min(0, "El subtotal no puede ser negativo"),
});

export type PreventaDetalleValues = z.infer<typeof PreventaDetalleSchema>;

export function totalDetallesPreventa(
  detalles: { subtotal: number }[],
): number {
  return Number(
    detalles.reduce((acc, d) => acc + Number(d.subtotal || 0), 0).toFixed(2),
  );
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PreventaSchema = z
  .object({
    cliente_id: z.string().uuid("Seleccione un cliente válido"),
    monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
    fecha_emision: z.string().min(1, "La fecha de emisión es requerida"),
    metodo_pago: z.enum(METODOS_PAGO_PREVENTA),
    img_comprobante_url: z.string().nullable().optional(),
    facturar: z.boolean().default(false),
    receptor_cf: z.boolean().default(true),
    nit_receptor: z.string().optional().or(z.literal("")),
    nombre_receptor: z.string().optional().or(z.literal("")),
    correo_receptor: z.string().optional().or(z.literal("")),
    detalles: z.array(PreventaDetalleSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.facturar) return;

    if (data.detalles.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["detalles"],
        message: "Agregue al menos un producto para facturar",
      });
    } else if (
      Math.abs(totalDetallesPreventa(data.detalles) - data.monto) > 0.01
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["monto"],
        message: "El monto debe coincidir con el total de los productos",
      });
    }

    if (!data.receptor_cf) {
      if (!data.nit_receptor?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nit_receptor"],
          message: "Ingrese el NIT del receptor",
        });
      }
      if (!data.nombre_receptor?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nombre_receptor"],
          message: "Ingrese el nombre del receptor",
        });
      }
    }

    const correo = data.correo_receptor?.trim();
    if (correo && !CORREO_RE.test(correo)) {
      ctx.addIssue({
        code: "custom",
        path: ["correo_receptor"],
        message: "Correo electrónico inválido",
      });
    }
  });

export type PreventaFormValues = z.infer<typeof PreventaSchema>;

export interface ProductoPreventa {
  id: string;
  nombre: string;
  codigo?: string | null;
  precio_base: number;
  stock_actual: number;
  medida: string;
  activo?: boolean;
}

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

export const CertificarPreventaSchema = z
  .object({
    movimiento_id: z.string().uuid("Movimiento inválido"),
    monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
    receptor_cf: z.boolean().default(true),
    nit_receptor: z.string().optional().or(z.literal("")),
    nombre_receptor: z.string().optional().or(z.literal("")),
    correo_receptor: z.string().optional().or(z.literal("")),
    detalles: z.array(PreventaDetalleSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.detalles.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["detalles"],
        message: "Agregue al menos un producto para facturar",
      });
    } else if (
      Math.abs(totalDetallesPreventa(data.detalles) - data.monto) > 0.01
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["detalles"],
        message: "El total de productos debe coincidir con el monto del anticipo",
      });
    }

    if (!data.receptor_cf) {
      if (!data.nit_receptor?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nit_receptor"],
          message: "Ingrese el NIT del receptor",
        });
      }
      if (!data.nombre_receptor?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nombre_receptor"],
          message: "Ingrese el nombre del receptor",
        });
      }
    }

    const correo = data.correo_receptor?.trim();
    if (correo && !CORREO_RE.test(correo)) {
      ctx.addIssue({
        code: "custom",
        path: ["correo_receptor"],
        message: "Correo electrónico inválido",
      });
    }
  });

export type CertificarPreventaValues = z.infer<typeof CertificarPreventaSchema>;

export {
  formatDiaGT,
  isConsumidorFinalNit,
  plazoAnulacionInmediata,
  toFelFechaGT,
} from "@/lib/fel-anulacion";

export function receptorDesdeCliente(cliente: {
  nombre: string;
  nit: string;
}) {
  const esCF = isConsumidorFinalNit(cliente.nit);
  return {
    receptor_cf: esCF,
    nit_receptor: esCF ? "" : cliente.nit.trim().toUpperCase(),
    nombre_receptor: esCF ? "" : cliente.nombre,
  };
}

export const AnularFacturaPreventaSchema = z.object({
  movimiento_id: z.string().uuid(),
  motivo: z
    .string()
    .trim()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(250, "El motivo es demasiado largo"),
});

export type AnularFacturaPreventaValues = z.infer<
  typeof AnularFacturaPreventaSchema
>;

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

export interface PreventaDteItem {
  descripcion: string;
  medida: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PreventaDte {
  uuid: string;
  serie: string;
  numero: string;
  estado: string;
  fecha_emision?: string | null;
  fecha_certificacion: string;
  id_receptor: string;
  nombre_receptor: string;
  correo_receptor?: string | null;
  items: PreventaDteItem[];
  total: number;
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
  dte?: PreventaDte | null;
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
  dte?: PreventaDte | null;
}

export function preventaEstaFacturada(mov?: PreventaMovimiento | null): boolean {
  return mov?.tipo === "ingreso" && mov?.dte?.estado === "certificado";
}
