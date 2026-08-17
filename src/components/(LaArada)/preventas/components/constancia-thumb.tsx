"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadStoragePreviewUrl } from "../lib/storage-preview";

const BUCKET_COMPROBANTES = "ventas-comprobantes";

interface ConstanciaThumbProps {
  path?: string | null;
  esIngreso: boolean;
  onOpen: () => void;
  full?: boolean;
}

export default function ConstanciaThumb({
  path,
  esIngreso,
  onOpen,
  full = false,
}: ConstanciaThumbProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);

    void loadStoragePreviewUrl(BUCKET_COMPROBANTES, path).then((preview) => {
      if (cancelled) {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        return;
      }
      if (preview?.startsWith("blob:")) objectUrl = preview;
      setUrl(preview);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const frameClass = full
    ? "aspect-[4/3] w-full overflow-hidden border border-zinc-300 bg-zinc-100 md:w-56 md:shrink-0 dark:border-zinc-600 dark:bg-zinc-800"
    : "size-9 shrink-0 overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800";

  if (path && loading) {
    return (
      <div className={cn(frameClass, "flex items-center justify-center")}>
        <Loader2 className="size-4 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (path && url) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(frameClass, "cursor-pointer transition-opacity hover:opacity-90")}
        title="Ver constancia"
      >
        <img
          src={url}
          alt="Constancia"
          className="size-full object-contain"
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        frameClass,
        "flex items-center justify-center text-zinc-500 dark:text-zinc-400",
      )}
    >
      {esIngreso ? (
        <ArrowDownCircle className={full ? "size-7" : "size-5"} />
      ) : (
        <ArrowUpCircle className={full ? "size-7" : "size-5"} />
      )}
    </div>
  );
}
