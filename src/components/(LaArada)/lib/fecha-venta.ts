type DocumentoVenta = {
  estado?: string | null;
  fecha_certificacion?: string | null;
};

type VentaConFecha = {
  fecha_entrega?: string | null;
  created_at?: string | null;
  dte_documentos?: DocumentoVenta[] | DocumentoVenta | null;
};

const ZONA = "America/Guatemala";

function documentos(order: VentaConFecha): DocumentoVenta[] {
  const raw = order.dte_documentos;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function claveDiaGuatemala(valor: string): string | null {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA });
}

export function claveFechaVenta(order: VentaConFecha): string | null {
  if (order.fecha_entrega) {
    const texto = String(order.fecha_entrega).trim();
    if (texto.length >= 10) return texto.slice(0, 10);
  }
  if (order.created_at) {
    const texto = String(order.created_at).trim();
    if (texto.length >= 10) return texto.slice(0, 10);
  }
  return null;
}

export function claveFechaFactura(order: VentaConFecha): string | null {
  const fechas = documentos(order)
    .filter(
      (doc) =>
        String(doc.estado || "").toLowerCase() === "certificado" &&
        doc.fecha_certificacion,
    )
    .map((doc) => claveDiaGuatemala(String(doc.fecha_certificacion)))
    .filter((clave): clave is string => Boolean(clave))
    .sort();

  return fechas.at(-1) ?? null;
}

export function claveFechaConteo(order: VentaConFecha): string {
  return claveFechaFactura(order) || claveFechaVenta(order) || "Sin Fecha";
}

export function fechaConteoVenta(order: VentaConFecha): Date | null {
  const clave = claveFechaFactura(order) || claveFechaVenta(order);
  if (!clave) return null;
  const fecha = new Date(`${clave}T12:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function formatearFechaClave(clave: string | null): string {
  if (!clave) return "Sin fecha";
  const fecha = new Date(`${clave.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return clave;
  return fecha
    .toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "");
}
