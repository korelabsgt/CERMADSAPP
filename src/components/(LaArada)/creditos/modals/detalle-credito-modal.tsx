"use client";

import { useUser } from "@/components/(base)/providers/UserProvider";
import ReceiptModal from "@/components/(LaArada)/ventas/modals/receipt-modal";
import { showConfirm, showToast } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileCheck2,
  FileDown,
  History,
  Loader2,
  MessageCircle,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { exportReportePdf } from "../lib/export-reporte-pdf";
import { useEliminarAbono, useProcesarPago } from "../lib/hooks";
import {
  ClienteCredito,
  DteDocumentoCredito,
  PagoCreditoHistorial,
  VentaCredito,
} from "../lib/zod";

interface DetalleCreditoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteCredito | null;
  ventasCliente: VentaCredito[];
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const felToneClass =
  "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 border border-sky-200 dark:border-sky-800";

type VistaCuenta = "Abonos" | "Reportes";

const VISTA_OPTIONS: VistaCuenta[] = ["Abonos", "Reportes"];

const getVentaLabel = (venta: VentaCredito) =>
  venta.numero_recibo
    ? String(venta.numero_recibo).padStart(5, "0")
    : venta.id
      ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}`
      : "---";

const getTotalAbonos = (venta: VentaCredito) =>
  (venta.ven_pagos ?? []).reduce(
    (sum, pago) => sum + Number(pago.monto || 0),
    0,
  );

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
  const numero = guatemala.getDate();
  const mes = MESES_CORTOS[guatemala.getMonth()];
  const anio = String(guatemala.getFullYear()).slice(-2);
  return `${dia} ${numero}/${mes}/${anio}`;
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
      <div className="flex items-center justify-between gap-3 border-b border-sky-200/70 px-3 py-2 dark:border-sky-800/70">
        <div className="flex min-w-0 items-center gap-2">
          <FileCheck2 className="size-3.5 shrink-0" />
          <p className="truncate text-[10px] font-bold uppercase tracking-widest">
            Certificación · {formatDateShort(dte.fecha_certificacion)}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="shrink-0 text-[10px] font-black uppercase tracking-wide underline-offset-2 hover:underline cursor-pointer"
        >
          FEL: {formatFelNumero(dte.serie, dte.numero)}
        </button>
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
            <th className="w-12 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              NIT
            </th>
            <td className="px-3 py-2 font-mono font-semibold">
              {dte.id_receptor || "—"}
            </td>
          </tr>
          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
            <th className="px-3 py-2 text-[10px] font-bold uppercase opacity-70">
              UUID
            </th>
            <td
              colSpan={3}
              className="break-all px-3 py-2 font-mono text-[11px] opacity-90"
            >
              {dte.uuid_infile || "—"}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="px-3 py-2">
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

export default function DetalleCreditoModal({
  isOpen,
  onClose,
  cliente,
  ventasCliente,
}: DetalleCreditoModalProps) {
  const [abonos, setAbonos] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [whatsappVentaId, setWhatsappVentaId] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [deletingPagoId, setDeletingPagoId] = useState<string | null>(null);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [vista, setVista] = useState<VistaCuenta>("Abonos");
  const [exportandoReporte, setExportandoReporte] = useState(false);

  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canDeleteAbono = userRole === "super" || userRole === "admin";

  const { mutateAsync: procesarPago } = useProcesarPago();
  const { mutateAsync: eliminarAbono } = useEliminarAbono();

  if (!cliente) return null;

  const openReceiptModal = (ventaId: string) => {
    setSelectedVentaId(ventaId);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedVentaId(null);
  };

  const handleExportarReporte = async () => {
    if (ventasCliente.length === 0) return;

    setExportandoReporte(true);
    try {
      const rows = ventasCliente.map((venta) => {
        const deuda = Number(venta.total || 0);
        const abonosTotal = getTotalAbonos(venta);
        const saldo = venta.saldo_pendiente ?? deuda - abonosTotal;

        return {
          fecha: formatDateShort(venta.created_at || venta.fecha_entrega),
          venta: `#${getVentaLabel(venta)}`,
          comprobante: getComprobanteLabel(venta),
          deuda: `Q${formatMoney(deuda)}`,
          abonos: `Q${formatMoney(abonosTotal)}`,
          saldo: `Q${formatMoney(saldo)}`,
        };
      });

      const totales = {
        deuda: `Q${formatMoney(
          ventasCliente.reduce((sum, v) => sum + Number(v.total || 0), 0),
        )}`,
        abonos: `Q${formatMoney(
          ventasCliente.reduce((sum, v) => sum + getTotalAbonos(v), 0),
        )}`,
        saldo: `Q${formatMoney(
          ventasCliente.reduce((sum, v) => {
            const deuda = Number(v.total || 0);
            const abonosTotal = getTotalAbonos(v);
            return sum + (v.saldo_pendiente ?? deuda - abonosTotal);
          }, 0),
        )}`,
      };

      await exportReportePdf(cliente.nombre, cliente.nit, rows, totales);
      showToast("success", "Reporte PDF descargado correctamente.", "top");
    } catch (error) {
      console.error(error);
      showToast("error", "No se pudo generar el PDF del reporte.", "top");
    } finally {
      setExportandoReporte(false);
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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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
    e: React.MouseEvent,
    pago: PagoCreditoHistorial,
  ) => {
    e.stopPropagation();
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
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingPagoId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && cliente && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-9999 flex flex-col bg-background/95 backdrop-blur-md"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b bg-card shrink-0 shadow-sm gap-4">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="bg-red-500/10 p-2 md:p-3 rounded-xl text-red-500 shrink-0">
                  <CreditCard className="size-6 md:size-8" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight">
                    Detalle de Cuenta
                  </h2>
                  <div className="flex flex-col mt-0.5">
                    <p className="text-xs md:text-sm text-muted-foreground font-bold tracking-widest uppercase truncate">
                      {cliente.nombre}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground font-bold tracking-widest uppercase">
                      NIT: {cliente.nit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div
                  className="hidden sm:inline-flex rounded-xl bg-zinc-200/80 p-1 dark:bg-zinc-800"
                  role="group"
                  aria-label="Vista de cuenta"
                >
                  {VISTA_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVista(option)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                        vista === option
                          ? option === "Reportes"
                            ? "bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-950 dark:text-sky-400"
                            : "bg-white text-foreground shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors cursor-pointer"
                  disabled={processingId !== null}
                >
                  <X className="size-6" />
                </button>
              </div>
            </div>

            <div className="sm:hidden px-4 pt-3 shrink-0">
              <div
                className="inline-flex w-full rounded-xl bg-zinc-200/80 p-1 dark:bg-zinc-800"
                role="group"
                aria-label="Vista de cuenta"
              >
                {VISTA_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVista(option)}
                    className={cn(
                      "flex-1 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                      vista === option
                        ? option === "Reportes"
                          ? "bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-950 dark:text-sky-400"
                          : "bg-white text-foreground shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-7xl mx-auto w-full">
              {vista === "Reportes" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleExportarReporte}
                      disabled={
                        exportandoReporte || ventasCliente.length === 0
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-100 px-4 text-[10px] font-bold uppercase tracking-widest text-red-600 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    >
                      {exportandoReporte ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <FileDown className="size-4" />
                      )}
                      Descargar PDF
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
                  <table className="w-full text-xs md:text-sm text-left">
                    <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Venta</th>
                        <th className="px-4 py-3">Comprobante</th>
                        <th className="px-4 py-3 text-right">Deuda</th>
                        <th className="px-4 py-3 text-right">Abonado</th>
                        <th className="px-4 py-3 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {ventasCliente.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center font-bold text-zinc-500"
                          >
                            No hay ventas a crédito para este cliente.
                          </td>
                        </tr>
                      ) : (
                        ventasCliente.map((venta) => {
                          const deuda = Number(venta.total || 0);
                          const abonosTotal = getTotalAbonos(venta);
                          const saldo =
                            venta.saldo_pendiente ?? deuda - abonosTotal;
                          const dteFel = getFelCertificado(venta);
                          const comprobanteLabel = getComprobanteLabel(venta);

                          return (
                            <tr
                              key={venta.id}
                              className="transition-colors"
                            >
                              <td className="px-4 py-3 font-medium whitespace-nowrap">
                                {formatDateShort(
                                  venta.created_at || venta.fecha_entrega,
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap">
                                #{getVentaLabel(venta)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => openReceiptModal(venta.id)}
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
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {ventasCliente.length > 0 ? (
                      <tfoot className="border-t border-zinc-200 bg-zinc-50 font-black text-[10px]">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-zinc-500"
                          >
                            Totales
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm">
                            Q
                            {formatMoney(
                              ventasCliente.reduce(
                                (sum, v) => sum + Number(v.total || 0),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-emerald-600">
                            Q
                            {formatMoney(
                              ventasCliente.reduce(
                                (sum, v) => sum + getTotalAbonos(v),
                                0,
                              ),
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-sm text-red-500">
                            Q
                            {formatMoney(
                              ventasCliente.reduce((sum, v) => {
                                const deuda = Number(v.total || 0);
                                const abonosTotal = getTotalAbonos(v);
                                return (
                                  sum +
                                  (v.saldo_pendiente ?? deuda - abonosTotal)
                                );
                              }, 0),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                  </div>
                </div>
              ) : (
                ventasCliente.map((venta) => {
                  const saldoPendiente =
                    venta.saldo_pendiente ?? Number(venta.total);
                  const montoActual = abonos[venta.id] || "";
                  const isExpanded = expandedId === venta.id;
                  const dteFel = getFelCertificado(venta);

                  return (
                    <div
                      key={venta.id}
                      className={cn(
                        "bg-card border-2 rounded-2xl overflow-hidden transition-all duration-300",
                        isExpanded
                          ? "border-red-500/50 shadow-lg ring-4 ring-red-500/10"
                          : "hover:border-foreground/30",
                      )}
                    >
                      <div
                        onClick={() => toggleExpand(venta.id)}
                        className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                      >
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap justify-between items-center gap-2 w-full">
                            <p className="font-bold text-lg md:text-xl text-foreground">
                              Venta #
                              {venta.id
                                ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}`
                                : "---"}
                            </p>
                          <div className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground font-medium">
                                {formatDateShort(
                                  venta.created_at || venta.fecha_entrega,
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium mt-1">
                            Vendió: {venta.vendedor_nombre}
                          </p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              Original
                            </p>
                            <p className="font-bold text-sm text-muted-foreground">
                              Q{formatMoney(venta.total)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
                              Pendiente
                            </p>
                            <p className="font-black text-xl md:text-2xl text-foreground">
                              Q{formatMoney(saldoPendiente)}
                            </p>
                          </div>
                          <div className="text-muted-foreground hidden md:block">
                            {isExpanded ? (
                              <ChevronUp className="size-6" />
                            ) : (
                              <ChevronDown className="size-6" />
                            )}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t-2 bg-muted/10 overflow-hidden"
                          >
                            <div className="p-5 md:p-8 flex flex-col lg:flex-row gap-8">
                              <div className="flex-1 space-y-5">
                                {dteFel ? (
                                  <FelInfoPanel
                                    dte={dteFel}
                                    totalVenta={Number(venta.total)}
                                    clienteNombre={cliente.nombre}
                                    onOpen={() => openReceiptModal(venta.id)}
                                  />
                                ) : null}

                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                    <History className="size-5" />
                                    Historial de Pagos
                                  </div>
                                  {venta.ven_pagos &&
                                    venta.ven_pagos.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
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
                                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-2"
                                      >
                                        <MessageCircle className="size-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">
                                          Enviar Abonos
                                        </span>
                                      </button>
                                    )}
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
                                        className="flex-1 bg-muted/50 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (whatsappPhone) {
                                            const formatParts = (
                                              dStr?: string,
                                            ) => {
                                              if (!dStr)
                                                return { d: "N/A", t: "" };
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
                                            const fV = formatParts(
                                              venta.created_at,
                                            );
                                            const totV = formatMoney(
                                              venta.total,
                                            );
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
                                              const monA = formatMoney(
                                                pago.monto,
                                              );
                                              texto += `*${fP.d}, ${fP.t}*\n\`\`\`Abono #${idA}: Q${monA}\`\`\`\n\n`;
                                            });

                                            texto += `🧾 *Saldo: Q${salV}*\n\n\n*La Arada*\n*_¡Gracias por sus pagos!_*`;

                                            const url = `https://api.whatsapp.com/send?phone=502${whatsappPhone.replace(/\s+/g, "")}&text=${encodeURIComponent(texto)}`;
                                            window.open(url, "_blank");
                                            setWhatsappVentaId(null);
                                          }
                                        }}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600"
                                      >
                                        Enviar
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {venta.ven_pagos &&
                                venta.ven_pagos.length > 0 ? (
                                  <div className="space-y-3">
                                    {venta.ven_pagos.map((pago, idx) => (
                                      <div
                                        key={pago.id || idx}
                                        className="flex flex-col text-sm bg-background border-2 border-border/50 p-4 rounded-xl shadow-sm hover:border-emerald-500/30"
                                      >
                                        <div className="flex justify-between items-start w-full mb-1">
                                          <span className="font-bold text-foreground text-base">
                                            Abono: #
                                            {pago.id
                                              ? `${pago.id.substring(0, 3).toUpperCase()}-${pago.id.substring(3, 6).toUpperCase()}`
                                              : "---"}
                                          </span>
                                          <span className="text-xs text-muted-foreground font-medium text-right mt-1">
                                            {pago.created_at
                                              ? new Date(
                                                  pago.created_at,
                                                ).toLocaleString("es-GT")
                                              : "N/A"}
                                          </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground font-medium w-full pb-3">
                                          Cobró:{" "}
                                          {pago.cajero_nombre || "Desconocido"}
                                        </span>
                                        <div className="grid grid-cols-2 items-center w-full pt-3 border-t border-border/50">
                                          <span className="font-black text-emerald-600 text-lg">
                                            + Q{formatMoney(pago.monto)}
                                          </span>
                                          <div className="flex justify-end gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                imprimirRecibo(pago, venta);
                                              }}
                                              className="p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-all cursor-pointer"
                                            >
                                              <Printer className="size-5" />
                                            </button>
                                            {canDeleteAbono && pago.id && (
                                              <button
                                                onClick={(e) =>
                                                  handleEliminarAbono(e, pago)
                                                }
                                                disabled={
                                                  deletingPagoId === pago.id ||
                                                  processingId !== null
                                                }
                                                className="p-2.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                                title="Eliminar abono"
                                              >
                                                {deletingPagoId === pago.id ? (
                                                  <Loader2 className="size-5 animate-spin" />
                                                ) : (
                                                  <Trash2 className="size-5" />
                                                )}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground text-sm font-bold uppercase opacity-60">
                                    No hay abonos registrados.
                                  </div>
                                )}
                              </div>
                              {saldoPendiente > 0 && (
                                <div className="w-full lg:w-96 shrink-0">
                                  <div className="bg-background border-2 border-border/60 rounded-3xl p-5 shadow-md flex flex-col gap-3">
                                    <label className="text-sm font-black text-foreground uppercase block text-center">
                                      Ingresar Abono
                                    </label>
                                    <div className="flex items-center gap-3 bg-muted/30 border-2 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-red-500/20">
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        max={saldoPendiente}
                                        step="0.01"
                                        value={montoActual}
                                        onKeyDown={(e) => {
                                          if (
                                            e.key === "-" ||
                                            e.key === "e" ||
                                            e.key === "E" ||
                                            e.key === "+"
                                          )
                                            e.preventDefault();
                                          if (
                                            e.key === "Enter" &&
                                            (abonos[venta.id] ?? 0) > 0 &&
                                            processingId !== venta.id
                                          ) {
                                            e.preventDefault();
                                            handlePagarVenta(
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
                                        placeholder="0.00"
                                        className="w-full bg-transparent outline-none font-black text-4xl text-center"
                                      />
                                    </div>
                                    <AnimatePresence>
                                      {(abonos[venta.id] ?? 0) > 0 && (
                                        <motion.button
                                          initial={{ opacity: 0, y: -6 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -6 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePagarVenta(
                                              venta.id,
                                              abonos[venta.id],
                                            );
                                          }}
                                          disabled={processingId === venta.id}
                                          className="w-full py-3 rounded-2xl bg-red-500 text-white font-black hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 text-sm uppercase tracking-wide"
                                        >
                                          {processingId === venta.id ? (
                                            <Loader2 className="size-4 animate-spin" />
                                          ) : (
                                            <>Registrar Abono</>
                                          )}
                                        </motion.button>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        ventaId={selectedVentaId}
        isReadonly
      />
    </>
  );
}
