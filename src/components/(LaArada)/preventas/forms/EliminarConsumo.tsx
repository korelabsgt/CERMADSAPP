"use client";

import {
  ModalCancel,
  ModalFooter,
  ModalShell,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import {
  PreventaMovimiento,
  formatReciboMovimientoLabel,
  razonMovimientoLabel,
} from "../lib/zod";
import { useEliminarMovimientoPreventa } from "../lib/hooks";
import { formatFechaHora, formatMoney } from "../lib/ui";

interface EliminarConsumoProps {
  isOpen: boolean;
  onClose: () => void;
  mov: PreventaMovimiento | null;
}

export default function EliminarConsumo({
  isOpen,
  onClose,
  mov,
}: EliminarConsumoProps) {
  const { mutateAsync: eliminar, isPending } = useEliminarMovimientoPreventa();
  const esIngreso = mov?.tipo === "ingreso";

  const handleEliminar = async () => {
    if (!mov) return;
    const res = await eliminar({ movimiento_id: mov.id });
    if ("error" in res) return;
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen && !!mov}
      onClose={onClose}
      title={esIngreso ? "Eliminar anticipo" : "Eliminar consumo"}
      subtitle={
        esIngreso
          ? "Quitar saldo a favor del cliente"
          : "Devolver saldo a la preventa"
      }
      maxWidthClassName="sm:max-w-md"
      footer={
        <ModalFooter>
          <ModalCancel onClick={onClose} disabled={isPending} />
          <button
            type="button"
            disabled={isPending || !mov}
            onClick={handleEliminar}
            className={cn(
              "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest shadow-none transition-colors cursor-pointer sm:flex-none sm:px-6",
              "bg-red-100 text-red-600 hover:bg-red-200",
              "dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </ModalFooter>
      }
    >
      {mov && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {esIngreso
              ? "Se eliminará este anticipo y se descontará del saldo disponible del cliente."
              : "Se eliminará este consumo y el monto se devolverá al saldo disponible del cliente."}
          </p>
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Recibo
              </span>
              <span className="font-mono text-sm font-bold">
                #{formatReciboMovimientoLabel(mov)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Razón
              </span>
              <span className="text-sm font-semibold">
                {razonMovimientoLabel(mov)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fecha
              </span>
              <span className="text-sm font-semibold">
                {formatFechaHora(mov.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {esIngreso ? "Monto a descontar" : "Monto a devolver"}
              </span>
              <span
                className={cn(
                  "text-sm font-black tabular-nums",
                  esIngreso
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {esIngreso ? "-" : "+"}Q{formatMoney(mov.monto)}
              </span>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
