"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PreventaMovimiento, codigoCorto } from "../lib/zod";
import { entrarBtn, formatFechaHora, formatMoney } from "../lib/ui";
import ConstanciaThumb from "./constancia-thumb";

interface MovimientoCardProps {
  mov: PreventaMovimiento;
  onVerConstancia: (path: string) => void;
  onReimprimir: (mov: PreventaMovimiento) => void;
}

function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function MovimientoCard({
  mov,
  onVerConstancia,
  onReimprimir,
}: MovimientoCardProps) {
  const esIngreso = mov.tipo === "ingreso";
  const codigo = codigoCorto(mov.preventa_id || mov.venta_id || mov.id);
  const tieneConstancia = esIngreso && !!mov.img_comprobante_url;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700 md:flex-row md:items-stretch">
      <ConstanciaThumb
        full
        path={tieneConstancia ? mov.img_comprobante_url : null}
        esIngreso={esIngreso}
        onOpen={() => {
          if (mov.img_comprobante_url) onVerConstancia(mov.img_comprobante_url);
        }}
      />

      <div className="relative min-w-0 flex-1 self-stretch pr-12 md:min-h-[10.5rem]">
        <button
          type="button"
          onClick={() => onReimprimir(mov)}
          className={cn(entrarBtn, "absolute right-0 top-0 z-10 size-9")}
          aria-label="Imprimir"
          title="Imprimir"
        >
          <Printer className="size-4" />
        </button>

        <div className="flex flex-col gap-3 pb-14 md:grid md:grid-cols-3 md:gap-4 md:pb-12">
          <Campo label="Recibo de preventa">
            <p className="font-bold">#{codigo}</p>
            <p>{esIngreso ? "Ingreso" : "Consumo"}</p>
            {mov.simulado && (
              <p className="text-[10px] font-bold uppercase text-zinc-400">
                Simulado
              </p>
            )}
          </Campo>
          <Campo label="Fecha de preventa">
            <p>{formatFechaHora(mov.created_at)}</p>
            <p className="text-xs text-muted-foreground">
              {mov.usuario_nombre}
            </p>
          </Campo>
          <Campo label="Método de pago">
            <p>{mov.metodo_pago || "—"}</p>
          </Campo>
        </div>

        <div className="absolute bottom-0 left-0 space-y-0.5">
          <p className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
            Monto inicial
          </p>
          <p className="text-lg font-black tabular-nums text-sky-600 dark:text-sky-400">
            Q{formatMoney(mov.monto)}
          </p>
        </div>

        <div className="absolute bottom-0 right-0 space-y-0.5 text-right">
          <p className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-400">
            Monto disponible
          </p>
          <p className="text-lg font-black tabular-nums text-emerald-600 dark:text-emerald-400">
            Q{formatMoney(mov.saldo_resultante)}
          </p>
        </div>
      </div>
    </div>
  );
}
