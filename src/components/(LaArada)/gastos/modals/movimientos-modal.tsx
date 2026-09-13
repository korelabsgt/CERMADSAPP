"use client";

import { X, History, User, Clock, FileText, ArrowRight } from "lucide-react";
import { GastoItem, GastoMovimiento } from "../lib/zod";
import { formatFechaHora, formatMoney } from "../lib/ui";

interface MovimientosModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: GastoItem | null;
}

export default function MovimientosModal({
  isOpen,
  onClose,
  gasto,
}: MovimientosModalProps) {
  if (!isOpen || !gasto) return null;

  const movimientos = Array.isArray(gasto.movimientos)
    ? (gasto.movimientos as GastoMovimiento[])
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Historial de Movimientos
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm">
                {gasto.nombre} — <span className="font-semibold text-foreground">Q{formatMoney(gasto.cantidad)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Resumen rápido del gasto */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between">
          <div>
            <span className="text-muted-foreground">Categoría: </span>
            <span className="font-semibold text-foreground">{gasto.categoria}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Creado por: </span>
            <span className="font-semibold text-foreground">{gasto.created_by || "—"}</span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {movimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <FileText className="size-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs font-semibold">Sin movimientos registrados</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-700">
              {movimientos.map((m, idx) => {
                const accionNormalized = (m.accion || "").toUpperCase();
                const isCreacion = accionNormalized.includes("CREA");
                const isEdicion = accionNormalized.includes("EDIC");

                return (
                  <div key={idx} className="relative group">
                    {/* Bullet marker */}
                    <div
                      className={`absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 ${
                        isCreacion
                          ? "bg-emerald-500 text-white"
                          : isEdicion
                          ? "bg-amber-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-white" />
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/70 p-3.5 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            isCreacion
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : isEdicion
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          }`}
                        >
                          {m.accion || "EVENTO"}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" />
                          <span>{formatFechaHora(m.fecha)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground leading-relaxed">
                        {m.detalle}
                      </p>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-zinc-100 dark:border-zinc-700/60">
                        <User className="size-3 text-red-500" />
                        <span>Realizado por:</span>
                        <span className="font-semibold text-foreground">
                          {m.usuario || "Sistema"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
