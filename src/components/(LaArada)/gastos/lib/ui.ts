import { cn } from "@/lib/utils";

// Pestaña superior roja conforme solicitado por el usuario
export const tableShell =
  "overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-red-600 bg-white shadow-sm dark:border-zinc-700 dark:border-t-red-500 dark:bg-zinc-900";

export const gastosTableWrap =
  "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export const gastosTableScroll = "overflow-x-auto overscroll-x-contain";

export const gastosTableClass =
  "w-full min-w-[48rem] text-xs md:text-sm text-left";

export const gastosTheadClass =
  "border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300";

export const gastosTbodyClass =
  "divide-y divide-zinc-100 dark:divide-zinc-700";

export const gastosRowClass =
  "cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40";

export const nuevoGastoBtn =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-100 px-5 text-xs font-bold uppercase text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:border-red-500 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900";

export const simularToggleActive =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-100 px-4 text-xs font-bold uppercase text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:border-red-500 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900";

export const simularToggleInactive =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-200 px-4 text-xs font-bold uppercase text-zinc-700 transition-colors hover:bg-zinc-300 cursor-pointer dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

export const searchInput =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export const actionBtn =
  "inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800";

export const formatMoney = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Formato solicitado: Lun 01/06/26
export const formatFechaCorta = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  const diaSemana = DIAS_SEMANA[date.getDay()];
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = String(date.getFullYear()).slice(-2);

  return `${diaSemana} ${dia}/${mes}/${anio}`;
};

export const formatFechaSimple = (value?: string | null) => {
  return formatFechaCorta(value);
};

export const formatFechaHora = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Sin fecha";

  const diaSemana = DIAS_SEMANA[date.getDay()];
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = String(date.getFullYear()).slice(-2);

  let horas = date.getHours();
  const minutos = String(date.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  if (horas === 0) horas = 12;
  const horasStr = String(horas).padStart(2, "0");

  return `${diaSemana} ${dia}/${mes}/${anio}, ${horasStr}:${minutos} ${ampm}`;
};

/**
 * Convierte una fecha a formato local 'YYYY-MM-DDTHH:mm' apto para <input type="datetime-local" />
 * respetando la hora y fecha local actual del usuario (sin desfase UTC).
 */
export const formatLocalDatetimeInput = (value?: string | Date | null): string => {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Rango del mes actual en formato "DD / MM / AA"
export const getCurrentMonthSlashRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const pad = (n: number) => String(n).padStart(2, "0");
  const yr = String(year).slice(-2);

  const desde = `${pad(firstDay.getDate())} / ${pad(month + 1)} / ${yr}`;
  const hasta = `${pad(lastDay.getDate())} / ${pad(month + 1)} / ${yr}`;

  return { desde, hasta };
};

// Formatea el texto mientras el usuario escribe en formato "DD / MM / AA"
export const formatSlashDateInput = (val: string): string => {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
  // Si pegó 8 dígitos (ej: 01092026), toma los últimos 2 para el año
  return `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(6, 8)}`;
};

// Convierte "DD / MM / AA" a objeto Date para filtrar
export const parseSlashDate = (str?: string | null, isEnd = false): Date | null => {
  if (!str) return null;
  const digits = str.replace(/\D/g, "");
  if (digits.length < 6) return null;

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  let yearStr = digits.slice(4);
  if (yearStr.length > 2) yearStr = yearStr.slice(-2);
  let year = parseInt(yearStr, 10);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = isEnd
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (isNaN(date.getTime())) return null;
  return date;
};

export const formatNombreCorto = (fullName?: string | null): string => {
  if (!fullName) return "—";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${parts[1]}`;
  // If 3 or more names (e.g. Mynor Joel Miranda Villafuerte) -> First name and First surname
  return `${parts[0]} ${parts[2] || parts[1]}`;
};

