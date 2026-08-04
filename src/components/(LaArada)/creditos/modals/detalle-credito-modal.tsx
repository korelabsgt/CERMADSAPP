"use client";

import { useUser } from "@/components/(base)/providers/UserProvider";
import ReceiptModal from "@/components/(LaArada)/ventas/modals/receipt-modal";
import { showConfirm, showToast } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileDown,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { exportAbonosPdf, exportReportePdf } from "../lib/export-reporte-pdf";
import { useEditarAbono, useEliminarAbono, useProcesarPago } from "../lib/hooks";
import {
  ClienteCredito,
  DteDocumentoCredito,
  PagoCreditoHistorial,
  VentaCredito,
} from "../lib/zod";

interface DetalleCreditoModalProps {
  cliente: ClienteCredito;
  ventasCliente: VentaCredito[];
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const felToneClass =
  "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 border border-sky-200 dark:border-sky-800";

type VistaCuenta = "Reportes" | "Abonar";
type FiltroAbonos = "Pendientes" | "Pagadas";
type FiltroEstadoReporte = "pendientes" | "pagadas" | "todos";
type PageSizeReporte = 15 | 30 | 45 | "all";

const PAGE_SIZE_REPORTE_OPTIONS: { value: PageSizeReporte; label: string }[] =
  [
    { value: 15, label: "15" },
    { value: 30, label: "30" },
    { value: 45, label: "45" },
    { value: "all", label: "Todos" },
  ];

const FILTRO_ABONOS_OPTIONS: FiltroAbonos[] = ["Pendientes", "Pagadas"];
const FILTRO_ESTADO_REPORTE_OPTIONS: {
  value: FiltroEstadoReporte;
  label: string;
}[] = [
  { value: "pendientes", label: "Solo Pendientes" },
  { value: "pagadas", label: "Solo Pagados" },
  { value: "todos", label: "Todos" },
];

const getVentaCodigo = (venta: VentaCredito) =>
  venta.id
    ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}`
    : "---";

const getVentaLabel = (venta: VentaCredito) =>
  venta.numero_recibo
    ? String(venta.numero_recibo).padStart(5, "0")
    : getVentaCodigo(venta);

const getTotalAbonos = (venta: VentaCredito) =>
  (venta.ven_pagos ?? []).reduce(
    (sum, pago) => sum + Number(pago.monto || 0),
    0,
  );

const getSaldoPendiente = (venta: VentaCredito) => {
  if (venta.saldo_pendiente !== undefined && venta.saldo_pendiente !== null) {
    return Number(venta.saldo_pendiente);
  }
  return Number(venta.total || 0) - getTotalAbonos(venta);
};

const ventaEstaPagada = (venta: VentaCredito) =>
  venta.estado === "Pagado" || getSaldoPendiente(venta) <= 0;

const getAnioActualGuatemala = () => {
  const guatemala = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  return guatemala.getFullYear();
};

const getRangoAnioActual = () => {
  const anio = getAnioActualGuatemala();
  return {
    desde: `${anio}-01-01`,
    hasta: `${anio}-12-31`,
  };
};

const getVentaFechaKey = (venta: VentaCredito) => {
  const value = venta.created_at || venta.fecha_entrega;
  if (!value) return null;
  if (typeof value === "string" && value.length >= 10) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  const guatemala = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const y = guatemala.getFullYear();
  const m = String(guatemala.getMonth() + 1).padStart(2, "0");
  const d = String(guatemala.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateShort = (value?: string | null) => {
  if (!value) return "Sin fecha";
  let date = new Date(value);
  if (typeof value === "string" && value.length === 10) {
    date = new Date(`${value}T12:00:00`);
  }
  if (isNaN(date.getTime())) return "Sin fecha";

  const guatemala = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const dia = DIAS_SEMANA[guatemala.getDay()];
  const numero = String(guatemala.getDate()).padStart(2, "0");
  const mes = String(guatemala.getMonth() + 1).padStart(2, "0");
  const anio = String(guatemala.getFullYear()).slice(-2);
  return `${dia} ${numero}/${mes}/${anio}`;
};

const formatDateTimeShort = (value?: string | null) => {
  if (!value) return "Sin fecha";
  let date = new Date(value);
  if (typeof value === "string" && value.length === 10) {
    date = new Date(`${value}T12:00:00`);
  }
  if (isNaN(date.getTime())) return "Sin fecha";

  const guatemala = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const dia = DIAS_SEMANA[guatemala.getDay()];
  const numero = String(guatemala.getDate()).padStart(2, "0");
  const mes = String(guatemala.getMonth() + 1).padStart(2, "0");
  const anio = String(guatemala.getFullYear()).slice(-2);
  let horas = guatemala.getHours();
  const minutos = String(guatemala.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  if (horas === 0) horas = 12;
  return `${dia} ${numero}/${mes}/${anio} ${horas}:${minutos} ${ampm}`;
};

const NOMBRE_PARTICULAS = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "el",
  "y",
  "e",
  "da",
  "do",
  "das",
  "dos",
  "van",
  "von",
]);

const esParticulaNombre = (word: string) => {
  const lower = word.toLowerCase().replace(/\./g, "");
  if (NOMBRE_PARTICULAS.has(lower)) return true;
  return lower.length <= 3;
};

const formatNombreCobro = (nombre?: string | null) => {
  if (!nombre?.trim()) return "Desconocido";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const significativas = partes.filter((p) => !esParticulaNombre(p));
  if (significativas.length === 0) return partes[0] ?? "Desconocido";
  if (significativas.length === 1) return significativas[0];
  if (significativas.length === 2) {
    return `${significativas[0]} ${significativas[1]}`;
  }
  return `${significativas[0]} ${significativas[2]}`;
};

const formatMoney = (value: number | string | null | undefined) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatFelNumero = (
  serie?: string | null,
  numero?: number | string | null,
) => {
  if (!serie && (numero === null || numero === undefined || numero === "")) {
    return "FEL";
  }
  const numeroStr =
    numero === null || numero === undefined || numero === ""
      ? ""
      : String(numero).padStart(8, "0");
  return numeroStr ? `${serie || "FEL"}-${numeroStr}` : String(serie || "FEL");
};

const getFelCertificado = (venta: VentaCredito) =>
  (venta.dte_documentos ?? []).find((doc) => doc.estado === "certificado");

const getComprobanteLabel = (venta: VentaCredito) => {
  const dte = getFelCertificado(venta);
  if (dte) return `FEL: ${formatFelNumero(dte.serie, dte.numero)}`;
  return `Recibo: #${getVentaLabel(venta)}`;
};

