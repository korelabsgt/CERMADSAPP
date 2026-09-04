"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  X,
  Search,
  Check,
  Wallet,
  FileCheck2,
  Package,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PreventaSchema,
  PreventaFormValues,
  METODOS_PAGO_PREVENTA,
  ClienteLista,
  ReciboPreventa,
  PreventaMovimiento,
  preventaEstaFacturada,
  receptorDesdeCliente,
  totalDetallesPreventa,
} from "../lib/zod";
import {
  useClientesLista,
  useCrearPreventa,
  useEditarCargaPreventa,
  useProductosPreventa,
} from "../lib/hooks";
import { formatMoney } from "../lib/ui";
import AgregarProductoPreventa from "../components/agregar-producto-preventa";
import {
  ModalCancel,
  ModalFooter,
  ModalSubmit,
} from "@/components/ui/general-modal";

interface CargarSaldoProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCliente?: { id: string; nombre: string } | null;
  editMov?: PreventaMovimiento | null;
}

const today = () => new Date().toISOString().split("T")[0];

const listaEase = [0.4, 0, 0.2, 1] as const;

function isoToFechaDisplay(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatFechaInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function fechaDisplayToIso(display: string): string | null {
  if (display.length !== 10) return null;
  const [d, m, y] = display.split("/");
  if (!d || !m || !y || y.length !== 4) return null;
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const parsed = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== Number(y) ||
    parsed.getMonth() + 1 !== Number(m) ||
    parsed.getDate() !== Number(d)
  ) {
    return null;
  }
  return iso;
}

