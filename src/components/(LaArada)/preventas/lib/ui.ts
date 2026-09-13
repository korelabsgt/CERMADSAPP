import { cn } from "@/lib/utils";

export const tableShell =
  "overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-sky-600 bg-white shadow-sm dark:border-zinc-700 dark:border-t-sky-400 dark:bg-zinc-900";

export const creditosTableWrap =
  "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export const creditosTableScroll = "overflow-x-auto overscroll-x-contain";

export const creditosTableClass =
  "w-full min-w-[36rem] text-xs md:text-sm text-left";

export const creditosTheadClass =
  "border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300";

export const creditosTbodyClass =
  "divide-y divide-zinc-100 dark:divide-zinc-700";

export const creditosRowClass =
  "cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40";

export const creditosNavBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-red-100 hover:text-red-600 cursor-pointer dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950 dark:hover:text-red-400";

export const tableClass = "w-full table-fixed border-collapse text-sm";

export const thClass =
  "border-r border-zinc-200 px-4 py-4 text-left text-xs font-bold uppercase text-zinc-600 dark:border-zinc-700 dark:text-zinc-300";

export const thClassLast =
  "px-4 py-4 text-left text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300";

export const thRowClass = "bg-zinc-50 dark:bg-zinc-800/60";

export const tdClass =
  "border-r border-zinc-200 px-4 py-4 text-sm text-foreground dark:border-zinc-700";

export const tdClassLast = "px-4 py-4 text-sm text-foreground";

export const colNo = "w-12 px-3 text-center";

export const colNombre = "w-[38%] min-w-[10rem]";

export const colNit = "w-28";

export const colTelefono = "w-32";

export const colSaldo = "w-32";

export const colMov = "w-14 px-3 text-center";

export const colAcciones = "w-16 px-1 text-center";

export const cellAccionesWrap =
  "flex w-full items-center justify-center";

export const entrarBtn =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-sky-600 bg-sky-100 text-sky-600 transition-colors hover:bg-sky-200 cursor-pointer dark:border-sky-400 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900";

export const ventaBtnClass =
  "inline-flex h-9 w-auto min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-sky-600 bg-sky-100 px-3 text-[10px] font-bold uppercase tracking-wide text-sky-600 transition-colors hover:bg-sky-200 cursor-pointer dark:border-sky-400 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900 disabled:cursor-not-allowed disabled:pointer-events-none";

export const cargaBtnGrayClass =
  "inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-zinc-400 bg-zinc-200 px-2 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-300 cursor-pointer dark:border-zinc-500 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 normal-case tracking-normal";

export const movimientoEditBtnClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition-colors hover:bg-amber-200 cursor-pointer dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900";

export const movimientoDeleteBtnClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900";

export const pdfBtnClass =
  "inline-flex h-9 w-auto min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-500 bg-red-100 px-3 text-[10px] font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:border-red-400 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 disabled:cursor-not-allowed disabled:pointer-events-none";

export const cargarSaldoBtn =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-100 px-5 text-xs font-bold uppercase text-sky-600 transition-colors hover:bg-sky-200 cursor-pointer dark:border-sky-400 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900";

export const simularToggleOff =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-200 px-5 text-xs font-bold uppercase text-zinc-700 transition-colors hover:bg-zinc-300 cursor-pointer dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600";

export const rowClass = (index: number) =>
  cn(
    index % 2 === 1
      ? "bg-zinc-50/80 dark:bg-zinc-800/40"
      : "bg-white dark:bg-zinc-900",
  );

export const phonePill =
  "inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

export const searchInput =
  "h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900";

export const actionBtn =
  "inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 cursor-pointer dark:text-zinc-400 dark:hover:bg-zinc-800";

export const formatMoney = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const formatFechaHora = (value?: string | null) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Sin fecha";
  const gt = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const dia = DIAS_SEMANA[gt.getDay()];
  const numero = String(gt.getDate()).padStart(2, "0");
  const mes = String(gt.getMonth() + 1).padStart(2, "0");
  const anio = String(gt.getFullYear()).slice(-2);
  let horas = gt.getHours();
  const min = String(gt.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  if (horas === 0) horas = 12;
  return `${dia} ${numero}/${mes}/${anio}, ${horas}:${min} ${ampm}`;
};
