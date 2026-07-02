"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import imageCompression from "browser-image-compression";
import ImageEditorModal from "./ImageEditorModal";
import { Loader2, Upload, Camera, Trash2, X } from "lucide-react";
import { useUser } from "@/components/(base)/providers/UserProvider";
import Swal from "sweetalert2";

const swalTheme = () => {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#1c1c1e" : undefined,
    color: isDark ? "#f5f5f5" : undefined,
  };
};

const showImageError = (text: string) =>
  Swal.fire({
    icon: "error",
    title: "Imagen no válida",
    text,
    confirmButtonColor: "#3b82f6",
    ...swalTheme(),
  });

const showUploadError = (message: string) =>
  Swal.fire({
    icon: "error",
    title: "Error al subir",
    text: message,
    confirmButtonColor: "#3b82f6",
    ...swalTheme(),
  });

export interface ImageUploaderHandle {
  openGallery: () => void;
  openCamera: () => void;
  deleteImage: () => Promise<void>;
  isProcessing: boolean;
  uploading: boolean;
  deleting: boolean;
  tieneImagen: boolean;
  puedeSubir: boolean;
}

interface ImageUploaderProps {
  bucketName: string;
  currentImagePath: string | null;
  onUploadSuccess: (newPath: string) => void | Promise<void>;
  onDeleteSuccess: () => void | Promise<void>;
  disabled?: boolean;
  signedUrlExpiresIn?: number;
  /** Aspect ratio for the crop editor (default: 3/4 portrait) */
  aspect?: number;
  aspectLabel?: string;
  /** Si es true, ignora el chequeo de rol y permite subir a cualquier autenticado */
  permitirTodos?: boolean;
  /** Oculta botones internos; usar ref para controlarlos desde el padre */
  botonesExternos?: boolean;
  onEstadoChange?: (estado: { uploading: boolean; deleting: boolean }) => void;
  /** Clase CSS adicional para la vista previa de la imagen (ej. max-h-[250px]) */
  previewClassName?: string;
  /** Clase CSS para el contenedor drop zone */
  className?: string;
}

