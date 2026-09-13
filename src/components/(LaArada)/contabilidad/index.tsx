"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Search,
  FileSpreadsheet,
  Ban,
  Calculator,
  FileText,
  Eye,
  ScrollText,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVentas } from "@/components/(LaArada)/ventas/lib/hooks";
import ReceiptModal from "@/components/(LaArada)/ventas/modals/receipt-modal";
import { ContabilidadSkeleton } from "./contabilidad-skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  readLaAradaSimulatedRole,
  writeLaAradaSimulatedRole,
  canUsePreventasSimular,
} from "@/components/(LaArada)/lib/simulated-role";
import TablePagination, { PageSizeOption } from "@/components/(LaArada)/lib/pagination";

function getFileName(ext: string) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `laarada-${month}-${year}.${ext}`;
}

// Roles that see EVERYTHING (all ventas)
const FULL_ACCESS_ROLES = ["super", "admin"];
// Roles that only see FEL-certified ventas (+ anuladas with FEL anulado)
const FEL_ONLY_ROLES = ["contador", "tec-admin"];

export default function ContabilidadView() {
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole: string = metadata.rol || user?.role || "user";

  // Role simulator — only available to super
  const [effectiveRole, setEffectiveRole] = useState(() =>
    readLaAradaSimulatedRole(realRole)
  );
  useEffect(() => {
    setEffectiveRole(readLaAradaSimulatedRole(realRole));
    const syncRole = (e?: any) => {
      const newRole = e?.detail || readLaAradaSimulatedRole(realRole);
      setEffectiveRole(newRole);
    };
    window.addEventListener("laarada-simulated-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    window.addEventListener("focus", syncRole);
    return () => {
      window.removeEventListener("laarada-simulated-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("focus", syncRole);
    };
  }, [realRole]);

  const isSuper = canUsePreventasSimular(realRole, effectiveRole);

  const { data: ventas = [], isLoading } = useVentas();

  const now = new Date();
  const defaultMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [monthYear, setMonthYear] = useState(defaultMonthYear);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoComprobante, setTipoComprobante] = useState<"TODO" | "FEL" | "RECIBO">("TODO");

  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [pageSize, setPageSize] = useState<PageSizeOption>(15);
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Role-based filtering ────────────────────────────────────────────────────
  const isFelOnly = FEL_ONLY_ROLES.includes(effectiveRole);
  const hasFullAccess = FULL_ACCESS_ROLES.includes(effectiveRole);

  const roleFilteredVentas = useMemo(() => {
    if (hasFullAccess) return ventas;

    // contador / tec-admin: only FEL-certified deliveries + FEL-cancelled
    return (ventas as any[]).filter((v) => {
      const estado = String(v.estado || "").trim().toLowerCase();
      const dteDocs = v.dte_documentos || [];
      const hasCertificado = dteDocs.some((d: any) => d.estado === "certificado");
      const hasAnuladoDte = dteDocs.some((d: any) => d.estado === "anulado");

      if (estado === "entregado") return hasCertificado;
      if (estado === "anulado") return hasAnuladoDte;
      return false; // pendientes hidden
    });
  }, [ventas, hasFullAccess]);

  const orders = useMemo(() => {
    return [...roleFilteredVentas].sort(
      (a: any, b: any) =>
        new Date(b.fecha_entrega || 0).getTime() -
        new Date(a.fecha_entrega || 0).getTime(),
    );
  }, [roleFilteredVentas]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const timestamp = order.created_at;
      if (!timestamp) return false;

      const localDateObj = new Date(timestamp);
      const localYearMonth = localDateObj
        .toLocaleDateString("en-CA", { timeZone: "America/Guatemala" })
        .substring(0, 7);
      const localFullDate = localDateObj.toLocaleDateString("en-CA", {
        timeZone: "America/Guatemala",
      });

      let matchDate = true;
      if (startDate || endDate) {
        const matchStart = startDate ? localFullDate >= startDate : true;
        const matchEnd = endDate ? localFullDate <= endDate : true;
        matchDate = matchStart && matchEnd;
      } else if (monthYear) {
        matchDate = localYearMonth === monthYear;
      }

      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        (order.ven_clientes?.nombre || "").toLowerCase().includes(term) ||
        (order.ven_clientes?.nit || "").toLowerCase().includes(term) ||
        String(order.numero_recibo || "").includes(term) ||
        String(order.id || "").toLowerCase().includes(term);

      let matchTipo = true;
      if (hasFullAccess && tipoComprobante !== "TODO") {
        const hasCertificado = (order.dte_documentos || []).some(
          (d: any) => d.estado === "certificado",
        );
        if (tipoComprobante === "FEL") {
          matchTipo = hasCertificado;
        } else if (tipoComprobante === "RECIBO") {
          matchTipo = !hasCertificado;
        }
      }

      return matchDate && matchSearch && matchTipo;
    });
  }, [orders, startDate, endDate, monthYear, searchTerm, tipoComprobante, hasFullAccess]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(filteredOrders.length / (Number(pageSize) || 15)));
  }, [filteredOrders.length, pageSize]);

  const paginatedOrders = useMemo(() => {
    if (pageSize === "all") return filteredOrders;
    const size = Number(pageSize) || 15;
    const start = (currentPage - 1) * size;
    return filteredOrders.slice(start, start + size);
  }, [filteredOrders, currentPage, pageSize]);

  const stats = useMemo(() => {
    let totalEntregado = 0;
    let baseImponible = 0;
    let iva = 0;
    let countAnulados = 0;
    let totalAnulados = 0;

    filteredOrders.forEach((o: any) => {
      const total = Number(o.total || 0);
      const estado = String(o.estado || "Pendiente").trim().toLowerCase();
      const dteCertificado = (o.dte_documentos || []).find(
        (d: any) => d.estado === "certificado",
      );

      if (estado === "entregado") {
        totalEntregado += total;
        if (dteCertificado) {
          const base = total / 1.12;
          baseImponible += base;
          iva += total - base;
        }
      } else if (estado === "anulado") {
        countAnulados++;
        totalAnulados += total;
      }
    });

    return { totalEntregado, baseImponible, iva, countAnulados, totalAnulados };
  }, [filteredOrders]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const formatter = new Intl.DateTimeFormat("es-GT", {
      timeZone: "America/Guatemala",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(timestamp));
    const find = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const cap = (s: string) =>
      s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
    return `${cap(find("weekday"))} ${find("day")}/${cap(find("month"))}/${find("year")}, ${find("hour")}:${find("minute")}`;
  };

  const formatMoney = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (isNaN(num)) return "0.00";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const buildRows = () =>
    filteredOrders.map((o: any, index: number) => {
      const date = formatDate(o.created_at);
      const dteCertificado = (o.dte_documentos || []).find(
        (d: any) => d.estado === "certificado",
      );
      const isFactura = !!dteCertificado;
      const totalNum = Number(o.total || 0);
      return {
        "No.": index + 1,
        Fecha: date,
        Cliente: o.ven_clientes?.nombre || "",
        "No. Venta": `#${o.id?.substring(0, 3).toUpperCase()}-${o.id?.substring(3, 6).toUpperCase()}`,
        Comprobante: isFactura ? "FEL" : "Recibo",
        Estado: o.estado || "Pendiente",
        "Venta (Q)": isFactura
          ? formatMoney(totalNum / 1.12)
          : formatMoney(totalNum),
        "IVA (Q)": isFactura
          ? formatMoney(totalNum - totalNum / 1.12)
          : "---",
        "Total (Q)": formatMoney(totalNum),
      };
    });

  const exportCSV = () => {
    const headers = [
      "Fecha","Cliente","No. Venta","Tipo","Estado","Venta (Q)","IVA (Q)","Total (Q)",
    ];
    const rows = buildRows().map((r) =>
      headers.map((h) => `"${r[h as keyof typeof r]}"`).join(","),
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = getFileName("csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportExcel = () => {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contabilidad");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName("xlsx");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`La Arada – Reporte Contable ${month}/${year}`, 14, 15);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total Facturado: Q${formatMoney(stats.totalEntregado)}   Base Imponible: Q${formatMoney(stats.baseImponible)}   IVA (12%): Q${formatMoney(stats.iva)}   Anulados: Q${formatMoney(stats.totalAnulados)}`,
      14, 22,
    );
    autoTable(doc, {
      startY: 28,
      head: [["No.","Fecha","No. Venta","Cliente","Comprobante","Estado","Venta (Q)","IVA (Q)","Total (Q)"]],
      body: filteredOrders.map((o: any, index: number) => {
        const formattedDate = formatDate(o.created_at);
        const dteCertificado = (o.dte_documentos || []).find(
          (d: any) => d.estado === "certificado",
        );
        const isFactura = !!dteCertificado;
        const totalNum = Number(o.total || 0);
        return [
          index + 1,
          formattedDate,
          `#${o.id?.substring(0, 3).toUpperCase()}-${o.id?.substring(3, 6).toUpperCase()}`,
          o.ven_clientes?.nombre || "",
          isFactura ? "FEL" : "Recibo",
          o.estado || "Pendiente",
          `Q${isFactura ? formatMoney(totalNum / 1.12) : formatMoney(totalNum)}`,
          isFactura ? `Q${formatMoney(totalNum - totalNum / 1.12)}` : "---",
          `Q${formatMoney(totalNum)}`,
        ];
      }),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = getFileName("pdf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  };

  if (isLoading) {
    return <ContabilidadSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 w-full lg:max-w-[95%] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href="/cermadsa/laarada"
            className="group inline-flex shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer w-fit mb-0.5"
          >
            <ArrowLeft className="size-4.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Volver
            </span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Calculator className="size-5 md:size-6 text-emerald-500" />
            Módulo Contable
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2 mt-0.5">
            Exportación y cálculo de impuestos (IVA/ISR).
            {isFelOnly && (
              <span className="text-[10px] bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded border border-sky-500/20 whitespace-nowrap">
                Solo FEL / DTE
              </span>
            )}
            {realRole === "super" && effectiveRole !== "super" && (
              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                Simulando: {effectiveRole}
              </span>
            )}
          </p>
        </div>

        {/* Role simulator — super only */}
        {isSuper && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 px-3 py-1.5 rounded-lg shadow-sm h-10 w-full sm:w-auto justify-center">
            <ShieldAlert className="size-4 text-yellow-600 shrink-0" />
            <span className="text-[10px] font-bold text-yellow-600 uppercase hidden sm:inline whitespace-nowrap">
              Simular Rol:
            </span>
            <select
              value={effectiveRole}
              onChange={(e) => {
                const role = e.target.value;
                setEffectiveRole(role);
                writeLaAradaSimulatedRole(role);
              }}
              className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer"
            >
              <option value="super">SUPER (Real)</option>
              <option value="admin">Admin</option>
              <option value="contador">Contador</option>
              <option value="tec-admin">Tec-Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Facturado (Entregados)"
          value={`Q${formatMoney(stats.totalEntregado)}`}
          icon={<FileSpreadsheet className="size-4 text-blue-500" />}
        />
        <StatCard
          label="Base Imponible"
          value={`Q${formatMoney(stats.baseImponible)}`}
          icon={<Calculator className="size-4 text-emerald-500" />}
        />
        <StatCard
          label="IVA Débito (12%)"
          value={`Q${formatMoney(stats.iva)}`}
          icon={<Calculator className="size-4 text-orange-500" />}
        />
        <StatCard
          label={`Anulados (${stats.countAnulados})`}
          value={`Q${formatMoney(stats.totalAnulados)}`}
          icon={<Ban className="size-4 text-red-500" />}
          isAlert
        />
      </div>

      {/* Table Shell with Integrated Filters and Search */}
      <div className="space-y-2">
        <p className="text-sm font-bold">
          <span className="text-foreground">Total: </span>
          <span className="text-zinc-600 dark:text-zinc-300">
            {filteredOrders.length}
          </span>
        </p>

        <div className="overflow-hidden rounded-t-2xl border border-zinc-200 border-t-4 border-t-emerald-600 bg-white shadow-sm dark:border-zinc-700 dark:border-t-emerald-500 dark:bg-zinc-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por cliente o No. Venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => {
                    setMonthYear(e.target.value);
                    if (e.target.value) {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
                  className="h-11 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs md:text-sm font-bold outline-none"
                />

                {hasFullAccess && (
                  <select
                    value={tipoComprobante}
                    onChange={(e) => setTipoComprobante(e.target.value as any)}
                    className="h-11 px-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-xs md:text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="TODO">Todo</option>
                    <option value="FEL">FEL</option>
                    <option value="RECIBO">Recibo</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={exportCSV}
                disabled={filteredOrders.length === 0}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-zinc-100 px-3 text-xs font-bold uppercase text-zinc-700 transition-colors hover:bg-zinc-200 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                <Download className="size-4" /> CSV
              </button>
              <button
                onClick={exportExcel}
                disabled={filteredOrders.length === 0}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-100 px-4 text-xs font-bold uppercase text-emerald-700 transition-colors hover:bg-emerald-200 cursor-pointer dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900 disabled:opacity-50"
              >
                <FileSpreadsheet className="size-4" /> EXCEL
              </button>
              <button
                onClick={exportPDF}
                disabled={filteredOrders.length === 0}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-500 bg-red-100 px-4 text-xs font-bold uppercase text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:border-red-400 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 disabled:opacity-50"
              >
                <FileText className="size-4" /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr className="text-[10px] md:text-xs uppercase font-black tracking-wider">
                  <th className="p-3 md:p-4 w-12 text-center">No.</th>
                  <th className="p-3 md:p-4">Fecha</th>
                  <th className="p-3 md:p-4">No. Venta</th>
                  <th className="p-3 md:p-4">Cliente</th>
                  <th className="p-3 md:p-4 text-center">Estado</th>
                  <th className="p-3 md:p-4 text-right">Venta</th>
                  <th className="p-3 md:p-4 text-right">IVA</th>
                  <th className="p-3 md:p-4 text-right">Total</th>
                  <th className="p-3 md:p-4 text-center">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-muted-foreground font-bold uppercase text-xs"
                    >
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order: any, idx: number) => {
                    const sizeNum =
                      pageSize === "all"
                        ? filteredOrders.length
                        : Number(pageSize) || 15;
                    const sequenceNumber =
                      (currentPage - 1) * sizeNum + idx + 1;
                    const dteCertificado = (order.dte_documentos || []).find(
                      (d: any) => d.estado === "certificado",
                    );
                    const isFactura = !!dteCertificado;
                    const isAnulado =
                      String(order.estado || "").toLowerCase() === "anulado";
                    const total = Number(order.total || 0);

                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                      >
                        <td className="p-3 md:p-4 text-center font-bold text-muted-foreground text-xs">
                          {sequenceNumber}
                        </td>
                        <td className="p-3 md:p-4 font-bold whitespace-nowrap text-xs">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="p-3 md:p-4 font-mono font-bold text-orange-500 whitespace-nowrap text-xs">
                          #{order.id?.substring(0, 3).toUpperCase()}-
                          {order.id?.substring(3, 6).toUpperCase()}
                        </td>
                        <td className="p-3 md:p-4 font-bold text-xs">
                          {order.ven_clientes?.nombre}
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-flex",
                              String(order.estado).toLowerCase() === "entregado"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : String(order.estado).toLowerCase() === "anulado"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            )}
                          >
                            {order.estado || "Pendiente"}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-right font-mono text-gray-600 dark:text-gray-300 text-xs">
                          Q{isFactura ? formatMoney(total / 1.12) : formatMoney(total)}
                        </td>
                        <td className="p-3 md:p-4 text-right font-mono text-gray-500 dark:text-gray-400 text-[10px]">
                          {isFactura ? `Q${formatMoney(total - total / 1.12)}` : "---"}
                        </td>
                        <td className="p-3 md:p-4 text-right font-black text-xs">
                          Q{formatMoney(total)}
                        </td>
                        <td className="p-3 md:p-4 text-center">
                          {isAnulado ? (
                            <span className="w-20 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 font-bold text-[10px] uppercase border border-red-100 cursor-not-allowed dark:bg-red-950 dark:text-red-400 dark:border-red-900">
                              <Ban className="size-3 shrink-0" />
                              <span>Anulado</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedVentaId(order.id);
                                setIsReceiptModalOpen(true);
                              }}
                              className={cn(
                                "w-20 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md transition-colors font-bold text-[10px] uppercase cursor-pointer",
                                isFactura
                                  ? "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                              )}
                            >
                              <Eye className="size-3 shrink-0" />
                              <span>{isFactura ? "FEL" : "Recibo"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedVentaId(null);
        }}
        ventaId={selectedVentaId}
        isReadonly={true}
      />
    </div>
  );
}

function StatCard({ label, value, icon, isAlert }: any) {
  return (
    <div
      className={cn(
        "bg-card border p-4 rounded-xl flex flex-col gap-2 shadow-sm",
        isAlert && "border-red-500/30 bg-red-500/5",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
        {icon} {label}
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-black tracking-tighter truncate",
          isAlert && "text-red-500",
        )}
      >
        {value}
      </div>
    </div>
  );
}
