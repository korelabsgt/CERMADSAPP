"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  Calendar,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientSales } from "../lib/hooks";
import ReceiptModal from "@/components/(LaArada)/ventas/modals/receipt-modal";

type FiltroComprobante = "Todas" | "Recibo" | "FEL";

const felToneClass =
  "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 border border-sky-200 dark:border-sky-800";

const FILTRO_COMPROBANTE_OPTIONS: FiltroComprobante[] = [
  "Todas",
  "Recibo",
  "FEL",
];

type DteDocumento = {
  estado: string;
  serie?: string | null;
  numero?: number | string | null;
  uuid_infile?: string | null;
};

type ClientSale = {
  id: string;
  created_at?: string | null;
  fecha_entrega?: string | null;
  estado?: string | null;
  tipo_venta?: string | null;
  tipo_comprobante?: string | null;
  metodo_pago?: string | null;
  numero_recibo?: number | string | null;
  total?: number | string | null;
  dte_documentos?: DteDocumento[] | null;
};

const saleHasFel = (sale: ClientSale) =>
  (sale.dte_documentos ?? []).some((doc) => doc.estado === "certificado");

const getFelCertificado = (sale: ClientSale) =>
  (sale.dte_documentos ?? []).find((doc) => doc.estado === "certificado");

const getDteDisplay = (sale: ClientSale) => {
  const docs = sale.dte_documentos ?? [];
  return (
    docs.find((doc) => doc.estado === "certificado") ??
    docs.find((doc) => doc.estado === "anulado") ??
    docs[docs.length - 1]
  );
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

const formatDate = (value?: string | null) => {
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

const getVentaLabel = (sale: ClientSale) =>
  sale.numero_recibo
    ? String(sale.numero_recibo).padStart(5, "0")
    : sale.id.slice(0, 6).toUpperCase();

const getComprobanteLabel = (sale: ClientSale) => {
  const dte = getFelCertificado(sale) ?? getDteDisplay(sale);
  if (dte && (saleHasFel(sale) || dte.estado === "anulado")) {
    return `FEL: ${formatFelNumero(dte.serie, dte.numero)}`;
  }
  return `Recibo: #${getVentaLabel(sale)}`;
};

const getPagoLabel = (sale: ClientSale) => {
  if (sale.tipo_venta === "Crédito") return "Crédito";
  return sale.metodo_pago || "—";
};

const getGuatemalaDateParts = (dateInput?: string | Date) => {
  if (!dateInput || dateInput === "Sin Fecha")
    return getGuatemalaDateParts(new Date());

  let date = new Date(dateInput);
  if (typeof dateInput === "string" && dateInput.length === 10) {
    date = new Date(`${dateInput}T12:00:00`);
  }

  if (isNaN(date.getTime())) return getGuatemalaDateParts(new Date());

  const guatemalaTime = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const year = guatemalaTime.getFullYear();
  const month = guatemalaTime.getMonth() + 1;
  const day = guatemalaTime.getDate();

  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const week = Math.ceil((day + firstDayIso) / 7);

  return { year, month, week };
};

const getOrderDateString = (order: ClientSale) => {
  if (order.fecha_entrega) return String(order.fecha_entrega).substring(0, 10);
  if (order.created_at) return String(order.created_at).substring(0, 10);
  return "Sin Fecha";
};

const getWeeksLabels = (year: number, month: number) => {
  const labels = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysStr = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  let startDay = 1;
  while (startDay <= lastDay) {
    const weekNum = Math.ceil((startDay + firstDayIso) / 7);
    let endDay = startDay;
    while ((endDay + firstDayIso) % 7 !== 0 && endDay < lastDay) {
      endDay++;
    }
    const startJS = new Date(year, month - 1, startDay).getDay();
    const endJS = new Date(year, month - 1, endDay).getDay();
    labels.push({
      week: weekNum,
      label: `${daysStr[startJS === 0 ? 6 : startJS - 1]} ${startDay} - ${daysStr[endJS === 0 ? 6 : endJS - 1]} ${endDay}`,
    });
    startDay = endDay + 1;
  }
  return labels;
};

interface ClientSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: { id: string; nombre: string; nit: string };
}

export default function ClientSalesModal({
  isOpen,
  onClose,
  client,
}: ClientSalesModalProps) {
  if (!isOpen || !client) return null;

  return <ClientSalesModalContent client={client} onClose={onClose} />;
}

function ClientSalesModalContent({
  client,
  onClose,
}: {
  client: { id: string; nombre: string; nit: string };
  onClose: () => void;
}) {
  const { data: sales = [], isLoading } = useClientSales(client.id);

  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">("Todas");
  const [filtroComprobante, setFiltroComprobante] =
    useState<FiltroComprobante>("Todas");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const resetPage = () => setCurrentPage(1);

  const openReceiptModal = (ventaId: string) => {
    setSelectedVentaId(ventaId);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setSelectedVentaId(null);
  };

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const filteredSales = useMemo(() => {
    return (sales as ClientSale[]).filter((sale) => {
      const orderDate = getGuatemalaDateParts(getOrderDateString(sale));

      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      const searchLower = searchTerm.toLowerCase();
      const dte = getDteDisplay(sale);
      const matchSearch =
        sale.id.toLowerCase().includes(searchLower) ||
        (sale.numero_recibo &&
          String(sale.numero_recibo).includes(searchLower)) ||
        (sale.estado && sale.estado.toLowerCase().includes(searchLower)) ||
        (dte?.uuid_infile &&
          dte.uuid_infile.toLowerCase().includes(searchLower)) ||
        (dte?.serie && dte.serie.toLowerCase().includes(searchLower));

      const hasFel = saleHasFel(sale);
      const matchComprobante =
        filtroComprobante === "Todas" ||
        (filtroComprobante === "FEL" && hasFel) ||
        (filtroComprobante === "Recibo" && !hasFel);

      return matchAnio && matchMes && matchSemana && matchSearch && matchComprobante;
    });
  }, [sales, filtroAnio, filtroMes, filtroSemana, filtroComprobante, searchTerm]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(filteredSales.length / pageSize));
  }, [filteredSales.length, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    if (pageSize === "all") return filteredSales;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, pageSize, safeCurrentPage]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background">
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b bg-muted/20 shrink-0">
          <div>
            <h2 className="text-xl md:text-3xl font-black flex items-center gap-3 uppercase text-primary">
              <ShoppingCart className="size-6 md:size-8" />
              Historial de Ventas
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-bold uppercase mt-1">
              Cliente: <span className="text-foreground">{client.nombre}</span>{" "}
              | NIT: {client.nit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-muted hover:bg-muted/80 rounded-full transition-colors cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 bg-muted/10 border-b space-y-4 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 md:col-span-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por recibo, estado o UUID..."
                className="bg-transparent font-bold outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  resetPage();
                }}
              />
            </div>

            <select
              value={filtroAnio}
              onChange={(e) => {
                setFiltroAnio(Number(e.target.value));
                resetPage();
              }}
              className="bg-background border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 cursor-pointer"
            >
              {[2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={filtroMes}
              onChange={(e) => {
                setFiltroMes(Number(e.target.value));
                setFiltroSemana("Todas");
                resetPage();
              }}
              className="bg-background border rounded-lg px-3 py-2 text-sm font-bold capitalize outline-none focus:ring-2 cursor-pointer"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("es-GT", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              value={filtroSemana}
              onChange={(e) => {
                setFiltroSemana(
                  e.target.value === "Todas" ? "Todas" : Number(e.target.value),
                );
                resetPage();
              }}
              className="bg-background border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 cursor-pointer"
            >
              <option value="Todas">Todas las Semanas</option>
              {semanasDelMes.map((s) => (
                <option key={s.week} value={s.week}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Comprobante
            </span>
            <div
              className="inline-flex w-full sm:w-auto rounded-xl bg-zinc-200/80 p-1 dark:bg-zinc-800"
              role="group"
              aria-label="Filtrar por tipo de comprobante"
            >
              {FILTRO_COMPROBANTE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setFiltroComprobante(option);
                    resetPage();
                  }}
                  className={cn(
                    "flex-1 sm:flex-none sm:min-w-22 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                    filtroComprobante === option
                      ? option === "FEL"
                        ? cn(felToneClass, "shadow-sm")
                        : option === "Recibo"
                          ? "bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-950 dark:text-amber-400"
                          : "bg-white text-foreground shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full font-bold text-muted-foreground">
              Cargando historial...
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-card p-8 text-center font-bold text-muted-foreground">
              No se encontraron ventas para estos filtros.
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Venta</th>
                    <th className="px-4 py-3">Comprobante</th>
                    <th className="px-4 py-3">Pago</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {currentItems.map((sale) => {
                    const estadoNormal = String(sale.estado || "Pendiente")
                      .trim()
                      .toLowerCase();
                    const dte = getFelCertificado(sale) ?? getDteDisplay(sale);
                    const isFactura = !!(
                      dte && (saleHasFel(sale) || dte.estado === "anulado")
                    );
                    const comprobanteLabel = getComprobanteLabel(sale);

                    return (
                      <tr
                        key={sale.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2 uppercase">
                            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                            {formatDate(sale.fecha_entrega || sale.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap">
                          #{getVentaLabel(sale)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openReceiptModal(sale.id)}
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase transition-opacity hover:opacity-80 cursor-pointer whitespace-nowrap",
                              isFactura
                                ? felToneClass
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                            )}
                            title={comprobanteLabel}
                          >
                            {comprobanteLabel}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-bold uppercase text-muted-foreground">
                          {getPagoLabel(sale)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                              estadoNormal === "pendiente"
                                ? "bg-amber-500/10 text-amber-600"
                                : estadoNormal === "entregado"
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-red-500/10 text-red-600",
                            )}
                          >
                            {sale.estado || "Pendiente"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black tabular-nums whitespace-nowrap">
                          Q{formatMoney(sale.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                );
                resetPage();
              }}
              className="bg-muted/30 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="all">Todos</option>
            </select>
            <span className="text-sm font-bold text-muted-foreground uppercase">
              Total: {filteredSales.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={pageSize === "all" || safeCurrentPage === 1}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold px-4 uppercase text-muted-foreground">
              {pageSize === "all" ? "Todos" : `${safeCurrentPage} / ${totalPages}`}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={
                pageSize === "all" ||
                safeCurrentPage === totalPages ||
                totalPages === 0
              }
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={closeReceiptModal}
        ventaId={selectedVentaId}
        isReadonly
      />
    </div>
  );
}