function FelInfoPanel({
  dte,
  totalVenta,
  clienteNombre,
  onOpen,
}: {
  dte: DteDocumentoCredito;
  totalVenta: number;
  clienteNombre: string;
  onOpen: () => void;
}) {
  const total = Number(dte.gran_total ?? totalVenta);
  const base = total / 1.12;
  const iva = total - base;

  return (
    <div className={cn("overflow-hidden rounded-xl", felToneClass)}>
      <div className="flex items-center gap-2 border-b border-sky-200/70 px-3 py-2 dark:border-sky-800/70">
        <FileCheck2 className="size-3.5 shrink-0" />
        <p className="truncate text-[10px] font-bold uppercase tracking-widest">
          Certificación · {formatDateShort(dte.fecha_certificacion)}
        </p>
      </div>

      <table className="w-full text-left text-xs">
        <tbody>
          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
            <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              Receptor
            </th>
            <td className="px-3 py-2 font-semibold">
              {dte.nombre_receptor || clienteNombre}
            </td>
          </tr>
          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
            <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              NIT
            </th>
            <td className="px-3 py-2 font-mono font-semibold">
              {dte.id_receptor || "—"}
            </td>
          </tr>
          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
            <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              FEL
            </th>
            <td className="px-3 py-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="break-all text-left font-mono text-[11px] font-semibold underline-offset-2 hover:underline cursor-pointer"
              >
                {formatFelNumero(dte.serie, dte.numero)}
              </button>
            </td>
          </tr>
          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
            <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              UUID
            </th>
            <td className="break-all px-3 py-2 font-mono text-[11px] font-semibold">
              {dte.uuid_infile || "—"}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="px-3 py-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70">
                    Base
                  </p>
                  <p className="font-semibold tabular-nums">
                    Q{formatMoney(base)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70">
                    IVA
                  </p>
                  <p className="font-semibold tabular-nums">
                    Q{formatMoney(iva)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70">
                    Total
                  </p>
                  <p className="font-black tabular-nums">
                    Q{formatMoney(total)}
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AbonoPagoMenu({
  onPrint,
  onEdit,
  onDelete,
  canManage,
  isDeleting,
  disabled,
}: {
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  isDeleting: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  const runAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled || isDeleting}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-label="Opciones del abono"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={8}
          className="z-[10050] w-48 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-xl"
        >
          <button
            type="button"
            onClick={() => runAction(onPrint)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Printer className="size-4 shrink-0 text-sky-600" />
            Imprimir
          </button>
          {canManage ? (
            <>
              <button
                type="button"
                onClick={() => runAction(onEdit)}
                disabled={disabled}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
              >
                <Pencil className="size-4 shrink-0 text-amber-600" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => runAction(onDelete)}
                disabled={disabled || isDeleting}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4 shrink-0" />
                Borrar
              </button>
            </>
          ) : null}
        </PopoverContent>
      </Popover>
  );
}

export default function DetalleCreditoModal({
  cliente,
  ventasCliente,
}: DetalleCreditoModalProps) {
  const router = useRouter();
  const [abonos, setAbonos] = useState<Record<string, number>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [whatsappVentaId, setWhatsappVentaId] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [deletingPagoId, setDeletingPagoId] = useState<string | null>(null);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [savingPagoId, setSavingPagoId] = useState<string | null>(null);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [vista, setVista] = useState<VistaCuenta>("Reportes");
  const [filtroAbonos, setFiltroAbonos] =
    useState<FiltroAbonos>("Pendientes");
  const [busquedaVenta, setBusquedaVenta] = useState("");
  const [busquedaReporte, setBusquedaReporte] = useState("");
  const [busquedaAbono, setBusquedaAbono] = useState("");
  const [ventaFocoId, setVentaFocoId] = useState<string | null>(null);
  const [filtroEstadoReporte, setFiltroEstadoReporte] =
    useState<FiltroEstadoReporte>("pendientes");
  const [fechaDesde, setFechaDesde] = useState(
    () => getRangoAnioActual().desde,
  );
  const [fechaHasta, setFechaHasta] = useState(
    () => getRangoAnioActual().hasta,
  );
  const [exportandoReporte, setExportandoReporte] = useState(false);
  const [exportandoAbonos, setExportandoAbonos] = useState(false);
  const [pageSizeReporte, setPageSizeReporte] = useState<PageSizeReporte>(15);
  const [currentPageReporte, setCurrentPageReporte] = useState(1);

  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canManageAbono = userRole === "super" || userRole === "admin";

  const { mutateAsync: procesarPago } = useProcesarPago();
  const { mutateAsync: eliminarAbono } = useEliminarAbono();
  const { mutateAsync: editarAbono } = useEditarAbono();

  const ventasPendientes = useMemo(
    () => ventasCliente.filter((venta) => !ventaEstaPagada(venta)),
    [ventasCliente],
  );
  const ventasPagadas = useMemo(
    () => ventasCliente.filter((venta) => ventaEstaPagada(venta)),
    [ventasCliente],
  );
  const ventasAbonos = useMemo(() => {
    if (ventaFocoId) {
      return ventasCliente.filter((venta) => venta.id === ventaFocoId);
    }

    const base =
      filtroAbonos === "Pendientes" ? ventasPendientes : ventasPagadas;
    const term = busquedaVenta.trim().replace(/^#/, "").toLowerCase();
    if (!term) return base;

    return base.filter((venta) => {
      const label = getVentaLabel(venta).toLowerCase();
      const idShort = venta.id
        ? `${venta.id.substring(0, 3)}-${venta.id.substring(3, 6)}`.toLowerCase()
        : "";
      const idRaw = venta.id?.toLowerCase() ?? "";
      return (
        label.includes(term) ||
        idShort.includes(term) ||
        idRaw.startsWith(term)
      );
    });
  }, [
    ventaFocoId,
    ventasCliente,
    filtroAbonos,
    ventasPendientes,
    ventasPagadas,
    busquedaVenta,
  ]);
  const ventasReporte = useMemo(() => {
    const base =
      filtroEstadoReporte === "todos"
        ? ventasCliente
        : filtroEstadoReporte === "pagadas"
          ? ventasPagadas
          : ventasPendientes;
    const desde = fechaDesde || "0000-01-01";
    const hasta = fechaHasta || "9999-12-31";
    const term = busquedaReporte.trim().replace(/^#/, "").toLowerCase();

    return base.filter((venta) => {
      const key = getVentaFechaKey(venta);
      if (!key || key < desde || key > hasta) return false;
      if (!term) return true;

      const label = getVentaLabel(venta).toLowerCase();
      const idShort = venta.id
        ? `${venta.id.substring(0, 3)}-${venta.id.substring(3, 6)}`.toLowerCase()
        : "";
      const idRaw = venta.id?.toLowerCase() ?? "";
      return (
        label.includes(term) ||
        idShort.includes(term) ||
        idRaw.startsWith(term)
      );
    });
  }, [
    filtroEstadoReporte,
    ventasCliente,
    ventasPagadas,
    ventasPendientes,
    fechaDesde,
    fechaHasta,
    busquedaReporte,
  ]);

  const totalPagesReporte = useMemo(() => {
    if (pageSizeReporte === "all") return 1;
    return Math.max(1, Math.ceil(ventasReporte.length / pageSizeReporte));
  }, [ventasReporte.length, pageSizeReporte]);

  const safeCurrentPageReporte = Math.min(
    currentPageReporte,
    totalPagesReporte,
  );

  useEffect(() => {
    setCurrentPageReporte(1);
  }, [
    filtroEstadoReporte,
    fechaDesde,
    fechaHasta,
    busquedaReporte,
    pageSizeReporte,
    ventasCliente.length,
  ]);

  const ventasReportePagina = useMemo(() => {
    if (pageSizeReporte === "all") return ventasReporte;
    const start = (safeCurrentPageReporte - 1) * pageSizeReporte;
    return ventasReporte.slice(start, start + pageSizeReporte);
  }, [ventasReporte, pageSizeReporte, safeCurrentPageReporte]);

  const handleFiltroAbonos = (filtro: FiltroAbonos) => {
    setFiltroAbonos(filtro);
    setWhatsappVentaId(null);
  };

  const irAAbonarVenta = (venta: VentaCredito) => {
    setVentaFocoId(venta.id);
    setFiltroAbonos(ventaEstaPagada(venta) ? "Pagadas" : "Pendientes");
    setBusquedaVenta("");
    setBusquedaAbono("");
    setWhatsappVentaId(null);
    setVista("Abonar");
  };

  const volverAReportes = () => {
    setVista("Reportes");
    setVentaFocoId(null);
    setWhatsappVentaId(null);
    setBusquedaVenta("");
    setBusquedaAbono("");
  };

  const limpiarMontoAbono = (ventaId: string) => {
    setAbonos((prev) => {
      const next = { ...prev };
      delete next[ventaId];
      return next;
    });
  };

  const getPagoLabel = (pago: PagoCreditoHistorial) =>
    pago.id
      ? `${pago.id.substring(0, 3).toUpperCase()}-${pago.id.substring(3, 6).toUpperCase()}`
      : "---";

  const filtrarPagos = (pagos: PagoCreditoHistorial[] | undefined) => {
    const lista = pagos ?? [];
    const term = busquedaAbono.trim().replace(/^#/, "").toLowerCase();
    if (!term) return lista;

    return lista.filter((pago) => {
      const label = getPagoLabel(pago).toLowerCase();
      const idRaw = pago.id?.toLowerCase() ?? "";
      const monto = String(pago.monto ?? "");
      const cajero = (pago.cajero_nombre ?? "").toLowerCase();
      return (
        label.includes(term) ||
        idRaw.startsWith(term) ||
        idRaw.includes(term) ||
        monto.includes(term) ||
        cajero.includes(term)
      );
    });
  };

  const openReceiptModal = (ventaId: string) => {
    setSelectedVentaId(ventaId);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedVentaId(null);
  };

  const handleExportarReporte = async () => {
    if (ventasReporte.length === 0) return;

    setExportandoReporte(true);
    try {
      const rows = ventasReporte.map((venta) => {
        const deuda = Number(venta.total || 0);
        const abonosTotal = getTotalAbonos(venta);
        const saldo = venta.saldo_pendiente ?? deuda - abonosTotal;

        return {
          fecha: formatDateShort(venta.created_at || venta.fecha_entrega),
          venta: `#${getVentaCodigo(venta)}`,
          comprobante: getComprobanteLabel(venta),
          deuda: `Q${formatMoney(deuda)}`,
          abonos: `Q${formatMoney(abonosTotal)}`,
          saldo: `Q${formatMoney(saldo)}`,
        };
      });

      const totales = {
        deuda: `Q${formatMoney(
          ventasReporte.reduce((sum, v) => sum + Number(v.total || 0), 0),
        )}`,
        abonos: `Q${formatMoney(
          ventasReporte.reduce((sum, v) => sum + getTotalAbonos(v), 0),
        )}`,
        saldo: `Q${formatMoney(
          ventasReporte.reduce((sum, v) => {
            const deuda = Number(v.total || 0);
            const abonosTotal = getTotalAbonos(v);
            return sum + (v.saldo_pendiente ?? deuda - abonosTotal);
          }, 0),
        )}`,
      };

      const result = await exportReportePdf(
        cliente.nombre,
        cliente.nit,
        rows,
        totales,
      );
      showToast(
        "success",
        result === "shared"
          ? "Elige WhatsApp y envía solo el PDF."
          : "Reporte PDF descargado correctamente.",
        "top",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      showToast("error", "No se pudo generar el PDF del reporte.", "top");
    } finally {
      setExportandoReporte(false);
    }
  };

  const handleExportarAbonos = async (ventaId?: string) => {
    const ventasBase = ventaId
      ? ventasAbonos.filter((venta) => venta.id === ventaId)
      : ventasAbonos;

    const ventasConAbonos = ventasBase
      .filter((venta) => (venta.ven_pagos?.length ?? 0) > 0)
      .sort((a, b) => {
        const ta = new Date(a.created_at || a.fecha_entrega || 0).getTime();
        const tb = new Date(b.created_at || b.fecha_entrega || 0).getTime();
        return tb - ta;
      });

    if (ventasConAbonos.length === 0) return;

    setExportandoAbonos(true);
    try {
      const sections = ventasConAbonos.map((venta) => {
          const deuda = Number(venta.total || 0);
          const abonado = getTotalAbonos(venta);
          const saldo = getSaldoPendiente(venta);
          const pagos = [...(venta.ven_pagos ?? [])].sort((a, b) => {
            const ta = new Date(a.created_at ?? 0).getTime();
            const tb = new Date(b.created_at ?? 0).getTime();
            return tb - ta;
          });

          return {
            venta: `#${getVentaCodigo(venta)}`,
            ventaFecha: formatDateTimeShort(
              venta.created_at || venta.fecha_entrega,
            ),
            deudaInicial: `Q${formatMoney(deuda)}`,
            abonado: `Q${formatMoney(abonado)}`,
            saldoPendiente: `Q${formatMoney(Math.max(0, saldo))}`,
            pagos: pagos.map((pago) => ({
              abono: `#${getPagoLabel(pago)}`,
              fecha: formatDateTimeShort(pago.created_at),
              cobro: formatNombreCobro(pago.cajero_nombre),
              monto: `Q${formatMoney(pago.monto)}`,
            })),
          };
        });

      const result = await exportAbonosPdf(
        cliente.nombre,
        cliente.nit,
        sections,
      );
      showToast(
        "success",
        result === "shared"
          ? "Elige WhatsApp y envía solo el PDF."
          : "PDF de abonos descargado correctamente.",
        "top",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      showToast("error", "No se pudo generar el PDF de abonos.", "top");
    } finally {
      setExportandoAbonos(false);
    }
  };

  const handleMontoChange = (id: string, value: string, max: number) => {
    const numValue = parseFloat(value) || 0;
    const montoValido = Math.min(Math.max(0, numValue), max);

    setAbonos((prev) => {
      const nuevosAbonos = { ...prev };
      if (montoValido > 0) {
        nuevosAbonos[id] = montoValido;
      } else {
        delete nuevosAbonos[id];
      }
      return nuevosAbonos;
    });
  };

  const handlePagarVenta = async (id: string, monto: number) => {
    if (monto <= 0) return;
    setProcessingId(id);
    try {
      await procesarPago({
        venta_id: id,
        monto,
        metodo_pago: "Efectivo",
        observaciones: "Abono a cuenta por cobrar",
      });
      setAbonos((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast(
        "success",
        `Se registró correctamente el abono de Q${monto.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        "top",
      );
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const imprimirRecibo = (pago: PagoCreditoHistorial, venta: VentaCredito) => {
    const event = new CustomEvent("imprimir-pago-directo", {
      detail: { pago, venta, cliente },
    });
    window.dispatchEvent(event);
  };

  const handleEliminarAbono = async (
    pago: PagoCreditoHistorial,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    if (!pago.id) return;

    const result = await showConfirm({
      title: "¿Eliminar abono?",
      html: `Se eliminará el abono de <strong>Q${Number(pago.monto).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> y se recalculará el saldo pendiente.`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setDeletingPagoId(pago.id);
    try {
      await eliminarAbono(pago.id);
      if (editingPagoId === pago.id) {
        setEditingPagoId(null);
        setEditMonto("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingPagoId(null);
    }
  };

  const iniciarEdicionAbono = (
    pago: PagoCreditoHistorial,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    if (!pago.id) return;
    setEditingPagoId(pago.id);
    setEditMonto(String(Number(pago.monto)));
  };

  const cancelarEdicionAbono = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPagoId(null);
    setEditMonto("");
  };

  const handleGuardarAbono = async (pago: PagoCreditoHistorial) => {
    if (!pago.id) return;

    const monto = Number(editMonto);
    if (!Number.isFinite(monto) || monto <= 0) {
      showToast("error", "Ingresa un monto válido mayor a 0.");
      return;
    }

    setSavingPagoId(pago.id);
    try {
      await editarAbono({ pago_id: pago.id, monto });
      setEditingPagoId(null);
      setEditMonto("");
    } catch (error) {
      console.error(error);
    } finally {
      setSavingPagoId(null);
    }
  };

  const handleVolver = () => {
    if (vista === "Abonar") {
      volverAReportes();
      return;
    }
    router.push("/cermadsa/laarada/creditos");
  };

  return (
    <>
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col animate-in fade-in duration-300">
            {vista === "Abonar" ? (
              <div className="mb-5 shrink-0 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={volverAReportes}
                    disabled={processingId !== null}
                    className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Reportes
                    </span>
                  </button>

                  <div className="min-w-0 text-right">
                    <h2 className="text-base font-black uppercase tracking-tight text-foreground md:text-xl">
                      Abonar cuenta
                    </h2>
                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                      {cliente.nombre}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                      NIT: {cliente.nit}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={handleVolver}
                  disabled={processingId !== null}
                  className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Volver
                  </span>
                </button>

                <div className="min-w-0 text-right">
                  <h2 className="text-base font-black uppercase tracking-tight text-foreground md:text-xl">
                    Detalle de Cuenta
                  </h2>
                  <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                    {cliente.nombre}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">
                    NIT: {cliente.nit}
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-4 w-full">
              {vista === "Reportes" ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap shrink-0">
                      <select
                        value={filtroEstadoReporte}
                        onChange={(e) =>
                          setFiltroEstadoReporte(
                            e.target.value as FiltroEstadoReporte,
                          )
                        }
                        aria-label="Filtro de estado"
                        className="h-10 rounded-xl border-2 border-celeste-trifinio bg-transparent px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 cursor-pointer"
                      >
                        {FILTRO_ESTADO_REPORTE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          Desde
                          <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="h-9 rounded-lg border-2 border-celeste-trifinio bg-transparent px-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 cursor-pointer"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          Hasta
                          <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="h-9 rounded-lg border-2 border-celeste-trifinio bg-transparent px-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="relative min-w-0 flex-1 w-full">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={busquedaReporte}
                        onChange={(e) => setBusquedaReporte(e.target.value)}
                        aria-label="Buscar por número de venta"
                        className="h-10 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-9 pr-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleExportarReporte}
                      disabled={
                        exportandoReporte || ventasReporte.length === 0
                      }
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-100 px-4 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    >
                      {exportandoReporte ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <FileDown className="size-4" />
                      )}
                      PDF
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
                    <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[50rem] text-xs md:text-sm text-left">
                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500">
                      <tr>
                        <th className="sticky left-0 z-20 bg-zinc-50 px-4 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                          Venta
                        </th>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Comprobante</th>
                        <th className="px-4 py-3 text-right">Deuda</th>
                        <th className="px-4 py-3 text-right">Abonado</th>
                        <th className="px-4 py-3 text-right">Saldo</th>
                        <th className="px-4 py-3 w-14" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {ventasReporte.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-8 text-center font-bold text-zinc-500"
                          >
                            {busquedaReporte.trim()
                              ? "No se encontró esa venta."
                              : filtroEstadoReporte === "pagadas"
                                ? "No hay ventas pagadas en el rango de fechas."
                                : filtroEstadoReporte === "todos"
                                  ? "No hay ventas en el rango de fechas."
                                  : "No hay ventas con saldo pendiente en el rango de fechas."}
                          </td>
                        </tr>
                      ) : (
                        ventasReportePagina.map((venta) => {
                          const deuda = Number(venta.total || 0);
                          const abonosTotal = getTotalAbonos(venta);
                          const saldo =
                            venta.saldo_pendiente ?? deuda - abonosTotal;
                          const dteFel = getFelCertificado(venta);
                          const comprobanteLabel = getComprobanteLabel(venta);
                          const puedeAbonar = !ventaEstaPagada(venta);

                          const ventaCodigo = getVentaCodigo(venta);

                          return (
                            <tr
                              key={venta.id}
                              onClick={() => irAAbonarVenta(venta)}
                              className="cursor-pointer transition-colors hover:bg-zinc-50/80"
                            >
                              <td className="sticky left-0 z-10 bg-white px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                                #{ventaCodigo}
                              </td>
                              <td className="px-4 py-3 font-bold whitespace-nowrap">
                                {formatDateShort(
                                  venta.created_at || venta.fecha_entrega,
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openReceiptModal(venta.id);
                                  }}
                                  className={cn(
                                    "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold transition-opacity hover:opacity-80 cursor-pointer whitespace-nowrap",
                                    dteFel
                                      ? "border border-sky-200 bg-sky-100 text-sky-600"
                                      : "border border-amber-200 bg-amber-100 text-amber-700",
                                  )}
                                >
                                  {comprobanteLabel}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                                Q{formatMoney(deuda)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600 whitespace-nowrap">
                                Q{formatMoney(abonosTotal)}
                              </td>
                              <td className="px-4 py-3 text-right font-black tabular-nums text-red-500 whitespace-nowrap">
                                Q{formatMoney(saldo)}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    irAAbonarVenta(venta);
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-red-100 hover:text-red-600 cursor-pointer"
                                  aria-label={
                                    puedeAbonar
                                      ? `Abonar venta #${ventaCodigo}`
                                      : `Ver historial de venta #${ventaCodigo}`
                                  }
                                >
                                  <ChevronRight className="size-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {ventasReporte.length > 0 ? (
                      <tfoot className="border-t border-zinc-200 bg-zinc-50 font-black text-[10px]">
                        <tr>
                          <td className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-zinc-500 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]">
                            Totales
                          </td>
                          <td colSpan={2} className="px-4 py-3" />
                          <td className="px-4 py-3 text-right tabular-nums text-sm">
                            Q
                            {formatMoney(
                              ventasReporte.reduce(
                                (sum, v) => sum + Number(v.total || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600">
                            Q
                            {formatMoney(
                              ventasReporte.reduce(
                                (sum, v) => sum + getTotalAbonos(v),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-red-500">
                            Q
                            {formatMoney(
                              ventasReporte.reduce((sum, v) => {
                                const deuda = Number(v.total || 0);
                                const abonosTotal = getTotalAbonos(v);
                                return (
                                  sum +
                                  (v.saldo_pendiente ?? deuda - abonosTotal)
                                );
                              }, 0),
                            )}
                          </td>
                          <td className="px-4 py-3" />
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                    </div>
                  </div>

                  {ventasReporte.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <select
                        value={pageSizeReporte}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPageSizeReporte(
                            value === "all"
                              ? "all"
                              : (Number(value) as PageSizeReporte),
                          );
                        }}
                        className="h-10 rounded-xl border-2 border-celeste-trifinio bg-transparent px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 cursor-pointer"
                        aria-label="Filas por página"
                      >
                        {PAGE_SIZE_REPORTE_OPTIONS.map((opt) => (
                          <option key={String(opt.value)} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPageReporte((p) => Math.max(1, p - 1))
                          }
                          disabled={
                            pageSizeReporte === "all" ||
                            safeCurrentPageReporte === 1
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-celeste-trifinio text-foreground transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="min-w-12 text-center text-xs font-black tabular-nums text-foreground">
                          {pageSizeReporte === "all"
                            ? "Todos"
                            : `${safeCurrentPageReporte}/${totalPagesReporte}`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPageReporte((p) =>
                              Math.min(totalPagesReporte, p + 1),
                            )
                          }
                          disabled={
                            pageSizeReporte === "all" ||
                            safeCurrentPageReporte === totalPagesReporte ||
                            totalPagesReporte === 0
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-celeste-trifinio text-foreground transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                          aria-label="Página siguiente"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {!ventaFocoId ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div
                        className="inline-flex w-full rounded-xl bg-zinc-200/80 p-1 dark:bg-zinc-800 sm:w-auto"
                        role="group"
                        aria-label="Filtro de abonos"
                      >
                        {FILTRO_ABONOS_OPTIONS.map((option) => {
                          const count =
                            option === "Pendientes"
                              ? ventasPendientes.length
                              : ventasPagadas.length;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleFiltroAbonos(option)}
                              className={cn(
                                "flex-1 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer sm:flex-none",
                                filtroAbonos === option
                                  ? option === "Pagadas"
                                    ? "bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-950 dark:text-emerald-400"
                                    : "bg-red-100 text-red-600 shadow-sm dark:bg-red-950 dark:text-red-400"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {option}
                              <span className="ml-1.5 opacity-70">({count})</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative w-full shrink-0 sm:w-64">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={busquedaVenta}
                          onChange={(e) => setBusquedaVenta(e.target.value)}
                          aria-label="Buscar por número de venta"
                          className="h-10 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-9 pr-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30"
                        />
                      </div>
                    </div>
                  ) : null}

                  {ventasAbonos.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-10 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                      {busquedaVenta.trim()
                        ? "No se encontró esa venta."
                        : filtroAbonos === "Pendientes"
                          ? "No hay ventas con saldo pendiente."
                          : "No hay ventas pagadas."}
                    </div>
                  ) : (
                    ventasAbonos.map((venta) => {
                      const saldoPendiente = getSaldoPendiente(venta);
                      const dteFel = getFelCertificado(venta);
                      const estaPagada = ventaEstaPagada(venta);
                      const ventaCodigo = getVentaCodigo(venta);
                      const pagosFiltrados = filtrarPagos(venta.ven_pagos);
                      const totalAbonosVenta = getTotalAbonos(venta);

                      return (
                        <div
                          key={venta.id}
                          className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 border-b border-zinc-200 bg-zinc-50/80 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-foreground">
                                  Venta #{ventaCodigo}
                                </p>
                                <p className="mt-1 text-sm font-medium text-muted-foreground">
                                  Vendió: {venta.vendedor_nombre}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-medium text-muted-foreground">
                                {formatDateShort(
                                  venta.created_at || venta.fecha_entrega,
                                )}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <p className="text-xs font-bold text-foreground">
                                  Deuda inicial
                                </p>
                                <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                                  Q{formatMoney(venta.total)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-foreground">
                                  Abonado
                                </p>
                                <p className="mt-1 text-sm font-bold tabular-nums text-emerald-600">
                                  Q{formatMoney(totalAbonosVenta)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-foreground">
                                  Saldo
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-sm font-bold tabular-nums",
                                    estaPagada
                                      ? "text-emerald-600"
                                      : "text-red-500",
                                  )}
                                >
                                  Q{formatMoney(Math.max(0, saldoPendiente))}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-5 p-5">
                              {dteFel ? (
                                <FelInfoPanel
                                  dte={dteFel}
                                  totalVenta={Number(venta.total)}
                                  clienteNombre={cliente.nombre}
                                  onOpen={() => openReceiptModal(venta.id)}
                                />
                              ) : null}

                              <div className="flex flex-col gap-3 border-b border-zinc-200 pb-3">
                                <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Historial de Pagos
                                </p>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                  <div className="relative min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                      type="text"
                                      value={busquedaAbono}
                                      onChange={(e) =>
                                        setBusquedaAbono(e.target.value)
                                      }
                                      aria-label="Buscar abono"
                                      className="h-9 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-9 pr-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30"
                                    />
                                  </div>
                                  {venta.ven_pagos &&
                                    venta.ven_pagos.length > 0 && (
                                      <div className="flex shrink-0 items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (whatsappVentaId === venta.id) {
                                              setWhatsappVentaId(null);
                                            } else {
                                              setWhatsappVentaId(venta.id);
                                              setWhatsappPhone(
                                                cliente?.telefono &&
                                                  cliente.telefono !== "N/A"
                                                  ? cliente.telefono
                                                  : "",
                                              );
                                            }
                                          }}
                                          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-emerald-100 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
                                        >
                                          <MessageCircle className="size-4" />
                                          Enviar Abonos
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleExportarAbonos(venta.id)
                                          }
                                          disabled={exportandoAbonos}
                                          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-red-100 px-3 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                                        >
                                          {exportandoAbonos ? (
                                            <Loader2 className="size-4 animate-spin" />
                                          ) : (
                                            <FileDown className="size-4" />
                                          )}
                                          PDF
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </div>

                              <AnimatePresence>
                                {whatsappVentaId === venta.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 flex items-center gap-2 overflow-hidden"
                                  >
                                    <input
                                      type="text"
                                      value={whatsappPhone}
                                      onChange={(e) =>
                                        setWhatsappPhone(e.target.value)
                                      }
                                      placeholder="Número sin código"
                                      className="flex-1 rounded-lg border-2 border-celeste-trifinio bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-celeste-trifinio/30"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (whatsappPhone) {
                                          const formatParts = (dStr?: string) => {
                                            if (!dStr) return { d: "N/A", t: "" };
                                            const d = new Date(dStr);
                                            const diaSemana = d
                                              .toLocaleDateString("es-GT", {
                                                weekday: "short",
                                              })
                                              .replace(".", "");
                                            const fechaManual = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
                                            const horaManual =
                                              d.toLocaleTimeString("es-GT", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                              });
                                            return {
                                              d: `${diaSemana}, ${fechaManual}`,
                                              t: horaManual,
                                            };
                                          };

                                          const numV = venta.id
                                            ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}`
                                            : "---";
                                          const fV = formatParts(venta.created_at);
                                          const totV = formatMoney(venta.total);
                                          const salV = formatMoney(
                                            venta.saldo_pendiente ?? 0,
                                          );

                                          let texto = `👤 *${cliente?.nombre}*\n\n*${fV.d}, ${fV.t}*\n\`\`\`Venta #${numV}: Q${totV}\`\`\`\n\n\n📝 *Abonos:*\n\n`;

                                          venta.ven_pagos?.forEach((pago) => {
                                            const fP = formatParts(
                                              pago.created_at,
                                            );
                                            const idA = pago.id
                                              ? `${pago.id.substring(0, 3).toUpperCase()}-${pago.id.substring(3, 6).toUpperCase()}`
                                              : "---";
                                            const monA = formatMoney(pago.monto);
                                            texto += `*${fP.d}, ${fP.t}*\n\`\`\`Abono #${idA}: Q${monA}\`\`\`\n\n`;
                                          });

                                          texto += `🧾 *Saldo: Q${salV}*\n\n\n*La Arada*\n*_¡Gracias por sus pagos!_*`;

                                          const url = `https://api.whatsapp.com/send?phone=502${whatsappPhone.replace(/\s+/g, "")}&text=${encodeURIComponent(texto)}`;
                                          window.open(url, "_blank");
                                          setWhatsappVentaId(null);
                                        }
                                      }}
                                      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-200 px-4 text-xs font-bold uppercase tracking-widest text-emerald-900 transition-colors hover:bg-emerald-300 dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
                                    >
                                      Enviar
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {saldoPendiente > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border-2 border-celeste-trifinio bg-white px-4 py-2.5 focus-within:ring-2 focus-within:ring-celeste-trifinio/30">
                                    <span className="text-sm font-black text-muted-foreground">
                                      Q
                                    </span>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      max={saldoPendiente}
                                      step="0.01"
                                      value={abonos[venta.id] || ""}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "-" ||
                                          e.key === "e" ||
                                          e.key === "E" ||
                                          e.key === "+"
                                        )
                                          e.preventDefault();
                                        if (e.key === "Escape") {
                                          limpiarMontoAbono(venta.id);
                                        }
                                        if (
                                          e.key === "Enter" &&
                                          (abonos[venta.id] ?? 0) > 0 &&
                                          processingId !== venta.id
                                        ) {
                                          e.preventDefault();
                                          void handlePagarVenta(
                                            venta.id,
                                            abonos[venta.id],
                                          );
                                        }
                                      }}
                                      onChange={(e) =>
                                        handleMontoChange(
                                          venta.id,
                                          e.target.value,
                                          saldoPendiente,
                                        )
                                      }
                                      className="w-full bg-transparent text-xl font-black outline-none md:text-2xl"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePagarVenta(
                                        venta.id,
                                        abonos[venta.id],
                                      )
                                    }
                                    disabled={
                                      processingId === venta.id ||
                                      (abonos[venta.id] ?? 0) <= 0
                                    }
                                    className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-sky-100 px-5 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900"
                                  >
                                    {processingId === venta.id ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <>Abonar</>
                                    )}
                                  </button>
                                </div>
                              ) : null}

                              <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
                                <div className="overflow-x-auto overscroll-x-contain">
                                  <table className="w-full min-w-[32rem] text-left text-xs md:text-sm">
                                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500">
                                      <tr>
                                        <th className="sticky left-0 z-30 w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] bg-zinc-50 px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800">
                                          Abono
                                        </th>
                                        <th className="w-[9.5rem] px-2 py-3">
                                          Fecha
                                        </th>
                                        <th className="px-4 py-3">Cobró</th>
                                        <th className="px-4 py-3 text-right">
                                          Monto
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                      {!venta.ven_pagos ||
                                      venta.ven_pagos.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-sm font-bold text-zinc-500"
                                          >
                                            No hay abonos registrados.
                                          </td>
                                        </tr>
                                      ) : pagosFiltrados.length === 0 ? (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-sm font-bold text-zinc-500"
                                          >
                                            No se encontró ese abono.
                                          </td>
                                        </tr>
                                      ) : (
                                        pagosFiltrados.map((pago, idx) => (
                                          <tr
                                            key={pago.id || idx}
                                            className="group transition-colors hover:bg-zinc-50"
                                          >
                                            <td className="sticky left-0 z-20 w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] whitespace-nowrap bg-white px-2 py-3 font-mono text-[11px] font-bold text-orange-500 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] group-hover:bg-zinc-50 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
                                              #{getPagoLabel(pago)}
                                            </td>
                                            <td className="whitespace-nowrap px-2 py-3 text-[11px] font-bold">
                                              {formatDateTimeShort(
                                                pago.created_at,
                                              )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                              {formatNombreCobro(
                                                pago.cajero_nombre,
                                              )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                              <div className="flex items-center justify-end gap-4">
                                                {editingPagoId === pago.id ? (
                                                  <>
                                                    <div className="inline-flex items-center gap-1">
                                                      <span className="font-black text-emerald-600">
                                                        Q
                                                      </span>
                                                      <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={editMonto}
                                                        onChange={(e) =>
                                                          setEditMonto(
                                                            e.target.value,
                                                          )
                                                        }
                                                        onKeyDown={(e) => {
                                                          if (
                                                            e.key === "-" ||
                                                            e.key === "e" ||
                                                            e.key === "E" ||
                                                            e.key === "+"
                                                          )
                                                            e.preventDefault();
                                                          if (
                                                            e.key === "Enter"
                                                          ) {
                                                            e.preventDefault();
                                                            void handleGuardarAbono(
                                                              pago,
                                                            );
                                                          }
                                                          if (
                                                            e.key === "Escape"
                                                          ) {
                                                            cancelarEdicionAbono();
                                                          }
                                                        }}
                                                        className="w-24 rounded-lg border-2 border-emerald-500/50 bg-transparent px-2 py-1 text-sm font-black text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/30"
                                                        autoFocus
                                                      />
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        void handleGuardarAbono(
                                                          pago,
                                                        )
                                                      }
                                                      disabled={
                                                        savingPagoId ===
                                                          pago.id ||
                                                        processingId !== null
                                                      }
                                                      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
                                                      title="Guardar abono"
                                                    >
                                                      {savingPagoId ===
                                                      pago.id ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                      ) : (
                                                        <Check className="size-4" />
                                                      )}
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={
                                                        cancelarEdicionAbono
                                                      }
                                                      disabled={
                                                        savingPagoId === pago.id
                                                      }
                                                      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                                                      title="Cancelar"
                                                    >
                                                      <X className="size-4" />
                                                    </button>
                                                  </>
                                                ) : (
                                                  <>
                                                    <span className="font-black tabular-nums text-emerald-600">
                                                      Q
                                                      {formatMoney(pago.monto)}
                                                    </span>
                                                    <AbonoPagoMenu
                                                      onPrint={() =>
                                                        imprimirRecibo(
                                                          pago,
                                                          venta,
                                                        )
                                                      }
                                                      onEdit={() =>
                                                        iniciarEdicionAbono(
                                                          pago,
                                                        )
                                                      }
                                                      onDelete={() =>
                                                        void handleEliminarAbono(
                                                          pago,
                                                        )
                                                      }
                                                      canManage={
                                                        canManageAbono &&
                                                        Boolean(pago.id)
                                                      }
                                                      isDeleting={
                                                        deletingPagoId ===
                                                        pago.id
                                                      }
                                                      disabled={
                                                        processingId !== null
                                                      }
                                                    />
                                                  </>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        ventaId={selectedVentaId}
        isReadonly
      />
    </>
  );
}
