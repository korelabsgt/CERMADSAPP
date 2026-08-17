"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { getComprobanteSignedUrl } from "../lib/actions";
import { loadStoragePreviewUrl } from "../lib/storage-preview";

const BUCKET_COMPROBANTES = "ventas-comprobantes";

interface VerConstanciaModalProps {
  path: string;
  onClose: () => void;
}

export default function VerConstanciaModal({
  path,
  onClose,
}: VerConstanciaModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setLoading(true);
    setFailed(false);
    setUrl(null);

    const load = async () => {
      const server = await getComprobanteSignedUrl(path);
      if (cancelled) return;

      if (server.url) {
        setUrl(server.url);
        setLoading(false);
        return;
      }

      const preview = await loadStoragePreviewUrl(BUCKET_COMPROBANTES, path);
      if (cancelled) {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        return;
      }

      if (!preview) {
        setFailed(true);
        setLoading(false);
        return;
      }

      if (preview.startsWith("blob:")) objectUrl = preview;
      setUrl(preview);
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
        aria-label="Cerrar"
      >
        <X className="size-6" />
      </button>
      {loading ? (
        <Loader2 className="size-10 animate-spin text-white" />
      ) : failed || !url ? (
        <p className="max-w-sm text-center text-sm font-bold uppercase tracking-widest text-white">
          No se pudo cargar la constancia. Si la borraste por accidente,
          edita la carga y vuelve a subirla.
        </p>
      ) : (
        <img
          src={url}
          alt="Constancia de pago"
          className="max-h-[90vh] max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>,
    document.body,
  );
}
