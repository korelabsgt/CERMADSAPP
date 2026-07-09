"use client";

import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";
import { useCreditos, useEliminarAbono } from "./lib/hooks";
import { ClienteCredito } from "./lib/zod";
import CreditosList from "./components/creditos-list";
import DetalleCreditoModal from "./modals/detalle-credito-modal";
import ReciboAbonoPrint from "./components/recibo-abono-print";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { showConfirm } from "@/lib/notifications";

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
  const [pagoEncontrado, setPagoEncontrado] = useState<{
    pago: any;
    venta: any;
  } | null>(null);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      let encontrado = null;
      for (const venta of creditosTotales) {
        const pago = venta.ven_pagos?.find((p: any) =>
          p.id?.toLowerCase().startsWith(searchTerm.toLowerCase()),
        );
        if (pago) {
          encontrado = { pago, venta };
          break;
        }
      }
      setPagoEncontrado(encontrado);
    } else {
      setPagoEncontrado(null);
    }
  }, [searchTerm, creditosTotales]);

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
    return creditosTotales.filter(
      (v) => v.cliente_id === selectedCliente.cliente_id,
    );
  }, [selectedCliente, creditosTotales]);

  const handleEliminarAbonoBuscado = async () => {
    if (!pagoEncontrado?.pago?.id) return;

    const result = await showConfirm({
      title: "¿Eliminar abono?",
      html: `Se eliminará el abono de <strong>Q${Number(pagoEncontrado.pago.monto).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.`,
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
                Q
                {deudaGlobal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
                    Q
                    {Number(pagoEncontrado.pago.monto).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

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
                      {new Date(
                        pagoEncontrado.venta.created_at,
                      ).toLocaleDateString()}
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
                      {new Date(
                        pagoEncontrado.pago.created_at ||
                          pagoEncontrado.pago.fecha_pago,
                      ).toLocaleDateString()}
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
                  {pagoEncontrado.venta.ven_detalle?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium text-muted-foreground">
                        <span className="uppercase">
                          {item.cantidad} {item.inv_productos?.medida} DE{" "}
                        </span>
                        {item.inv_productos?.nombre}
                      </span>
                      <span className="font-bold">
                        Q{item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
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
