"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowLeft,
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
  Pencil,
  Check,
} from "lucide-react";
import { useCreditos, useEditarAbono, useEliminarAbono } from "./lib/hooks";
import {
  DetalleVentaCredito,
  PagoCreditoHistorial,
  VentaCredito,
} from "./lib/zod";
import CreditosList from "./components/creditos-list";
import ReciboAbonoPrint from "./components/recibo-abono-print";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { showConfirm, showToast } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type PagoEncontrado = {
  pago: PagoCreditoHistorial;
  venta: VentaCredito;
};

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
  const router = useRouter();
  const { clientesConCredito, creditosTotales, isLoading } = useCreditos();
  const { mutateAsync: eliminarAbono, isPending: isDeletingAbono } =
    useEliminarAbono();
  const { mutateAsync: editarAbono, isPending: isEditingAbono } =
    useEditarAbono();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canManageAbono = userRole === "super" || userRole === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [editandoBusqueda, setEditandoBusqueda] = useState(false);
  const [montoEdicionBusqueda, setMontoEdicionBusqueda] = useState("");

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
    setEditandoBusqueda(false);
    setMontoEdicionBusqueda("");
    setSearchTerm("");
  };

  const iniciarEdicionBusqueda = () => {
    if (!pagoEncontrado?.pago) return;
    setEditandoBusqueda(true);
    setMontoEdicionBusqueda(String(Number(pagoEncontrado.pago.monto)));
  };

  const cancelarEdicionBusqueda = () => {
    setEditandoBusqueda(false);
    setMontoEdicionBusqueda("");
  };

  const handleGuardarAbonoBuscado = async () => {
    if (!pagoEncontrado?.pago?.id) return;

    const monto = Number(montoEdicionBusqueda);
    if (!Number.isFinite(monto) || monto <= 0) {
      showToast("error", "Ingresa un monto válido mayor a 0.");
      return;
    }

    await editarAbono({ pago_id: pagoEncontrado.pago.id, monto });
    setEditandoBusqueda(false);
    setMontoEdicionBusqueda("");
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
    <div className="p-4 md:p-6 w-full mx-auto space-y-4 animate-in fade-in duration-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada")}
          className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </button>

        <div className="min-w-0 text-right">
          <h1 className="text-base md:text-xl font-black text-foreground uppercase tracking-tight">
            Cuentas por Cobrar
          </h1>
        </div>
      </div>

      {!pagoEncontrado && (
        <div className="relative min-w-0 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente, NIT o pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border-2 border-celeste-trifinio bg-transparent pl-9 pr-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30"
          />
        </div>
      )}

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
                  {editandoBusqueda ? (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-3xl text-foreground">
                        Q
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        value={montoEdicionBusqueda}
                        onChange={(e) =>
                          setMontoEdicionBusqueda(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === "-" ||
                            e.key === "e" ||
                            e.key === "E" ||
                            e.key === "+"
                          )
                            e.preventDefault();
                          if (e.key === "Enter") void handleGuardarAbonoBuscado();
                          if (e.key === "Escape") cancelarEdicionBusqueda();
                        }}
                        className="w-40 rounded-xl border-2 border-emerald-500/50 bg-transparent px-3 py-1 text-3xl font-black text-foreground outline-none focus:ring-2 focus:ring-emerald-500/30"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p className="font-black text-3xl text-foreground">
                      Q{formatMoney(pagoEncontrado.pago.monto)}
                    </p>
                  )}
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
                      <div className="flex items-center gap-2 border-b border-sky-200/70 px-3 py-2 dark:border-sky-800/70">
                        <FileCheck2 className="size-3.5 shrink-0" />
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest md:text-xs">
                          Certificación ·{" "}
                          {formatDateShort(dteFel.fecha_certificacion)}
                        </p>
                      </div>
                      <div className="md:hidden">
                        <table className="w-full text-left text-xs">
                          <tbody>
                            <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
                              <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                                Receptor
                              </th>
                              <td className="px-3 py-2 text-xs font-semibold">
                                {dteFel.nombre_receptor ||
                                  pagoEncontrado.venta.ven_clientes?.nombre ||
                                  "—"}
                              </td>
                            </tr>
                            <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
                              <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                                NIT
                              </th>
                              <td className="px-3 py-2 font-mono font-semibold">
                                {dteFel.id_receptor || "—"}
                              </td>
                            </tr>
                            <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
                              <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                                FEL
                              </th>
                              <td className="break-all px-3 py-2 font-mono text-[11px] font-semibold">
                                {formatFelNumero(dteFel.serie, dteFel.numero)}
                              </td>
                            </tr>
                            <tr className="border-b border-sky-200/50 dark:border-sky-800/50">
                              <th className="w-20 px-3 py-2 text-[10px] font-bold uppercase opacity-70">
                                UUID
                              </th>
                              <td className="break-all px-3 py-2 font-mono text-[11px] font-semibold">
                                {dteFel.uuid_infile || "—"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="hidden md:grid md:grid-cols-2 md:text-sm">
                        <div className="flex min-w-0 border-b border-r border-sky-200/50 dark:border-sky-800/50">
                          <div className="w-24 shrink-0 px-4 py-3 text-xs font-bold uppercase opacity-70">
                            Receptor
                          </div>
                          <div className="min-w-0 flex-1 px-4 py-3 font-semibold">
                            {dteFel.nombre_receptor ||
                              pagoEncontrado.venta.ven_clientes?.nombre ||
                              "—"}
                          </div>
                        </div>
                        <div className="flex min-w-0 border-b border-sky-200/50 dark:border-sky-800/50">
                          <div className="w-24 shrink-0 px-4 py-3 text-xs font-bold uppercase opacity-70">
                            NIT
                          </div>
                          <div className="min-w-0 flex-1 px-4 py-3 font-mono font-semibold">
                            {dteFel.id_receptor || "—"}
                          </div>
                        </div>
                        <div className="flex min-w-0 border-r border-sky-200/50 dark:border-sky-800/50">
                          <div className="w-24 shrink-0 px-4 py-3 text-xs font-bold uppercase opacity-70">
                            FEL
                          </div>
                          <div className="min-w-0 flex-1 break-all px-4 py-3 font-mono text-sm font-semibold">
                            {formatFelNumero(dteFel.serie, dteFel.numero)}
                          </div>
                        </div>
                        <div className="flex min-w-0">
                          <div className="w-24 shrink-0 px-4 py-3 text-xs font-bold uppercase opacity-70">
                            UUID
                          </div>
                          <div className="min-w-0 flex-1 break-all px-4 py-3 font-mono text-sm font-semibold">
                            {dteFel.uuid_infile || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-sky-200/50 px-3 py-2 dark:border-sky-800/50 md:px-4 md:py-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs md:text-sm">
                          <div>
                            <p className="text-[10px] font-bold uppercase opacity-70 md:text-xs">
                              Base
                            </p>
                            <p className="font-semibold tabular-nums">
                              Q{formatMoney(felBase)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase opacity-70 md:text-xs">
                              IVA
                            </p>
                            <p className="font-semibold tabular-nums">
                              Q{formatMoney(felIva)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase opacity-70 md:text-xs">
                              Total
                            </p>
                            <p className="font-black tabular-nums">
                              Q{formatMoney(felTotal)}
                            </p>
                          </div>
                        </div>
                      </div>
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
              {canManageAbono && (
                editandoBusqueda ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={cancelarEdicionBusqueda}
                      disabled={isEditingAbono}
                      className="flex items-center justify-center gap-2 py-4 bg-zinc-200 text-zinc-700 font-black rounded-xl hover:bg-zinc-300 transition-all uppercase tracking-widest text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                    >
                      <X className="size-4" />
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarAbonoBuscado}
                      disabled={isEditingAbono}
                      className="flex items-center justify-center gap-2 py-4 bg-emerald-200 text-emerald-900 font-black rounded-xl hover:bg-emerald-300 transition-all uppercase tracking-widest text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
                    >
                      {isEditingAbono ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Guardar
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={iniciarEdicionBusqueda}
                      disabled={isDeletingAbono}
                      className="flex items-center justify-center gap-2 py-4 bg-amber-100 text-amber-800 font-black rounded-xl hover:bg-amber-200 transition-all uppercase tracking-widest text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
                    >
                      <Pencil className="size-4" />
                      Editar Abono
                    </button>
                    <button
                      onClick={handleEliminarAbonoBuscado}
                      disabled={isDeletingAbono}
                      className="flex items-center justify-center gap-2 py-4 bg-red-100 text-red-600 font-black rounded-xl hover:bg-red-200 transition-all uppercase tracking-widest text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    >
                      <Trash2 className="size-4" />
                      Eliminar
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        <CreditosList clientes={filtrados} />
      )}

      <ReciboAbonoPrint />
    </div>
  );
}
