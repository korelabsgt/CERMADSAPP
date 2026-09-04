"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ModalCancel,
  ModalFooter,
  ModalLabel,
  ModalShell,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import {
  AnularFacturaPreventaSchema,
  AnularFacturaPreventaValues,
  PreventaMovimiento,
  formatDiaGT,
  formatReciboMovimientoLabel,
  isConsumidorFinalNit,
  plazoAnulacionInmediata,
  preventaEstaFacturada,
} from "../lib/zod";
import { useAnularFacturaPreventa } from "../lib/hooks";
import { formatFechaHora, formatMoney } from "../lib/ui";

interface AnularFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  mov: PreventaMovimiento | null;
}

export default function AnularFactura({
  isOpen,
  onClose,
  mov,
}: AnularFacturaProps) {
  const { mutateAsync: anular, isPending } = useAnularFacturaPreventa();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnularFacturaPreventaValues>({
    resolver: zodResolver(AnularFacturaPreventaSchema),
    defaultValues: {
      movimiento_id: "",
      motivo: "",
    },
  });

  const fechaEmision =
    mov?.dte?.fecha_emision ||
    mov?.dte?.fecha_certificacion ||
    mov?.created_at ||
    "";
  const esCF = isConsumidorFinalNit(mov?.dte?.id_receptor);
  const plazo = useMemo(
    () => (fechaEmision ? plazoAnulacionInmediata(fechaEmision) : null),
    [fechaEmision],
  );
  const esExtemporanea = Boolean(esCF && plazo && !plazo.permitido);

  useEffect(() => {
    if (!isOpen || !mov) return;
    reset({
      movimiento_id: mov.id,
      motivo: "",
    });
  }, [isOpen, mov, reset]);

  const onSubmit = async (values: AnularFacturaPreventaValues) => {
    if (!mov || !preventaEstaFacturada(mov) || esExtemporanea) return;
    const res = await anular(values);
    if ("error" in res) return;
    onClose();
  };

  const facturaLabel = mov?.dte
    ? `${mov.dte.serie}-${mov.dte.numero}`
    : "";

  return (
    <ModalShell
      isOpen={isOpen && !!mov}
      onClose={onClose}
      title="Anular factura"
      subtitle={facturaLabel ? `FEL ${facturaLabel}` : "Factura electrónica"}
      maxWidthClassName="sm:max-w-lg"
      footer={
        <ModalFooter>
          <ModalCancel onClick={onClose} disabled={isPending} />
          <button
            type="submit"
            form="anular-factura-preventa"
            disabled={
              isPending ||
              !mov ||
              !preventaEstaFacturada(mov) ||
              esExtemporanea
            }
            className={cn(
              "inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl px-4 text-[10px] font-bold uppercase tracking-widest shadow-none transition-colors cursor-pointer sm:flex-none sm:px-6",
              "bg-red-100 text-red-600 hover:bg-red-200",
              "dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {esExtemporanea
              ? "Anulación no disponible"
              : isPending
                ? "Anulando..."
                : "Anular factura"}
          </button>
        </ModalFooter>
      }
    >
      {mov && (
        <form
          id="anular-factura-preventa"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <input type="hidden" {...register("movimiento_id")} />

          {esCF && plazo?.permitido && (
            <div className="rounded-xl bg-sky-100 px-4 py-3 text-azul-trifinio dark:bg-sky-950 dark:text-sky-300">
              <p className="text-xs font-bold">
                Receptor: Consumidor Final. La SAT solo permite anular de
                inmediato el mismo día de emisión o al día siguiente (límite{" "}
                {formatDiaGT(plazo.fechaLimite)}). Luego emita una factura
                nueva. No use nota de crédito sobre una factura a CF.
              </p>
            </div>
          )}

          {esExtemporanea && plazo && (
            <div className="rounded-xl bg-amber-100 px-4 py-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <p className="text-xs font-bold">
                Ya no se puede anular de inmediato. La SAT solo permite anular
                facturas a Consumidor Final el mismo día de emisión o al día
                siguiente (emisión {formatDiaGT(plazo.fechaEmision)}, límite{" "}
                {formatDiaGT(plazo.fechaLimite)}). Fuera de ese plazo la
                anulación es extemporánea y requiere autorización de la SAT. No
                use nota de crédito sobre una factura a CF.
              </p>
            </div>
          )}

          {!esCF && (
            <div className="rounded-xl bg-zinc-200/70 px-4 py-3 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <p className="text-xs font-bold">
                Receptor identificado ({mov.dte?.id_receptor}). Si necesita una
                corrección posterior, puede emitir nota de crédito sobre esta
                factura. La anulación inmediata aplica el mismo día de emisión
                o el siguiente.
              </p>
            </div>
          )}

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
                Emisión
              </span>
              <span className="text-sm font-semibold">
                {formatFechaHora(fechaEmision)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Monto
              </span>
              <span className="text-sm font-black tabular-nums">
                Q{formatMoney(mov.monto)}
              </span>
            </div>
          </div>

          {!esExtemporanea && (
            <div className="space-y-2">
              <ModalLabel>Motivo de anulación</ModalLabel>
              <textarea
                {...register("motivo")}
                rows={3}
                className={cn(
                  "w-full rounded-xl border-2 bg-transparent px-3 py-2 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30",
                  errors.motivo ? "border-red-500" : "border-celeste-trifinio",
                )}
              />
              {errors.motivo && (
                <p className="text-xs font-bold text-red-600">
                  {errors.motivo.message}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </ModalShell>
  );
}
