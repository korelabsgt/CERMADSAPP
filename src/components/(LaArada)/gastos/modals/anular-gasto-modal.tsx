"use client";

import { useEffect, useState } from "react";
import {
  ModalCancel,
  ModalFooter,
  ModalLabel,
  ModalShell,
} from "@/components/ui/general-modal";
import { cn } from "@/lib/utils";
import { GastoItem } from "../lib/zod";
import { useAnularGasto } from "../lib/hooks";
import { formatMoney } from "../lib/ui";

interface AnularGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasto: GastoItem | null;
}

export default function AnularGastoModal({
  isOpen,
  onClose,
  gasto,
}: AnularGastoModalProps) {
  const anularMutation = useAnularGasto();
  const [razon, setRazon] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setRazon("");
      setError(null);
    }
  }, [isOpen, gasto?.id]);

  if (!gasto) return null;

  const handleSubmit = async () => {
    const trimmed = razon.trim();
    if (trimmed.length < 3) {
      setError("Indica la razón de la anulación (mínimo 3 caracteres)");
      return;
    }
    if (trimmed.length > 500) {
      setError("La razón no puede exceder 500 caracteres");
      return;
    }

    setError(null);
    const res = await anularMutation.mutateAsync({ id: gasto.id, razon: trimmed });
    if (!res.error) {
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Anular gasto"
      subtitle="El registro permanece visible; deja de sumar en totales"
      maxWidthClassName="sm:max-w-lg"
      footer={
        <ModalFooter>
          <ModalCancel onClick={onClose} disabled={anularMutation.isPending} />
          <button
            type="button"
            disabled={anularMutation.isPending}
            onClick={() => void handleSubmit()}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl px-6 text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 hover:bg-red-200 active:scale-95 cursor-pointer sm:flex-none dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {anularMutation.isPending ? "Anulando…" : "Anular gasto"}
          </button>
        </ModalFooter>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vas a anular{" "}
          <span className="font-bold text-foreground">{gasto.nombre}</span> por{" "}
          <span className="font-bold tabular-nums text-foreground">
            Q{formatMoney(gasto.cantidad)}
          </span>
          . La categoría pasará a{" "}
          <span className="font-bold text-foreground">Anulado</span> y se registrará en
          movimientos quién anuló y el motivo.
        </p>

        <div className="space-y-2">
          <ModalLabel>Razón de la anulación</ModalLabel>
          <textarea
            value={razon}
            onChange={(e) => {
              setRazon(e.target.value);
              if (error) setError(null);
            }}
            rows={4}
            className={cn(
              "w-full min-h-[6rem] resize-y rounded-xl border-2 bg-transparent px-3 py-2.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 transition-all",
              error ? "border-red-500" : "border-celeste-trifinio"
            )}
          />
          {error && (
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
