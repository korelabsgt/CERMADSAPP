'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from './cropImage';
import { getCroppedFile } from './cropImage';
import { Loader2, RotateCcw, RotateCw, RefreshCw, ArrowLeftRight } from 'lucide-react';

interface ImageEditorModalProps {
  file: File;
  aspectLabel?: string;
  aspect?: number;
  onApply: (croppedFile: File) => void | Promise<void>;
  onCancel: () => void;
}

export default function ImageEditorModal({
  file,
  aspectLabel = 'Libre',
  aspect = 3 / 4,
  onApply,
  onCancel,
}: ImageEditorModalProps) {
  const [currentAspect, setCurrentAspect] = useState(aspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  // Rotación acumulada de cada icono, solo para la animación visual del botón
  const [ccwSpin, setCcwSpin] = useState(0);
  const [cwSpin, setCwSpin] = useState(0);
  const [resetSpin, setResetSpin] = useState(0);

  const imageSrc = URL.createObjectURL(file);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setApplying(true);
    try {
      const cropped = await getCroppedFile(
        imageSrc,
        croppedAreaPixels,
        rotation,
        file.name,
        file.type || 'image/jpeg'
      );
      await onApply(cropped);
    } catch (err) {
      console.error('Error al recortar:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[95vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            Editar imagen
          </h3>
          <span className="text-xs text-gray-500">{aspectLabel}</span>
        </div>

        {/* Crop area */}
        <div className="relative w-full" style={{ height: '350px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 border-t border-gray-200 dark:border-neutral-700">
          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.1, z - 0.2))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-lg font-bold text-gray-700 dark:text-gray-300 active:scale-95"
              title="Alejar"
            >
              −
            </button>
            <input
              type="range"
              min={0.1}
              max={10}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-blue-600 h-2"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(10, z + 0.2))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-lg font-bold text-gray-700 dark:text-gray-300 active:scale-95"
              title="Acercar"
            >
              +
            </button>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[42px] text-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Rotation + Orientation + Reset */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRotation((r) => (r - 90 + 360) % 360);
                setCcwSpin((s) => s - 90);
              }}
              className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors overflow-hidden active:scale-95"
              title="Rotar -90°"
            >
              <RotateCcw
                size={18}
                className="transition-transform duration-300 ease-in-out"
                style={{ transform: `rotate(${ccwSpin}deg)` }}
              />
            </button>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
              {rotation}°
            </span>
            <button
              type="button"
              onClick={() => {
                setRotation((r) => (r + 90) % 360);
                setCwSpin((s) => s + 90);
              }}
              className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors overflow-hidden active:scale-95"
              title="Rotar +90°"
            >
              <RotateCw
                size={18}
                className="transition-transform duration-300 ease-in-out"
                style={{ transform: `rotate(${cwSpin}deg)` }}
              />
            </button>
            {currentAspect !== 1 && (
              <button
                type="button"
                onClick={() => setCurrentAspect((a) => 1 / a)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors overflow-hidden"
                title="Cambiar orientación (Vertical/Horizontal)"
              >
                <ArrowLeftRight
                  size={18}
                  className="text-blue-500 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: currentAspect > 1 ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setZoom(1);
                setCrop({ x: 0, y: 0 });
                setCcwSpin(0);
                setCwSpin(0);
                setResetSpin((s) => s + 360);
              }}
              className="ml-auto p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors overflow-hidden active:scale-95"
              title="Restablecer"
            >
              <RefreshCw
                size={18}
                className="transition-transform duration-500 ease-in-out"
                style={{ transform: `rotate(${resetSpin}deg)` }}
              />
            </button>
          </div>

          <p className="text-[10px] text-center text-gray-400 dark:text-gray-500">Pellizca o usa la rueda del ratón para hacer zoom</p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-neutral-700 flex gap-3 justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={applying}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-gray-400 bg-gray-500/10 text-sm font-bold text-gray-700 dark:text-gray-300 transition-all cursor-pointer hover:bg-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-blue-500 bg-blue-500/10 text-sm font-bold text-blue-600 dark:text-blue-300 transition-all cursor-pointer hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying && <Loader2 size={16} className="animate-spin" />}
            Aplicar y subir
          </button>
        </div>
      </div>
    </div>
  );
}