const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(
  function ImageUploader(
    {
      bucketName,
      currentImagePath,
      onUploadSuccess,
      onDeleteSuccess,
      disabled = false,
      signedUrlExpiresIn = 3600,
      aspect = 3 / 4,
      aspectLabel = "Vertical 3:4",
      permitirTodos = false,
      botonesExternos = false,
      onEstadoChange,
      previewClassName,
      className,
    },
    ref,
  ) {
    const supabase = createClient();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editingFile, setEditingFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const user = useUser();
    const metadata = user?.user_metadata || {};
    const rol = String(metadata.rol || user?.role || "user").toLowerCase();
    const rolesPrivilegiados = ["super", "admin", "rrhh", "ventas"];
    const tienePermisoSubir = permitirTodos
      ? !!user
      : rolesPrivilegiados.includes(rol);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [magnifier, setMagnifier] = useState<{
      show: boolean;
      clientX: number;
      clientY: number;
      bgX: number;
      bgY: number;
    }>({ show: false, clientX: 0, clientY: 0, bgX: 0, bgY: 0 });
    const MAGNIFIER_SIZE = 250;
    const ZOOM_LEVEL = 2.5;

    const updateMagnifier = (clientX: number, clientY: number) => {
      if (!imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      // Ocultar la lupa cerca de la esquina superior derecha para no tapar
      // el botón de eliminar y poder pulsarlo.
      if (x > rect.width - 72 && y < 72) {
        setMagnifier((m) => ({ ...m, show: false }));
        return;
      }
      const bgX = (x / rect.width) * 100;
      const bgY = (y / rect.height) * 100;
      setMagnifier({ show: true, clientX, clientY, bgX, bgY });
    };

    // Generar signed URL para el preview
    useEffect(() => {
      if (!currentImagePath) {
        setPreviewUrl(null);
        return;
      }

      setLoadingPreview(true);
      supabase.storage
        .from(bucketName)
        .createSignedUrl(currentImagePath, signedUrlExpiresIn)
        .then(({ data, error }) => {
          setPreviewUrl(error ? null : (data?.signedUrl ?? null));
          setLoadingPreview(false);
        });
    }, [currentImagePath, bucketName, supabase, signedUrlExpiresIn]);

    const isProcessing = uploading || deleting || disabled;
    const canAcceptDrop =
      tienePermisoSubir && !isProcessing && !currentImagePath;

    const isValidImageFile = (file: File) => {
      const name = file.name.toLowerCase();
      if (/\.(jpe?g|png|webp|heic|heif)$/i.test(name)) return true;
      if (file.type.startsWith("image/")) return true;
      // WhatsApp / macOS: UUID.jpg, sin MIME o como octet-stream
      if (
        file.size > 0 &&
        (!file.type || file.type === "application/octet-stream")
      ) {
        return true;
      }
      return false;
    };

    const normalizeImageFile = (file: File): File => {
      let name = file.name?.trim() || "";
      if (!name || name === "image" || name === "blob") {
        name = `imagen-${Date.now()}.jpg`;
      } else if (!/\.[a-z0-9]+$/i.test(name)) {
        name = `${name}.jpg`;
      }

      if (
        file.type &&
        file.type.startsWith("image/") &&
        file.type !== "application/octet-stream"
      ) {
        return file.name === name
          ? file
          : new File([file], name, { type: file.type });
      }

      const ext =
        name.match(/\.(jpe?g|png|webp|heic|heif)$/i)?.[1]?.toLowerCase() ||
        "jpg";
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";
      return new File([file], name, { type: mime });
    };

    const readEntryAsFile = (entry: any): Promise<File | null> =>
      new Promise((resolve) => {
        try {
          entry.file(
            (f: File) => resolve(f && f.size > 0 ? f : null),
            () => resolve(null),
          );
        } catch {
          resolve(null);
        }
      });

    const extractUrlFromDataTransfer = (
      dataTransfer: DataTransfer,
    ): string | null => {
      const types = Array.from(dataTransfer.types || []);

      if (types.includes("text/uri-list")) {
        const uri = dataTransfer
          .getData("text/uri-list")
          .split("\n")
          .map((line) => line.trim())
          .find((line) => line && !line.startsWith("#"));
        if (uri) return uri;
      }

      if (types.includes("text/html")) {
        const html = dataTransfer.getData("text/html");
        const srcMatch = html.match(/src=["']([^"']+)["']/i);
        if (srcMatch?.[1]) return srcMatch[1];
      }

      if (types.includes("text/plain")) {
        const text = dataTransfer.getData("text/plain").trim();
        if (/^(https?:|blob:|data:)/i.test(text)) return text;
      }

      return null;
    };

    const fetchUrlAsImageFile = async (url: string): Promise<File | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        if (blob.size === 0) return null;

        const pathname = url.split("?")[0] || "";
        const ext =
          pathname.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() || "jpg";
        const mime = blob.type?.startsWith("image/")
          ? blob.type
          : ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg";

        return new File([blob], `imagen-arrastrada.${ext}`, { type: mime });
      } catch {
        return null;
      }
    };

    /**
     * Lee el archivo de un drop. Captura TODO síncronamente (files, getAsFile,
     * webkitGetAsEntry) antes de cualquier await, porque el navegador vacía
     * dataTransfer tras el handler. Los "promise files" (WhatsApp/Finder en
     * macOS) solo se leen vía FileSystemEntry.file(), que es asíncrono.
     */
    const getFileFromDataTransfer = (
      dataTransfer: DataTransfer,
    ): Promise<File | null> => {
      // 1. Archivos directos
      if (dataTransfer.files?.length) {
        for (let i = 0; i < dataTransfer.files.length; i++) {
          const file = dataTransfer.files[i];
          if (file && file.size > 0) return Promise.resolve(file);
        }
      }

      // 2. Items — capturar síncronamente
      const syncFiles: File[] = [];
      const entries: any[] = [];
      const items = dataTransfer.items;
      if (items?.length) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind !== "file") continue;
          const f = item.getAsFile();
          if (f && f.size > 0) syncFiles.push(f);
          const entry = (
            item as unknown as {
              webkitGetAsEntry?: () => unknown;
            }
          ).webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
      }

      if (syncFiles.length) return Promise.resolve(syncFiles[0]);

      // 3. Fallback async: promise files vía FileSystemFileEntry
      const fileEntry = entries.find((e) => e?.isFile);
      if (fileEntry) return readEntryAsFile(fileEntry);

      return Promise.resolve(null);
    };

    const processFile = (file: File) => {
      const normalized = normalizeImageFile(file);
      if (!isValidImageFile(normalized)) {
        void showImageError("Solo se permiten imágenes JPG, PNG o WebP.");
        return;
      }
      setEditingFile(normalized);
    };

    const handleDroppedTransfer = (dataTransfer: DataTransfer | null) => {
      if (!dataTransfer) {
        void showImageError(
          "No se detectó una imagen. Usa el botón Galería o arrastra el archivo desde el Escritorio.",
        );
        return;
      }

      // Capturar URL síncronamente por si el fallback de archivo falla
      const url = extractUrlFromDataTransfer(dataTransfer);

      void getFileFromDataTransfer(dataTransfer).then(async (file) => {
        if (file) {
          processFile(file);
          return;
        }

        if (url) {
          const fetched = await fetchUrlAsImageFile(url);
          if (fetched) {
            processFile(fetched);
            return;
          }
        }

        void showImageError(
          "No se pudo leer la imagen arrastrada. Usa el botón Galería, o guárdala en el Escritorio y arrástrala desde ahí.",
        );
      });
    };

    const handleDroppedTransferRef = useRef(handleDroppedTransfer);
    handleDroppedTransferRef.current = handleDroppedTransfer;

    // Pegar imagen (Ctrl/⌘+V): funciona incluso con WhatsApp Web,
    // porque el portapapeles entrega los bytes reales de la imagen.
    const handlePasteData = (clipboardData: DataTransfer | null) => {
      if (!clipboardData) return false;
      const items = clipboardData.items ? Array.from(clipboardData.items) : [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file && file.size > 0) {
            processFile(file);
            return true;
          }
        }
      }
      if (clipboardData.files?.length) {
        for (const file of Array.from(clipboardData.files)) {
          if (file && file.size > 0 && file.type.startsWith("image/")) {
            processFile(file);
            return true;
          }
        }
      }
      return false;
    };

    const handlePasteRef = useRef(handlePasteData);
    handlePasteRef.current = handlePasteData;

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processFile(file);
      e.target.value = "";
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canAcceptDrop) return;

      const related = e.relatedTarget as Node | null;
      if (related && dropZoneRef.current?.contains(related)) return;

      setDragCounter((prev) => prev + 1);
      setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canAcceptDrop) return;
      e.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const related = e.relatedTarget as Node | null;
      if (related && dropZoneRef.current?.contains(related)) return;

      setDragCounter((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) setIsDragging(false);
        return next;
      });
    };

    // Listeners nativos: más fiables que solo eventos sintéticos de React para archivos
    useEffect(() => {
      const zone = dropZoneRef.current;
      if (!zone) return;

      const onDragOver = (e: DragEvent) => {
        if (!canAcceptDrop) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      };

      const onDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(0);
        setIsDragging(false);
        if (!canAcceptDrop) return;
        handleDroppedTransferRef.current(e.dataTransfer);
      };

      zone.addEventListener("dragover", onDragOver);
      zone.addEventListener("drop", onDrop);

      return () => {
        zone.removeEventListener("dragover", onDragOver);
        zone.removeEventListener("drop", onDrop);
      };
    }, [canAcceptDrop]);

    useEffect(() => {
      onEstadoChange?.({ uploading, deleting });
    }, [uploading, deleting, onEstadoChange]);

    const buildUniqueName = (ext: string) => {
      const timestamp = Date.now();
      const rand = Math.random().toString(36).substring(2, 10);
      return `${timestamp}-${rand}.${ext}`;
    };

    const uploadEditedFile = async (editedFile: File) => {
      setUploading(true);
      setEditingFile(null);
      try {
        const compressed = await imageCompression(editedFile, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/jpeg",
        });

        const jpegBlob =
          compressed.type === "image/jpeg"
            ? compressed
            : new File(
                [compressed],
                compressed.name.replace(/\.[^.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                },
              );

        const newPath = buildUniqueName("jpg");

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(newPath, jpegBlob, {
            upsert: false,
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        // 4. Borrar anterior si existe
        if (currentImagePath) {
          await supabase.storage.from(bucketName).remove([currentImagePath]);
        }

        // 5. Callback
        await onUploadSuccess(newPath);
      } catch (err: any) {
        console.error("Error al subir imagen:", err);
        await showUploadError(err?.message || "Error desconocido");
      } finally {
        setUploading(false);
      }
    };

    const handleDelete = async () => {
      if (!currentImagePath) return;

      const result = await Swal.fire({
        title: "¿Eliminar imagen?",
        text: "Se borrará el comprobante del almacenamiento.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        ...swalTheme(),
      });

      if (!result.isConfirmed) return;

      setDeleting(true);
      try {
        await supabase.storage.from(bucketName).remove([currentImagePath]);
        await onDeleteSuccess();
      } catch (err: any) {
        console.error("Error al eliminar:", err);
        await showUploadError(err?.message || "No se pudo eliminar la imagen.");
      } finally {
        setDeleting(false);
      }
    };

    // Evita que el navegador abra el archivo al soltar en la ventana
    useEffect(() => {
      if (!canAcceptDrop) return;

      const preventWindowDrag = (e: DragEvent) => {
        e.preventDefault();
      };

      window.addEventListener("dragover", preventWindowDrag);

      return () => {
        window.removeEventListener("dragover", preventWindowDrag);
      };
    }, [canAcceptDrop]);

    // Pegar imagen desde el portapapeles mientras el uploader puede recibir
    useEffect(() => {
      if (!canAcceptDrop) return;

      const onPaste = (e: ClipboardEvent) => {
        const handled = handlePasteRef.current(e.clipboardData);
        if (handled) e.preventDefault();
      };

      window.addEventListener("paste", onPaste);

      return () => {
        window.removeEventListener("paste", onPaste);
      };
    }, [canAcceptDrop]);

    useImperativeHandle(
      ref,
      () => ({
        openGallery: () => fileInputRef.current?.click(),
        openCamera: () => cameraInputRef.current?.click(),
        deleteImage: handleDelete,
        isProcessing,
        uploading,
        deleting,
        tieneImagen: !!currentImagePath,
        puedeSubir: tienePermisoSubir,
      }),
      [isProcessing, uploading, deleting, currentImagePath, tienePermisoSubir],
    );

    return (
      <>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={
            botonesExternos
              ? `flex flex-col items-center transition-colors ${
                  currentImagePath
                    ? "w-full"
                    : isDragging
                      ? "border-2 border-dashed border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20 rounded-xl py-10 px-4"
                      : "border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl py-10 px-4 min-h-[140px]"
                }`
              : `border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors min-h-[140px] w-full ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800/50"
                } ${className || ""}`
          }
        >
          {/* Preview o placeholder */}
          {currentImagePath ? (
            loadingPreview ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="animate-spin text-gray-400" size={28} />
              </div>
            ) : previewUrl ? (
              <div
                className={
                  botonesExternos ? "w-full" : "w-full flex justify-center"
                }
              >
                <div
                  className={`group relative ${botonesExternos ? "w-full cursor-zoom-in" : "inline-block cursor-zoom-in"}`}
                  onMouseMove={(e) => updateMagnifier(e.clientX, e.clientY)}
                  onMouseLeave={() =>
                    setMagnifier((m) => ({ ...m, show: false }))
                  }
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (!touch) return;
                    updateMagnifier(touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={() =>
                    setMagnifier((m) => ({ ...m, show: false }))
                  }
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Vista previa"
                    onClick={() => {
                      setMagnifier((m) => ({ ...m, show: false }));
                      setFullscreen(true);
                    }}
                    className={
                      botonesExternos
                        ? "w-full max-h-[calc(95vh-11rem)] object-contain select-none block"
                        : `${previewClassName || "max-h-[460px]"} object-contain rounded-lg shadow-md select-none`
                    }
                    draggable={false}
                  />
                  {tienePermisoSubir && !botonesExternos && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      onMouseEnter={() =>
                        setMagnifier((m) => ({ ...m, show: false }))
                      }
                      onMouseMove={(e) => {
                        e.stopPropagation();
                        setMagnifier((m) => ({ ...m, show: false }));
                      }}
                      disabled={isProcessing}
                      title="Eliminar imagen"
                      className="absolute top-2 right-2 z-10 flex items-center justify-center size-9 rounded-full border border-red-400/60 bg-black/50 text-white backdrop-blur-sm shadow-lg transition-all cursor-pointer hover:bg-red-600/90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500 italic">
                No se pudo cargar la vista previa.
              </p>
            )
          ) : null}

        {!currentImagePath && !uploading && !botonesExternos && (
          <div className="text-center pointer-events-none px-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Arrastra y suelta una imagen para cargar o selecciona una opción
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              También puedes copiar la imagen y pegarla con Ctrl / ⌘ + V
            </p>
          </div>
        )}

          {!botonesExternos && (
            <div className="flex gap-2 flex-wrap justify-center">
              {tienePermisoSubir && (
                <>
                  {!currentImagePath && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-blue-500 bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-300 transition-all cursor-pointer hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        Galería
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg border border-blue-500 bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-300 transition-all cursor-pointer hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Camera size={14} />
                        Cámara
                      </button>
                    </>
                  )}

                </>
              )}
            </div>
          )}

          {!currentImagePath && !uploading && botonesExternos && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium text-center">
              Selecciona una imagen desde el pie del modal
            </p>
          )}
        </div>

        {/* Image Editor Modal */}
        {editingFile && (
          <ImageEditorModal
            file={editingFile}
            aspect={aspect}
            aspectLabel={aspectLabel}
            onApply={uploadEditedFile}
            onCancel={() => setEditingFile(null)}
          />
        )}

        {fullscreen &&
          previewUrl &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-150"
              onClick={() => setFullscreen(false)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreen(false);
                }}
                title="Cerrar"
                className="absolute top-4 right-4 flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X size={22} />
              </button>
              <img
                src={previewUrl}
                alt="Vista completa"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[92vh] max-w-[95vw] object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
              />
            </div>,
            document.body,
          )}

        {magnifier.show &&
          previewUrl &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed rounded-full border-4 border-white shadow-2xl pointer-events-none z-[9999]"
              style={{
                width: MAGNIFIER_SIZE,
                height: MAGNIFIER_SIZE,
                left: magnifier.clientX - MAGNIFIER_SIZE / 2,
                top: magnifier.clientY - MAGNIFIER_SIZE / 2,
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: `${(imgRef.current?.width || 300) * ZOOM_LEVEL}px ${(imgRef.current?.height || 400) * ZOOM_LEVEL}px`,
                backgroundPosition: `${magnifier.bgX}% ${magnifier.bgY}%`,
                backgroundRepeat: "no-repeat",
              }}
            />,
            document.body,
          )}
      </>
    );
  },
);

export default ImageUploader;
