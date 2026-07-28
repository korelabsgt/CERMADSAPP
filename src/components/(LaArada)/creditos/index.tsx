"use client";

import { useState, useMemo } from "react";
import {
  Search,
  CreditCard,
  Loader2,
  Receipt,
  X,
  Printer,
  CalendarDays,
  ShoppingBag,
  User,
  UserCheck,
  Trash2,
  FileCheck2,
} from "lucide-react";
import { useCreditos, useEliminarAbono } from "./lib/hooks";
import {
  ClienteCredito,
  DetalleVentaCredito,
  PagoCreditoHistorial,
  VentaCredito,
} from "./lib/zod";
import CreditosList from "./components/creditos-list";
import DetalleCreditoModal from "./modals/detalle-credito-modal";
import ReciboAbonoPrint from "./components/recibo-abono-print";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { showConfirm } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type PagoEncontrado = {
  pago: PagoCreditoHistorial;
  venta: VentaCredito;
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

const getFelCertificado = (venta: VentaCredito) =>
  (venta.dte_documentos ?? []).find((doc) => doc.estado === "certificado");

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

const felToneClass =
  "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 border border-sky-200 dark:border-sky-800";

export default function Creditos() {
  const { clientesConCredito, creditosTotales, isLoading } = useCreditos();
  const { mutateAsync: eliminarAbono, isPending: isDeletingAbono } =
    useEliminarAbono();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canDeleteAbono = userRole === "super" || userRole === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteCredito | null>(
    null,
  );

  const pagoEncontrado: PagoEncontrado | null = (() => {
    if (searchTerm.length < 3) return null;

    const term = searchTerm.toLowerCase();
    for (const venta of creditosTotales as VentaCredito[]) {
      const pago = venta.ven_pagos?.find((p) =>
        p.id?.toLowerCase().startsWith(term),
      );
      if (pago) return { pago, venta };
    }
    return null;
  })();

  const filtrados = useMemo(() => {
    if (pagoEncontrado) return [];
    return clientesConCredito.filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nit.includes(searchTerm),
    );
  }, [searchTerm, clientesConCredito, pagoEncontrado]);

  const deudaGlobal = clientesConCredito.reduce(
    (sum, c) => sum + c.totalDeuda,
    0,
  );

  const ventasDelCliente = useMemo(() => {
    if (!selectedCliente) return [];
    return (creditosTotales as VentaCredito[]).filter(
      (v) => v.cliente_id === selectedCliente.cliente_id,
    );
  }, [selectedCliente, creditosTotales]);

  const handleEliminarAbonoBuscado = async () => {
    if (!pagoEncontrado?.pago?.id) return;

    const result = await showConfirm({
      title: "¿Eliminar abono?",
      html: `Se eliminará el abono de <strong>Q${formatMoney(pagoEncontrado.pago.monto)}</strong>.`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    await eliminarAbono(pagoEncontrado.pago.id);
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="size-8 animate-spin text-red-500" />
        <p className="font-bold uppercase tracking-widest text-sm">
          Cargando créditos...
        </p>
      </div>
    );
  }

  const dteFel = pagoEncontrado
    ? getFelCertificado(pagoEncontrado.venta)
    : undefined;

  return (
    <div className="p-4 md:p-6 w-full mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-4xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 bg-red-500/10 text-red-500 rounded-xl md:rounded-2xl">
            <CreditCard className="size-6 md:size-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              Cuentas por Cobrar
            </h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">
              Deuda Total:{" "}
              <span className="text-foreground">
                Q{formatMoney(deudaGlobal)}
              </span>
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente, NIT o pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 border rounded-xl bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
      </div>

      {pagoEncontrado ? (
        <div className="bg-card border-2 border-emerald-500/50 rounded-3xl p-8 animate-in zoom-in duration-300 shadow-2xl shadow-emerald-500/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <Receipt className="size-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase">
                  Pago Localizado
                </h2>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Comprobante: #
                  {pagoEncontrado.pago.id.slice(0, 6).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSearchTerm("")}
              className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border">
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                    Cliente
                  </p>
                  <p className="font-bold text-lg uppercase">
                    {pagoEncontrado.venta.ven_clientes?.nombre}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">
                    Monto del Abono
                  </p>
                  <p className="font-black text-3xl text-foreground">
                    Q{formatMoney(pagoEncontrado.pago.monto)}
                  </p>
                </div>
              </div>

              {dteFel ? (
                (() => {
                  const felTotal = Number(
                    dteFel.gran_total ?? pagoEncontrado.venta.total,
                  );
                  const felBase = felTotal / 1.12;
                  const felIva = felTotal - felBase;

                  return (
                    <div className={cn("overflow-hidden rounded-xl", felToneClass)}>
                      <div className="flex items-center justify-between gap-3 border-b border-sky-200/70 px-3 py-2 dark:border-sky-800/70">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileCheck2 className="size-3.5 shrink-0" />
                          <p className="truncate text-[10px] font-bold uppercase tracking-widest">
                            Certificación ·{" "}
                            {formatDateShort(dteFel.fecha_certificacion)}
                          </p>
                        </div>
                        <p className="shrink-0 text-[10px] font-black uppercase">
                          FEL: {formatFelNumero(dteFel.serie, dteFel.numero)}
                        </p>
                      </div>
                      <table className="w-full text-left text-xs">
                        <tbody>
                          <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
                            <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                              Receptor
                            </th>
                            <td className="px-3 py-2 font-semibold">
                              {dteFel.nombre_receptor ||
                                pagoEncontrado.venta.ven_clientes?.nombre ||
                                "—"}
                            </td>
                            <th className="w-12 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                              NIT
                            </th>
                            <td className="px-3 py-2 font-mono font-semibold">
                              {dteFel.id_receptor || "—"}
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
                              {dteFel.uuid_infile || "—"}
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
                                    Q{formatMoney(felBase)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase opacity-70">
                                    IVA
                                  </p>
                                  <p className="font-semibold tabular-nums">
                                    Q{formatMoney(felIva)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold uppercase opacity-70">
                                    Total
                                  </p>
                                  <p className="font-black tabular-nums">
                                    Q{formatMoney(felTotal)}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-background border rounded-xl">
                  <User className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                      Vendedor
                    </p>
                    <p className="text-sm font-bold">
                      {pagoEncontrado.venta.vendedor_nombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background border rounded-xl">
                  <UserCheck className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                      Cobrado por
                    </p>
                    <p className="text-sm font-bold">
                      {pagoEncontrado.pago.cajero_nombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background border rounded-xl">
                  <ShoppingBag className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                      Fecha de Venta
                    </p>
                    <p className="text-sm font-bold">
                      {formatDateShort(pagoEncontrado.venta.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background border rounded-xl">
                  <CalendarDays className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                      Fecha de Pago
                    </p>
                    <p className="text-sm font-bold">
                      {formatDateShort(
                        pagoEncontrado.pago.created_at ||
                          pagoEncontrado.pago.fecha_pago,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/20 p-6 rounded-2xl border flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                  Detalle de Venta
                </p>
                <div className="space-y-3">
                  {pagoEncontrado.venta.ven_detalle?.map(
                    (item: DetalleVentaCredito) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="font-medium text-muted-foreground">
                          <span className="uppercase">
                            {item.cantidad} {item.inv_productos?.medida} DE{" "}
                          </span>
                          {item.inv_productos?.nombre}
                        </span>
                        <span className="font-bold">
                          Q{Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  const event = new CustomEvent("imprimir-pago-directo", {
                    detail: {
                      pago: pagoEncontrado.pago,
                      venta: pagoEncontrado.venta,
                      cliente: pagoEncontrado.venta.ven_clientes,
                    },
                  });
                  window.dispatchEvent(event);
                }}
                className="mt-8 w-full flex items-center justify-center gap-3 py-4 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs cursor-pointer"
              >
                <Printer className="size-4" />
                Imprimir Recibo
              </button>
              {canDeleteAbono && (
                <button
                  onClick={handleEliminarAbonoBuscado}
                  disabled={isDeletingAbono}
                  className="mt-3 w-full flex items-center justify-center gap-3 py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest text-xs cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Eliminar Abono
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <CreditosList
            clientes={filtrados}
            onSelectCliente={setSelectedCliente}
          />

          <DetalleCreditoModal
            key={selectedCliente?.cliente_id ?? "credito-cerrado"}
            isOpen={!!selectedCliente}
            onClose={() => setSelectedCliente(null)}
            cliente={selectedCliente}
            ventasCliente={ventasDelCliente}
          />
        </>
      )}

      <ReciboAbonoPrint />
    </div>
  );
}
