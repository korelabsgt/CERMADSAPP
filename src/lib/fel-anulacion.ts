export function isConsumidorFinalNit(nit?: string | null): boolean {
  if (!nit?.trim()) return true;
  const normalized = nit.trim().toUpperCase().replace(/[\s/.\-]/g, "");
  return (
    normalized === "CF" ||
    normalized === "CONSUMIDORFINAL" ||
    normalized === "CONSUMIDOR"
  );
}

export function diaCalendarioGT(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addCalendarDays(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const utc = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days);
  const dt = new Date(utc);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function formatDiaGT(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-");
  if (!y || !m || !d) return yyyyMmDd;
  return `${d}/${m}/${y}`;
}

export function toFelFechaGT(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const source = Number.isNaN(d.getTime()) ? new Date() : d;
  const gt = new Date(source.getTime() - 6 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${gt.getUTCFullYear()}-${pad(gt.getUTCMonth() + 1)}-${pad(gt.getUTCDate())}T${pad(gt.getUTCHours())}:${pad(gt.getUTCMinutes())}:${pad(gt.getUTCSeconds())}-06:00`;
}

export function plazoAnulacionInmediata(fechaEmision: string): {
  permitido: boolean;
  fechaEmision: string;
  fechaLimite: string;
} {
  const emision = diaCalendarioGT(fechaEmision);
  const hoy = diaCalendarioGT(new Date());
  const limite = addCalendarDays(emision, 1);
  return {
    permitido: hoy === emision || hoy === limite,
    fechaEmision: emision,
    fechaLimite: limite,
  };
}

export function mensajePlazoAnulacionCf(plazo: {
  fechaEmision: string;
  fechaLimite: string;
}): string {
  return `Ya no se puede anular de inmediato. La SAT solo permite anular facturas a Consumidor Final el mismo día de emisión o al día siguiente (límite ${formatDiaGT(plazo.fechaLimite)}). Fuera de ese plazo la anulación es extemporánea y requiere autorización de la SAT. No use nota de crédito sobre una factura a CF.`;
}
