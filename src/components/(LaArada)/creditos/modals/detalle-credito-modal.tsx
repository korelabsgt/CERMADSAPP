"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  Loader2,
  History,
  ChevronDown,
  ChevronUp,
  Printer,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { ClienteCredito, VentaCredito } from "../lib/zod";
import { useProcesarPago, useEliminarAbono } from "../lib/hooks";
import { cn } from "@/lib/utils";
import { showToast, showConfirm } from "@/lib/notifications";
import { useUser } from "@/components/(base)/providers/UserProvider";

interface DetalleCreditoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteCredito | null;
  ventasCliente: VentaCredito[];
}

interface PagoHistorial {
  id: string;
  monto: number;
  cajero_nombre?: string;
  created_at?: string;
  fecha_pago?: string;
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

  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canDeleteAbono = userRole === "super" || userRole === "admin";

  const { mutateAsync: procesarPago } = useProcesarPago();
  const { mutateAsync: eliminarAbono } = useEliminarAbono();

  useEffect(() => {
    if (isOpen) {
      setAbonos({});
      setExpandedId(null);
      setWhatsappVentaId(null);
      setWhatsappPhone("");
    }
  }, [isOpen]);

  if (!cliente) return null;

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
      // Solo limpiar el abono de esta venta, sin cerrar el modal
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

  const imprimirRecibo = (pago: PagoHistorial, venta: VentaCredito) => {
    const event = new CustomEvent("imprimir-pago-directo", {
      detail: { pago, venta, cliente },
    });
    window.dispatchEvent(event);
  };

  const handleEliminarAbono = async (
    e: React.MouseEvent,
    pago: PagoHistorial,
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
    <AnimatePresence>
      {isOpen && cliente && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-9999 flex flex-col bg-background/95 backdrop-blur-md"
        >
          <div className="flex items-center justify-between p-4 md:p-6 border-b bg-card shrink-0 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-red-500/10 p-2 md:p-3 rounded-xl text-red-500">
                <CreditCard className="size-6 md:size-8" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-foreground uppercase tracking-tight">
                  Detalle de Cuenta
                </h2>
                <div className="flex flex-col mt-0.5">
                  <p className="text-xs md:text-sm text-muted-foreground font-bold tracking-widest uppercase">
                    {cliente.nombre}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground font-bold tracking-widest uppercase">
                    NIT: {cliente.nit}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors cursor-pointer"
              disabled={processingId !== null}
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-7xl mx-auto w-full">
            {ventasCliente.map((venta) => {
              const saldoPendiente =
                venta.saldo_pendiente ?? Number(venta.total);
              const montoActual = abonos[venta.id] || "";
              const isExpanded = expandedId === venta.id;

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
                      <div className="flex justify-between items-center w-full">
                        <p className="font-bold text-lg md:text-xl text-foreground">
                          Venta #{venta.id ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}` : '---'}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {venta.created_at
                            ? new Date(venta.created_at).toLocaleDateString(
                                "es-GT",
                              )
                            : "Sin fecha"}
                        </p>
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
                          Q
                          {Number(venta.total).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest">
                          Pendiente
                        </p>
                        <p className="font-black text-xl md:text-2xl text-foreground">
                          Q
                          {saldoPendiente.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
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

                                        const numV = venta.id ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}` : '---';
                                        const fV = formatParts(
                                          venta.created_at,
                                        );
                                        const totV = Number(
                                          venta.total,
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                        });
                                        const salV = Number(
                                          venta.saldo_pendiente ?? 0,
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                        });

                                        let texto = `👤 *${cliente?.nombre}*\n\n*${fV.d}, ${fV.t}*\n\`\`\`Venta #${numV}: Q${totV}\`\`\`\n\n\n📝 *Abonos:*\n\n`;

                                        venta.ven_pagos?.forEach(
                                          (pago: PagoHistorial) => {
                                            const fP = formatParts(
                                              pago.created_at,
                                            );
                                            const idA = pago.id ? `${pago.id.substring(0, 3).toUpperCase()}-${pago.id.substring(3, 6).toUpperCase()}` : '---';
                                            const monA = Number(
                                              pago.monto,
                                            ).toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                            });
                                            texto += `*${fP.d}, ${fP.t}*\n\`\`\`Abono #${idA}: Q${monA}\`\`\`\n\n`;
                                          },
                                        );

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

                            {venta.ven_pagos && venta.ven_pagos.length > 0 ? (
                              <div className="space-y-3">
                                {venta.ven_pagos.map(
                                  (pago: PagoHistorial, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex flex-col text-sm bg-background border-2 border-border/50 p-4 rounded-xl shadow-sm hover:border-emerald-500/30"
                                    >
                                      <div className="flex justify-between items-start w-full mb-1">
                                        <span className="font-bold text-foreground text-base">
                                          Abono: #
                                          {pago.id ? `${pago.id.substring(0, 3).toUpperCase()}-${pago.id.substring(3, 6).toUpperCase()}` : '---'}
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
                                          + Q
                                          {Number(pago.monto).toLocaleString(
                                            "en-US",
                                            { minimumFractionDigits: 2 },
                                          )}
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
                                  ),
                                )}
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
                                        handlePagarVenta(venta.id, abonos[venta.id]);
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
                                        handlePagarVenta(venta.id, abonos[venta.id]);
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
            })}
          </div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}
