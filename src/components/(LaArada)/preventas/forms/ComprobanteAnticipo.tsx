"use client";

import { useEffect, useRef, useState } from "react";
import ImageUploader from "@/components/(base)/imgs/ImageUploader";
import {
  ModalCancel,
  ModalFooter,
  ModalShell,
} from "@/components/ui/general-modal";
import { createClient } from "@/utils/supabase/client";
import {
  PreventaMovimiento,
  formatReciboMovimientoLabel,
} from "../lib/zod";
import { useActualizarComprobantePreventa } from "../lib/hooks";
import { formatFechaHora, formatMoney } from "../lib/ui";

const BUCKET_COMPROBANTES = "ventas-comprobantes";

interface ComprobanteAnticipoProps {
  isOpen: boolean;
  onClose: () => void;
  mov: PreventaMovimiento | null;
}

export default function ComprobanteAnticipo({
  isOpen,
  onClose,
  mov,
}: ComprobanteAnticipoProps) {
  const actualizarComprobante = useActualizarComprobantePreventa();
  const initialPathRef = useRef<string | null>(null);
  const currentPathRef = useRef<string | null>(null);
  const [imgPath, setImgPath] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !mov) return;
    const path = mov.img_comprobante_url?.trim() || null;
    initialPathRef.current = path;
    currentPathRef.current = path;
    setImgPath(path);
  }, [isOpen, mov?.id, mov?.img_comprobante_url]);

  const discardUnsaved = async () => {
    const path = currentPathRef.current;
    if (!path || path === initialPathRef.current) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET_COMPROBANTES).remove([path]);
  };

  const handleClose = async () => {
    await discardUnsaved();
    onClose();
  };

  const persistPath = async (path: string | null) => {
    if (!mov?.preventa_id) return;
    const res = await actualizarComprobante.mutateAsync({
      preventa_id: mov.preventa_id,
      img_comprobante_url: path,
    });
    if ("error" in res) return;
    currentPathRef.current = path;
    initialPathRef.current = path;
    setImgPath(path);
  };

  const puedeGestionar =
    mov &&
    mov.tipo === "ingreso" &&
    !mov.simulado &&
    mov.preventa_id;

  return (
    <ModalShell
      isOpen={isOpen && !!mov}
      onClose={handleClose}
      title="Comprobante"
      subtitle="Constancia de anticipo"
      maxWidthClassName="sm:max-w-lg"
      footer={
        <ModalFooter>
          <ModalCancel onClick={handleClose}>Cerrar</ModalCancel>
        </ModalFooter>
      }
    >
      {mov && (
        <div className="space-y-4">
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
                Fecha
              </span>
              <span className="text-sm font-semibold">
                {formatFechaHora(mov.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Monto
              </span>
              <span className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                +Q{formatMoney(mov.monto)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Método
              </span>
              <span className="text-sm font-semibold">
                {mov.metodo_pago ?? "—"}
              </span>
            </div>
          </div>

          {puedeGestionar ? (
            <ImageUploader
              key={mov.id}
              bucketName={BUCKET_COMPROBANTES}
              currentImagePath={imgPath}
              onUploadSuccess={async (path) => {
                await persistPath(path);
              }}
              onDeleteSuccess={async () => {
                await persistPath(null);
              }}
              permitirTodos
              camaraSoloEnMobile
              aspect={4 / 3}
              aspectLabel="Horizontal 4:3"
              previewClassName="max-h-[420px] w-full"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No se puede gestionar el comprobante de este movimiento.
            </p>
          )}
        </div>
      )}
    </ModalShell>
  );
}
