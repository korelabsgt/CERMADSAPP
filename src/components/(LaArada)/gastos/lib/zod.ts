import { z } from "zod";

export const GASTO_CATEGORIA_ANULADO = "Anulado";

export function isGastoCategoriaAnulada(categoria: string): boolean {
  return categoria.trim().toLowerCase() === "anulado";
}

export function isGastoActivo(g: GastoItem): boolean {
  return !isGastoCategoriaAnulada(g.categoria);
}

export const GastoSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre o concepto debe tener al menos 2 caracteres")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  cantidad: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number().min(0, "El monto debe ser 0 o mayor")
  ),
  categoria: z
    .string()
    .min(1, "Debes seleccionar o ingresar una categoría"),
  descripcion: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  fecha: z
    .string()
    .min(1, "La fecha es requerida"),
}).superRefine((data, ctx) => {
  if (isGastoCategoriaAnulada(data.categoria)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La categoría Anulado solo se asigna al anular un gasto",
      path: ["categoria"],
    });
  }
});

export type GastoFormValues = z.infer<typeof GastoSchema>;

export const AnularGastoSchema = z.object({
  id: z.string().min(1),
  razon: z
    .string()
    .trim()
    .min(3, "Indica la razón de la anulación (mínimo 3 caracteres)")
    .max(500, "La razón no puede exceder 500 caracteres"),
});

export type AnularGastoValues = z.infer<typeof AnularGastoSchema>;

export interface GastoMovimiento {
  id: string;
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
  razon?: string;
  categoria_anterior?: string;
}

export interface GastoItem {
  id: string;
  nombre: string;
  cantidad: number;
  categoria: string;
  descripcion?: string | null;
  fecha: string;
  created_at: string;
  created_by: string;
  movimientos: GastoMovimiento[];
}

export interface GastoCategoriaItem {
  id?: string;
  categoria: string;
  created_at?: string;
}