export default function CargarSaldo({
  isOpen,
  onClose,
  preselectedCliente,
  editMov,
}: CargarSaldoProps) {
  const { data: clientes = [] } = useClientesLista();
  const crearMutation = useCrearPreventa();
  const editarMutation = useEditarCargaPreventa();
  const isEdit = !!editMov;
  const yaFacturada = preventaEstaFacturada(editMov);
  const reducedMotion = useReducedMotion();

  const [clientSearch, setClientSearch] = useState("");
  const [fechaDisplay, setFechaDisplay] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const [productoModalOpen, setProductoModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PreventaFormValues>({
    resolver: zodResolver(PreventaSchema) as never,
    defaultValues: {
      cliente_id: "",
      monto: 0,
      fecha_emision: today(),
      metodo_pago: "Efectivo",
      img_comprobante_url: null,
      facturar: false,
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

  const selectedClientId = watch("cliente_id");
  const facturar = watch("facturar");
  const receptorCF = watch("receptor_cf");
  const detalles = watch("detalles");

  const { data: productos = [], isLoading: cargandoProductos } =
    useProductosPreventa(isOpen && facturar && !isEdit);

  const totalDetalles = useMemo(
    () => totalDetallesPreventa(detalles ?? []),
    [detalles],
  );

  useEffect(() => {
    if (!facturar) return;
    setValue("monto", totalDetalles, { shouldValidate: totalDetalles > 0 });
  }, [facturar, totalDetalles, setValue]);

  const editMovId = editMov?.id;
  const clientePresetId = preselectedCliente?.id;
  const clientePresetNombre = preselectedCliente?.nombre;

  useEffect(() => {
    if (!isOpen) return;
    setProductoModalOpen(false);

    if (editMov) {
      const fechaIso = editMov.fecha_emision ?? editMov.created_at.split("T")[0];
      reset({
        cliente_id: editMov.cliente_id,
        monto: editMov.monto,
        fecha_emision: fechaIso,
        metodo_pago:
          (editMov.metodo_pago as PreventaFormValues["metodo_pago"]) ??
          "Efectivo",
        img_comprobante_url: null,
        facturar: false,
        receptor_cf: true,
        nit_receptor: "",
        nombre_receptor: "",
        correo_receptor: "",
        detalles: [],
      });
      setFechaDisplay(isoToFechaDisplay(fechaIso));
      setClientSearch(clientePresetNombre || "");
      setShowClientList(false);
      return;
    }

    const fechaHoy = today();
    reset({
      cliente_id: clientePresetId || "",
      monto: 0,
      fecha_emision: fechaHoy,
      metodo_pago: "Efectivo",
      img_comprobante_url: null,
      facturar: false,
      receptor_cf: true,
      nit_receptor: "",
      nombre_receptor: "",
      correo_receptor: "",
      detalles: [],
    });
    setFechaDisplay(isoToFechaDisplay(fechaHoy));
    setClientSearch(clientePresetNombre || "");
    setShowClientList(false);
  }, [isOpen, editMovId, clientePresetId, clientePresetNombre, reset]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowClientList(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clienteSeleccionado = useMemo(
    () =>
      (clientes as ClienteLista[]).find((c) => c.id === selectedClientId) ??
      null,
    [clientes, selectedClientId],
  );

  const puedeActivarFactura = !!selectedClientId && !isEdit;

  const aplicarReceptorCliente = (cliente: ClienteLista) => {
    const receptor = receptorDesdeCliente(cliente);
    setValue("receptor_cf", receptor.receptor_cf, { shouldValidate: true });
    setValue("nit_receptor", receptor.nit_receptor);
    setValue("nombre_receptor", receptor.nombre_receptor);
  };

  useEffect(() => {
    if (!selectedClientId) {
      setValue("facturar", false);
      setValue("detalles", []);
      setValue("monto", 0);
      setValue("receptor_cf", true);
      setValue("nit_receptor", "");
      setValue("nombre_receptor", "");
      return;
    }
    if (clienteSeleccionado) aplicarReceptorCliente(clienteSeleccionado);
  }, [selectedClientId, clienteSeleccionado, setValue]);

  const filteredClients = useMemo(() => {
    if (clientSearch.length < 2) return [];
    const search = clientSearch.toLowerCase();
    return (clientes as ClienteLista[])
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(search) || c.nit.includes(search),
      )
      .slice(0, 8);
  }, [clientes, clientSearch]);

  const aplicarReceptorCF = (cf: boolean) => {
    setValue("receptor_cf", cf, { shouldValidate: true });
    if (cf) {
      setValue("nit_receptor", "");
      setValue("nombre_receptor", "");
      return;
    }
    if (clienteSeleccionado) aplicarReceptorCliente(clienteSeleccionado);
  };

  const activarFacturar = (activar: boolean) => {
    if (activar && !puedeActivarFactura) return;
    setValue("facturar", activar, { shouldValidate: true });
    if (!activar) {
      setValue("detalles", []);
      setValue("monto", 0);
      return;
    }
    if (clienteSeleccionado) aplicarReceptorCliente(clienteSeleccionado);
  };

  const seleccionarCliente = (cliente: ClienteLista) => {
    setValue("cliente_id", cliente.id, { shouldValidate: true });
    setClientSearch(cliente.nombre);
    setShowClientList(false);
    aplicarReceptorCliente(cliente);
  };

  const onSubmit = async (data: PreventaFormValues) => {
    if (isEdit && editMov) {
      if (yaFacturada) return;
      const res = await editarMutation.mutateAsync({
        movimiento_id: editMov.id,
        monto: data.monto,
        fecha_emision: data.fecha_emision,
        metodo_pago: data.metodo_pago,
      });
      if ("error" in res) return;
      onClose();
      return;
    }

    const res = await crearMutation.mutateAsync({
      ...data,
      img_comprobante_url: null,
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

  if (!isOpen) return null;

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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex flex-col bg-zinc-100 text-foreground dark:bg-zinc-900">
        <div className="flex h-dvh w-full min-h-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between bg-zinc-100 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:bg-zinc-800 md:px-8 lg:px-12">
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-2 text-azul-trifinio dark:bg-sky-950">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight md:text-lg">
                    {isEdit ? "Editar anticipo" : "Cargar saldo"}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Anticipo / Preventa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-azul-trifinio hover:bg-sky-100 dark:hover:bg-sky-950 rounded-full transition-colors cursor-pointer"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-100 px-5 py-5 dark:bg-zinc-900 md:px-8 md:py-6 lg:px-12 [-webkit-overflow-scrolling:touch]"
          >
            {yaFacturada && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-sky-100 px-4 py-3 text-azul-trifinio dark:bg-sky-950 dark:text-sky-300">
                <FileCheck2 className="mt-0.5 size-4 shrink-0" />
                <p className="text-xs font-bold">
                  Este anticipo ya tiene factura electrónica certificada
                  {editMov?.dte?.serie
                    ? ` (${editMov.dte.serie}-${editMov.dte.numero})`
                    : ""}
                  . No puede editarse ni volver a certificarse; solo puede
                  generarse el recibo.
                </p>
              </div>
            )}

            <div
              className={cn(
                "flex flex-col gap-6",
                !isEdit && "md:flex-row md:items-start md:gap-8 lg:gap-12",
              )}
            >
              <div
                className={cn(
                  "min-w-0 space-y-4",
                  !isEdit ? "w-full md:w-1/2" : "w-full max-w-xl",
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Datos del anticipo
                </p>

                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Cliente
                  </label>
                  {isEdit ? (
                    <p className="text-sm font-bold text-foreground">
                      {preselectedCliente?.nombre ?? "—"}
                    </p>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientList(e.target.value.length >= 2);
                            if (!e.target.value) setValue("cliente_id", "");
                          }}
                          onFocus={() =>
                            clientSearch.length >= 2 && setShowClientList(true)
                          }
                          placeholder="Empieza a escribir para ver los clientes"
                          autoComplete="off"
                          className={cn(inputClass(!!errors.cliente_id), "pl-9")}
                        />
                        {showClientList && filteredClients.length > 0 && (
                          <div className="absolute top-full left-0 z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
                            {filteredClients.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => seleccionarCliente(c)}
                                className="flex w-full flex-col border-b px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-muted"
                              >
                                <span className="flex items-center justify-between font-bold">
                                  {c.nombre}
                                  {selectedClientId === c.id && (
                                    <Check className="size-4 text-emerald-500" />
                                  )}
                                </span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  NIT: {c.nit}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {clienteSeleccionado && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          NIT del cliente:{" "}
                          <span className="font-mono text-foreground">
                            {clienteSeleccionado.nit}
                          </span>
                        </p>
                      )}
                      {errorText(errors.cliente_id?.message)}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fecha de emisión
                    </label>
                    <Controller
                      name="fecha_emision"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="DD/MM/AAAA"
                          value={fechaDisplay}
                          onChange={(e) => {
                            const formatted = formatFechaInput(e.target.value);
                            setFechaDisplay(formatted);
                            const iso = fechaDisplayToIso(formatted);
                            field.onChange(iso ?? "");
                          }}
                          className={cn(
                            inputClass(!!errors.fecha_emision),
                            "min-w-0 max-w-full tabular-nums",
                          )}
                        />
                      )}
                    />
                    {errorText(errors.fecha_emision?.message)}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Método de pago
                    </label>
                    <Controller
                      name="metodo_pago"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value as PreventaFormValues["metodo_pago"],
                            )
                          }
                          className={cn(inputClass(false), "cursor-pointer")}
                        >
                          {METODOS_PAGO_PREVENTA.map((metodo) => (
                            <option key={metodo} value={metodo}>
                              {metodo}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Monto
                  </label>
                  <Controller
                    name="monto"
                    control={control}
                    render={({ field }) => (
                      <div className="relative min-w-0">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                          Q
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          readOnly={facturar}
                          value={
                            facturar
                              ? formatMoney(totalDetalles)
                              : field.value === 0
                                ? ""
                                : String(field.value)
                          }
                          onChange={(e) => {
                            if (facturar) return;
                            const raw = e.target.value.replace(/[^\d.]/g, "");
                            const parts = raw.split(".");
                            const normalized =
                              parts.length > 2
                                ? `${parts[0]}.${parts.slice(1).join("")}`
                                : raw;
                            field.onChange(normalized);
                          }}
                          onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key))
                              e.preventDefault();
                          }}
                          className={cn(
                            inputClass(!!errors.monto),
                            "pl-8",
                            facturar && "cursor-not-allowed opacity-80",
                          )}
                        />
                      </div>
                    )}
                  />
                  {facturar && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Calculado con el detalle de la factura
                    </span>
                  )}
                  {errorText(errors.monto?.message)}
                </div>
              </div>

              {!isEdit && (
                <div className="min-w-0 w-full space-y-4 md:w-1/2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Facturación electrónica
                  </p>

                  <div
                    className={cn(
                      "space-y-4 rounded-2xl border border-zinc-300 bg-zinc-200/40 p-4 dark:border-zinc-700 dark:bg-zinc-800/60 md:p-5",
                      !puedeActivarFactura && "opacity-80",
                    )}
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={facturar}
                      aria-disabled={!puedeActivarFactura}
                      disabled={!puedeActivarFactura}
                      onClick={() => activarFacturar(!facturar)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 text-left",
                        puedeActivarFactura
                          ? "cursor-pointer"
                          : "cursor-not-allowed",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-foreground">
                          <FileCheck2 className="size-4 text-azul-trifinio" />
                          Certificar factura electrónica
                        </span>
                        <span className="mt-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                          {puedeActivarFactura
                            ? "Se factura como venta y el monto queda como saldo a favor"
                            : "Seleccione un cliente para habilitar la facturación"}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                          facturar
                            ? "bg-sky-600 dark:bg-sky-500"
                            : "bg-zinc-400 dark:bg-zinc-600",
                          !puedeActivarFactura && "opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block size-5 rounded-full bg-white transition-transform",
                            facturar
                              ? "translate-x-[1.375rem]"
                              : "translate-x-0.5",
                          )}
                        />
                      </span>
                    </button>

                    {facturar && (
                      <div className="space-y-4 border-t border-zinc-300 pt-4 dark:border-zinc-600">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Detalle de la factura
                            </p>
                            {!productoModalOpen && (
                              <button
                                type="button"
                                onClick={() => setProductoModalOpen(true)}
                                disabled={cargandoProductos}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-100 px-3 text-xs font-bold text-azul-trifinio transition-colors hover:bg-sky-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-950 dark:hover:bg-sky-900"
                              >
                                {cargandoProductos ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Plus className="size-4" />
                                )}
                                Agregar producto
                              </button>
                            )}
                          </div>

                          <AnimatePresence mode="popLayout" initial={false}>
                            {productoModalOpen && (
                              <AgregarProductoPreventa
                                key="agregar-producto"
                                onClose={() => setProductoModalOpen(false)}
                                productos={productos}
                                onAdd={(detalle) => append(detalle)}
                              />
                            )}
                          </AnimatePresence>

                          <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                            <div className="hidden grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800 sm:grid">
                              <span className="col-span-5">Producto</span>
                              <span className="col-span-2 text-center">
                                Cant.
                              </span>
                              <span className="col-span-2 text-right">
                                Precio
                              </span>
                              <span className="col-span-2 text-right">
                                Subtotal
                              </span>
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
                                          : {
                                              duration: 0.28,
                                              ease: listaEase,
                                            }
                                      }
                                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                                    >
                                      <div className="flex items-start justify-between gap-3 p-3 sm:hidden">
                                        <div className="min-w-0 space-y-1">
                                          <p className="truncate text-sm font-bold text-foreground">
                                            {detalle?.nombre_producto}
                                          </p>
                                          <p className="text-xs text-muted-foreground tabular-nums">
                                            {detalle?.cantidad}{" "}
                                            {detalle?.medida || "UNI"} × Q
                                            {formatMoney(
                                              detalle?.precio_unitario,
                                            )}
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
                                          {detalle?.cantidad}{" "}
                                          {detalle?.medida || "UNI"}
                                        </span>
                                        <span className="col-span-2 text-right tabular-nums text-muted-foreground">
                                          Q
                                          {formatMoney(
                                            detalle?.precio_unitario,
                                          )}
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
                              <span className="text-xl font-black tabular-nums text-foreground">
                                Q{formatMoney(totalDetalles)}
                              </span>
                            </div>
                          </div>
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
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                        field.onChange(
                                          e.target.value.toUpperCase(),
                                        )
                                      }
                                      className={inputClass(
                                        !!errors.nit_receptor,
                                      )}
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
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                      className={inputClass(
                                        !!errors.nombre_receptor,
                                      )}
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
                          La factura será certificada ante la SAT a través de
                          INFILE S.A.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>

          <ModalFooter className="border-t border-zinc-200 px-5 dark:border-zinc-700 md:px-8 lg:px-12 sm:rounded-b-none">
            <div className="flex w-full items-center justify-between gap-3">
              <ModalCancel onClick={onClose} />
              <ModalSubmit
                disabled={
                  yaFacturada ||
                  isSubmitting ||
                  crearMutation.isPending ||
                  editarMutation.isPending
                }
                onClick={handleSubmit(onSubmit)}
              />
            </div>
          </ModalFooter>
        </div>
      </div>

    </>,
    document.body,
  );
}
