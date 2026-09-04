"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  X,
  FileCheck2,
  Package,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CertificarPreventaSchema,
  CertificarPreventaValues,
  ReciboPreventa,
  PreventaMovimiento,
  preventaEstaFacturada,
  receptorDesdeCliente,
  totalDetallesPreventa,
  formatReciboMovimientoLabel,
} from "../lib/zod";
import { useCertificarPreventa, useProductosPreventa } from "../lib/hooks";
import { formatFechaHora, formatMoney } from "../lib/ui";
import AgregarProductoPreventa from "../components/agregar-producto-preventa";
import {
  ModalFooter,
} from "@/components/ui/general-modal";

interface CertificarFacturaProps {
  isOpen: boolean;
  onClose: () => void;
  mov: PreventaMovimiento | null;
  cliente: { id: string; nombre: string; nit: string } | null;
}

const listaEase = [0.4, 0, 0.2, 1] as const;

export default function CertificarFactura({
  isOpen,
  onClose,
  mov,
  cliente,
}: CertificarFacturaProps) {
  const certificarMutation = useCertificarPreventa();
  const reducedMotion = useReducedMotion();
  const yaFacturada = preventaEstaFacturada(mov);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CertificarPreventaValues>({
    resolver: zodResolver(CertificarPreventaSchema) as never,
    defaultValues: {
      movimiento_id: "",
      monto: 0,
      receptor_cf: true,
      nit_receptor: "",
      nombre_receptor: "",
      correo_receptor: "",
      detalles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const receptorCF = watch("receptor_cf");
  const detalles = watch("detalles");
  const nitReceptor = watch("nit_receptor");
  const nombreReceptor = watch("nombre_receptor");
  const correoReceptor = watch("correo_receptor");
  const { data: productos = [] } = useProductosPreventa(isOpen);

  const totalDetalles = useMemo(
    () => totalDetallesPreventa(detalles ?? []),
    [detalles],
  );

  const diferencia = useMemo(() => {
    if (!mov) return 0;
    return Number((totalDetalles - mov.monto).toFixed(2));
  }, [totalDetalles, mov]);

  const montosCoinciden = useMemo(() => {
    if (!mov || !detalles || detalles.length === 0) return false;
    return Math.abs(diferencia) <= 0.01;
  }, [mov, detalles, diferencia]);

  const montoCoincideClass = montosCoinciden
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-foreground";

  const puedeCertificar = useMemo(() => {
    if (yaFacturada || !mov) return false;
    if (!detalles || detalles.length === 0) return false;
    if (Math.abs(diferencia) > 0.01) return false;
    if (!receptorCF) {
      if (!nitReceptor?.trim() || !nombreReceptor?.trim()) return false;
    }
    const correo = correoReceptor?.trim();
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return false;
    return true;
  }, [
    yaFacturada,
    mov,
    detalles,
    diferencia,
    receptorCF,
    nitReceptor,
    nombreReceptor,
    correoReceptor,
  ]);

  const movId = mov?.id;
  const clienteId = cliente?.id;
  const clienteNit = cliente?.nit;
  const clienteNombre = cliente?.nombre;
  const movMonto = mov?.monto;

  useEffect(() => {
    if (!isOpen || !movId || !clienteId || movMonto == null || !clienteNombre) {
      return;
    }
    const receptor = receptorDesdeCliente({
      nombre: clienteNombre,
      nit: clienteNit ?? "",
    });
    reset({
      movimiento_id: movId,
      monto: movMonto,
      receptor_cf: receptor.receptor_cf,
      nit_receptor: receptor.nit_receptor,
      nombre_receptor: receptor.nombre_receptor,
      correo_receptor: "",
      detalles: [],
    });
  }, [
    isOpen,
    movId,
    movMonto,
    clienteId,
    clienteNombre,
    clienteNit,
    reset,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const aplicarReceptorCF = (cf: boolean) => {
    setValue("receptor_cf", cf, { shouldValidate: true });
    if (cf) {
      setValue("nit_receptor", "");
      setValue("nombre_receptor", "");
      return;
    }
    if (cliente) {
      const receptor = receptorDesdeCliente(cliente);
      setValue("nit_receptor", receptor.nit_receptor);
      setValue("nombre_receptor", receptor.nombre_receptor);
    }
  };

  const onSubmit = async (data: CertificarPreventaValues) => {
    if (!mov || yaFacturada) return;
    const res = await certificarMutation.mutateAsync({
      ...data,
      movimiento_id: mov.id,
      monto: mov.monto,
    });
    if ("error" in res) return;

    const recibo: ReciboPreventa = res.recibo;
    onClose();
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent<ReciboPreventa>("imprimir-preventa", { detail: recibo }),
      );
    }, 400);
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-11 px-3 rounded-xl border-2 bg-transparent text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 transition-all",
      hasError ? "border-red-500" : "border-celeste-trifinio",
    );

  const errorText = (message?: string) =>
    message ? (
      <span className="text-[10px] font-bold uppercase text-red-500">
        {message}
      </span>
    ) : null;

  const detalleErrorMessage =
    (typeof errors.detalles?.message === "string"
      ? errors.detalles.message
      : undefined) ?? errors.detalles?.root?.message;

  if (!isOpen || !mov || !cliente) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex flex-col bg-zinc-100 text-foreground dark:bg-zinc-900">
        <div className="flex h-dvh w-full min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between bg-zinc-100 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] dark:bg-zinc-800">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-sky-100 p-1.5 text-azul-trifinio dark:bg-sky-950">
                  <FileCheck2 className="size-4" />
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-3">
                  <h2 className="text-sm font-black uppercase tracking-tight">
                    Certificar factura
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Anticipo #{formatReciboMovimientoLabel(mov)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-full p-1.5 text-azul-trifinio transition-colors hover:bg-sky-100 dark:hover:bg-sky-950"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-100 px-2 dark:bg-zinc-900 [-webkit-overflow-scrolling:touch]"
          >
            {yaFacturada && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-sky-100 px-4 py-3 text-azul-trifinio dark:bg-sky-950 dark:text-sky-300">
                <FileCheck2 className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs font-bold">
                  Este anticipo ya tiene factura electrónica certificada
                  {mov.dte?.serie ? ` (${mov.dte.serie}-${mov.dte.numero})` : ""}
                  . No puede volver a certificarse.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 md:flex-row md:items-start">
              <div className="min-w-0 w-full space-y-4 md:w-[40%] md:shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Datos del anticipo
                </p>

                <div className="space-y-2.5 rounded-2xl border border-zinc-300 bg-zinc-200/40 p-2 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Cliente
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {cliente.nombre}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      NIT
                    </p>
                    <p className="font-mono text-sm font-bold text-foreground">
                      {cliente.nit}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fecha
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {formatFechaHora(mov.created_at)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Método de pago
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {mov.metodo_pago ?? "Efectivo"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Monto del anticipo
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-black tabular-nums",
                        montoCoincideClass,
                      )}
                    >
                      Q{formatMoney(mov.monto)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      El total de la factura debe coincidir con este monto
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 w-full space-y-4 md:w-[60%]">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Datos de la venta
                </p>

                <div className="space-y-4 rounded-2xl border border-zinc-300 bg-zinc-200/40 p-2 dark:border-zinc-700 dark:bg-zinc-800/60">
                  <div className="space-y-2">
                    {!yaFacturada && (
                      <AgregarProductoPreventa
                        productos={productos}
                        onAdd={(detalle) => append(detalle)}
                      />
                    )}

                    <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                      <div className="hidden grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800 sm:grid">
                        <span className="col-span-5">Producto</span>
                        <span className="col-span-2 text-center">Cant.</span>
                        <span className="col-span-2 text-right">Precio</span>
                        <span className="col-span-2 text-right">Subtotal</span>
                        <span className="col-span-1" />
                      </div>

                      {fields.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                          <Package className="size-7 opacity-50" />
                          <p className="text-xs font-bold uppercase tracking-widest">
                            Sin productos
                          </p>
                        </div>
                      ) : (
                        <AnimatePresence mode="popLayout" initial={false}>
                          {fields.map((field, index) => {
                            const detalle = detalles?.[index];
                            return (
                              <motion.div
                                key={field.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                                transition={
                                  reducedMotion
                                    ? { duration: 0 }
                                    : { duration: 0.28, ease: listaEase }
                                }
                                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                              >
                                <div className="flex items-start justify-between gap-3 p-3 sm:hidden">
                                  <div className="min-w-0 space-y-1">
                                    <p className="truncate text-sm font-bold text-foreground">
                                      {detalle?.nombre_producto}
                                    </p>
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                      {detalle?.cantidad}{" "}
                                      {detalle?.medida || "UNI"} × Q
                                      {formatMoney(detalle?.precio_unitario)}
                                    </p>
                                    <p className="text-sm font-black tabular-nums text-foreground">
                                      Q{formatMoney(detalle?.subtotal)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-red-100 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-200 cursor-pointer dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>

                                <div className="hidden grid-cols-12 items-center gap-2 px-4 py-2.5 text-sm sm:grid">
                                  <span className="col-span-5 truncate font-semibold text-foreground">
                                    {detalle?.nombre_producto}
                                  </span>
                                  <span className="col-span-2 text-center tabular-nums text-muted-foreground">
                                    {detalle?.cantidad} {detalle?.medida || "UNI"}
                                  </span>
                                  <span className="col-span-2 text-right tabular-nums text-muted-foreground">
                                    Q{formatMoney(detalle?.precio_unitario)}
                                  </span>
                                  <span className="col-span-2 text-right font-bold tabular-nums text-foreground">
                                    Q{formatMoney(detalle?.subtotal)}
                                  </span>
                                  <span className="col-span-1 text-right">
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="inline-flex size-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-100 cursor-pointer dark:text-red-400 dark:hover:bg-red-950"
                                      aria-label="Quitar producto"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      )}

                      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Total a facturar
                        </span>
                        <span
                          className={cn(
                            "text-xl font-black tabular-nums",
                            montoCoincideClass,
                          )}
                        >
                          Q{formatMoney(totalDetalles)}
                        </span>
                      </div>
                    </div>

                    {fields.length > 0 && Math.abs(diferencia) > 0.01 && (
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          diferencia < 0 ? "text-amber-600" : "text-red-500",
                        )}
                      >
                        {diferencia < 0
                          ? `Faltan Q${formatMoney(Math.abs(diferencia))} para igualar el anticipo`
                          : `Sobran Q${formatMoney(diferencia)} respecto al anticipo`}
                      </p>
                    )}
                    {errorText(detalleErrorMessage)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Facturar a
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            receptorCF
                              ? "text-azul-trifinio dark:text-sky-400"
                              : "text-muted-foreground",
                          )}
                        >
                          C/F
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!receptorCF}
                          onClick={() => aplicarReceptorCF(!receptorCF)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer",
                            !receptorCF
                              ? "bg-sky-600 dark:bg-sky-500"
                              : "bg-zinc-400 dark:bg-zinc-600",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block size-4 rounded-full bg-white transition-transform",
                              !receptorCF
                                ? "translate-x-[1.125rem]"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            !receptorCF
                              ? "text-azul-trifinio dark:text-sky-400"
                              : "text-muted-foreground",
                          )}
                        >
                          NIT
                        </span>
                      </div>
                    </div>

                    {receptorCF ? (
                      <p className="rounded-xl bg-sky-100 px-4 py-2.5 text-center text-xs font-bold uppercase text-azul-trifinio dark:bg-sky-950 dark:text-sky-300">
                        Generando a consumidor final
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)]">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            NIT del receptor
                          </label>
                          <Controller
                            name="nit_receptor"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="text"
                                autoComplete="off"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                className={inputClass(!!errors.nit_receptor)}
                              />
                            )}
                          />
                          {errorText(errors.nit_receptor?.message)}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Nombre del receptor
                          </label>
                          <Controller
                            name="nombre_receptor"
                            control={control}
                            render={({ field }) => (
                              <input
                                type="text"
                                autoComplete="off"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                className={inputClass(!!errors.nombre_receptor)}
                              />
                            )}
                          />
                          {errorText(errors.nombre_receptor?.message)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Correo electrónico (opcional)
                      </label>
                      <Controller
                        name="correo_receptor"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="email"
                            autoComplete="off"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            className={inputClass(!!errors.correo_receptor)}
                          />
                        )}
                      />
                      {errorText(errors.correo_receptor?.message)}
                    </div>
                  </div>

                  <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                    La factura será certificada ante la SAT a través de INFILE
                    S.A.
                  </p>
                </div>
              </div>
            </div>
          </form>

          <ModalFooter className="border-t border-zinc-200 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-zinc-700 sm:rounded-b-none">
            <div className="flex w-full items-center gap-2 md:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-zinc-200 px-4 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-300 cursor-pointer sm:flex-1 md:flex-none dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  !puedeCertificar ||
                  isSubmitting ||
                  certificarMutation.isPending
                }
                onClick={handleSubmit(onSubmit)}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-sky-200 px-4 text-xs font-bold text-sky-900 transition-colors hover:bg-sky-300 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 md:flex-none dark:bg-sky-800/70 dark:text-sky-50 dark:hover:bg-sky-700/80"
              >
                Certificar DTE
              </button>
            </div>
          </ModalFooter>
        </div>
      </div>

    </>,
    document.body,
  );
}
