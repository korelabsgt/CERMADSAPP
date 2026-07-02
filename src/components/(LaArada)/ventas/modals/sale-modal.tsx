"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  VentaSchema,
  VentaFormValues,
  ClienteCatalogo,
  PagoVentaValues,
} from "../lib/zod";
import {
  useCreateVenta,
  useUpdateVenta,
  useUpdateVentaPago,
  useCatalogos,
} from "../lib/hooks";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Check,
  Package,
  Banknote,
  ArrowRightLeft,
} from "lucide-react";
import ClientModal from "../../clientes/modals/client-modal";
import AddProductModal from "./add-product-modal";
import ImageUploader from "@/components/(base)/imgs/ImageUploader";
import { cn } from "@/lib/utils";
import { updateEstadoVenta } from "../lib/actions";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaToEdit?: any;
  effectiveRole?: string;
  onCreated?: (ventaId: string) => void;
}

const BUCKET_COMPROBANTES = "ventas-comprobantes";

const toDatetimeLocalValue = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function SaleModal({
  isOpen,
  onClose,
  ventaToEdit,
  effectiveRole,
  onCreated,
}: SaleModalProps) {
  const queryClient = useQueryClient();
  const { data: catalogos, refetch } = useCatalogos();
  const createMutation = useCreateVenta();
  const updateMutation = useUpdateVenta();
  const updatePagoMutation = useUpdateVentaPago();

  const [modals, setModals] = useState({ client: false, product: false });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(VentaSchema) as any,
    defaultValues: {
      cliente_id: "",
      tipo_venta: "Contado",
      tipo_comprobante: "Recibo",
      metodo_pago: "Efectivo",
      numero_boleta: "",
      banco: "",
      fecha_transferencia: "",
      img_comprobante_url: null,
      fecha_entrega: new Date().toISOString().split("T")[0],
      total: 0,
      detalles: [],
      observaciones: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const detalles = watch("detalles");
  const selectedClientId = watch("cliente_id");
  const tipoVenta = watch("tipo_venta");
  const metodoPago = watch("metodo_pago");
  const imgComprobante = watch("img_comprobante_url");

  const isAnulado =
    String(ventaToEdit?.estado || "")
      .trim()
      .toLowerCase() === "anulado";

  const tieneFelCertificada = useMemo(
    () =>
      ventaToEdit?.dte_documentos?.some(
        (d: { estado?: string }) => d.estado === "certificado",
      ) ?? false,
    [ventaToEdit],
  );

  const soloPagoEditable = useMemo(() => {
    if (!ventaToEdit || isAnulado) return false;
    const estado = String(ventaToEdit.estado || "Pendiente")
      .trim()
      .toLowerCase();
    if (tieneFelCertificada) return true;
    if (estado === "entregado" && effectiveRole !== "super") return true;
    return false;
  }, [ventaToEdit, isAnulado, tieneFelCertificada, effectiveRole]);

  const isReadOnly = useMemo(() => {
    if (!ventaToEdit) return false;
    if (isAnulado) return true;
    if (soloPagoEditable) return false;
    const estado = String(ventaToEdit.estado || "Pendiente")
      .trim()
      .toLowerCase();
    if (effectiveRole === "super") return false;
    return estado === "entregado";
  }, [ventaToEdit, isAnulado, soloPagoEditable, effectiveRole]);

  const camposDeshabilitados = isAnulado || isReadOnly || soloPagoEditable;
  const pagoDeshabilitado = isAnulado || (isReadOnly && !soloPagoEditable);

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
    if (ventaToEdit) {
      reset({
        cliente_id: ventaToEdit.cliente_id,
        tipo_venta: ventaToEdit.tipo_venta || "Contado",
        tipo_comprobante: ventaToEdit.tipo_comprobante || "Recibo",
        metodo_pago: ventaToEdit.metodo_pago || "Efectivo",
        numero_boleta: ventaToEdit.numero_boleta || "",
        banco: ventaToEdit.banco || "",
        fecha_transferencia: ventaToEdit.fecha_transferencia
          ? toDatetimeLocalValue(ventaToEdit.fecha_transferencia)
          : "",
        img_comprobante_url: ventaToEdit.img_comprobante_url || null,
        fecha_entrega: ventaToEdit.fecha_entrega
          ? new Date(ventaToEdit.fecha_entrega).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        total: ventaToEdit.total || 0,
        observaciones: ventaToEdit.observaciones || "",
        detalles:
          ventaToEdit.ven_detalle?.map((d: any) => ({
            producto_id: d.producto_id,
            nombre_producto: d.inv_productos?.nombre || "Producto",
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_aplicado) || 0,
            subtotal: Number(d.subtotal) || 0,
          })) || [],
      });
      setClientSearch(ventaToEdit.ven_clientes?.nombre || "");
    } else {
      reset({
        cliente_id: "",
        tipo_venta: "Contado",
        tipo_comprobante: "Recibo",
        metodo_pago: "Efectivo",
        numero_boleta: "",
        banco: "",
        fecha_transferencia: "",
        img_comprobante_url: null,
        fecha_entrega: new Date().toISOString().split("T")[0],
        total: 0,
        observaciones: "",
        detalles: [],
      });
      setClientSearch("");
    }
  }, [ventaToEdit, reset]);

  useEffect(() => {
    setValue(
      "total",
      detalles.reduce((acc, curr) => acc + (curr.subtotal || 0), 0),
    );
  }, [detalles, setValue]);

  const filteredClients = useMemo(() => {
    if (!catalogos?.clientes || clientSearch.length < 2) return [];
    const search = clientSearch.toLowerCase();
    return catalogos.clientes.filter(
      (c: ClienteCatalogo) =>
        c.nombre.toLowerCase().includes(search) || c.nit.includes(search),
    );
  }, [catalogos, clientSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowClientList(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Guarda la forma de pago (método, campos e imagen) en la venta existente.
  // Se usa para auto-guardar al cargar/eliminar imagen o cambiar de método,
  // y también desde el botón "GUARDAR PAGO".
  const guardarPago = async (overrides?: Partial<PagoVentaValues>) => {
    if (!ventaToEdit?.id) return undefined;
    const data: PagoVentaValues = {
      metodo_pago: getValues("metodo_pago"),
      numero_boleta: getValues("numero_boleta"),
      banco: getValues("banco"),
      fecha_transferencia: getValues("fecha_transferencia"),
      img_comprobante_url: getValues("img_comprobante_url"),
      ...overrides,
    };
    return updatePagoMutation.mutateAsync({ id: ventaToEdit.id, data });
  };

  const seleccionarEfectivo = async () => {
    const imagenActual = getValues("img_comprobante_url");
    const tieneComprobante = !!imagenActual;
    const tieneDatos =
      tieneComprobante ||
      !!getValues("numero_boleta") ||
      !!getValues("banco") ||
      !!getValues("fecha_transferencia");

    if (metodoPago === "Transferencia" && tieneDatos) {
      const isDark = document.documentElement.classList.contains("dark");
      const result = await Swal.fire({
        title: "¿Cambiar a Efectivo?",
        text: tieneComprobante
          ? "Se eliminará el comprobante y los datos de la transferencia."
          : "Se borrarán los datos de la transferencia.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
        background: isDark ? "#1c1c1e" : undefined,
        color: isDark ? "#f5f5f5" : undefined,
      });
      if (!result.isConfirmed) return;
    }

    if (imagenActual) {
      const supabase = createClient();
      await supabase.storage.from(BUCKET_COMPROBANTES).remove([imagenActual]);
    }

    setValue("metodo_pago", "Efectivo");
    setValue("numero_boleta", "");
    setValue("banco", "");
    setValue("fecha_transferencia", "");
    setValue("img_comprobante_url", null);
    await guardarPago({
      metodo_pago: "Efectivo",
      numero_boleta: "",
      banco: "",
      fecha_transferencia: "",
      img_comprobante_url: null,
    });
  };

  const onSubmit = async (data: any) => {
    if (isAnulado) return;

    if (soloPagoEditable && ventaToEdit) {
      const res = await guardarPago({
        metodo_pago: data.metodo_pago,
        numero_boleta: data.numero_boleta,
        banco: data.banco,
        fecha_transferencia: data.fecha_transferencia,
        img_comprobante_url: data.img_comprobante_url,
      });
      if (res?.success) onClose();
      return;
    }

    if (isReadOnly) return;
    const res = ventaToEdit
      ? await updateMutation.mutateAsync({ id: ventaToEdit.id, data })
      : await createMutation.mutateAsync(data);
    if (res?.success) {
      reset();
      setClientSearch("");
      onClose();
      const nuevaVentaId = (res as { ventaId?: string }).ventaId;
      if (!ventaToEdit && nuevaVentaId && onCreated) {
        onCreated(nuevaVentaId);
      }
    }
  };

  const handleCancelOrder = async () => {
    if (!ventaToEdit?.id || camposDeshabilitados || soloPagoEditable) return;

    const isDark = document.documentElement.classList.contains("dark");

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se anulará la venta y se devolverá el stock.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, anular venta",
      cancelButtonText: "No, volver",
      background: isDark ? "#1c1c1e" : undefined,
      color: isDark ? "#f5f5f5" : undefined,
    });

    if (result.isConfirmed) {
      const res = await updateEstadoVenta(ventaToEdit.id, "Anulado", "");
      if (res?.success) {
        await Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Venta anulada correctamente",
          showConfirmButton: false,
          timer: 1500,
          background: isDark ? "#1c1c1e" : undefined,
          color: isDark ? "#f5f5f5" : undefined,
        });
        onClose();
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
      }
    }
  };

  const formatCantidad = (cantidad: number) =>
    Number.isInteger(cantidad) ? cantidad : cantidad.toFixed(1);

  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4 lg:items-stretch lg:justify-stretch lg:p-0 text-foreground">
        <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-none bg-background shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-xl lg:h-full lg:max-h-none lg:max-w-none lg:rounded-none lg:shadow-none">
          <Header
            title={
              ventaToEdit
                ? isAnulado
                  ? "Detalle de Venta"
                  : soloPagoEditable
                    ? "Forma de Pago"
                    : isReadOnly
                      ? "Detalle de Venta"
                      : "Editar Venta"
                : "Nueva Venta"
            }
            onClose={onClose}
            estado={ventaToEdit?.estado}
          />

          {soloPagoEditable && (
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-4">
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-800 dark:text-sky-300">
                {tieneFelCertificada
                  ? "Esta venta tiene factura electrónica (DTE). Solo puede modificar la forma de pago, si quiere cambiarla, antes debes anular la factura electrónica."
                  : "Venta entregada. Solo puede modificar la forma de pago."}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:px-8 lg:py-6 [-webkit-overflow-scrolling:touch]">
            <form
              id="venta-form"
              onSubmit={handleSubmit(onSubmit, (err) =>
                console.error("Validation Errors:", err),
              )}
              onDragOver={(e) => e.preventDefault()}
              className="mx-auto w-full max-w-5xl space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div
                  className="md:col-span-6 space-y-1.5 relative"
                  ref={dropdownRef}
                >
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Cliente
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Nit o nombre del cliente..."
                        disabled={camposDeshabilitados}
                        className={cn(
                          "w-full h-10 pl-9 pr-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed",
                          errors.cliente_id && "border-red-500",
                        )}
                        value={clientSearch}
                        onChange={(e) => {
                          if (camposDeshabilitados) return;
                          setClientSearch(e.target.value);
                          setShowClientList(e.target.value.length >= 3);
                          if (!e.target.value) setValue("cliente_id", "");
                        }}
                        onFocus={() =>
                          !camposDeshabilitados &&
                          clientSearch.length >= 3 &&
                          setShowClientList(true)
                        }
                        autoComplete="off"
                      />
                      {showClientList && !camposDeshabilitados && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-background border rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                          {filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setValue("cliente_id", c.id);
                                setClientSearch(c.nombre);
                                setShowClientList(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex flex-col border-b last:border-0 transition-colors"
                            >
                              <span className="font-bold flex items-center justify-between">
                                {c.nombre}{" "}
                                {selectedClientId === c.id && (
                                  <Check className="size-4 text-green-500" />
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                NIT: {c.nit}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!camposDeshabilitados && (
                      <button
                        type="button"
                        onClick={() => setModals({ ...modals, client: true })}
                        className="size-10 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
                      >
                        <Plus className="size-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                    Tipo Venta
                  </label>
                  <select
                    {...register("tipo_venta")}
                    disabled={camposDeshabilitados}
                    className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label
                    className={cn(
                      "text-[10px] md:text-xs font-bold uppercase truncate",
                      errors.fecha_entrega
                        ? "text-red-500"
                        : "text-muted-foreground",
                    )}
                  >
                    Entrega
                  </label>
                  <input
                    type="date"
                    min={today}
                    {...register("fecha_entrega", {
                      validate: (value) =>
                        (value || "") >= today || "Fecha pasada",
                    })}
                    disabled={camposDeshabilitados}
                    className={cn(
                      "w-full h-10 px-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                      errors.fecha_entrega
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-border focus:ring-primary/20",
                    )}
                  />
                  {errors.fecha_entrega && (
                    <p className="text-[10px] font-bold text-red-500 uppercase animate-in fade-in slide-in-from-top-1">
                      No se permiten fechas pasadas
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end border-b pb-2">
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                    Detalle de la Venta
                  </h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setModals({ ...modals, product: true })}
                      className="text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" /> AGREGAR PRODUCTO
                    </button>
                  )}
                </div>

                <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                  <div className="hidden md:grid grid-cols-12 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase py-2 px-4 border-b">
                    <div className="col-span-5">Producto</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">Precio</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y md:max-h-62.5 md:overflow-y-auto">
                    {fields.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm opacity-50 flex flex-col items-center gap-2">
                        <Package className="size-8" /> Sin productos
                      </div>
                    ) : (
                      fields.map((field, index) => (
                        <div key={field.id}>
                          <div className="md:hidden p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-sm leading-snug">
                                {watch(`detalles.${index}.nombre_producto`) ||
                                  "Producto"}
                              </p>
                              {!camposDeshabilitados && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                  Cant.
                                </span>
                                <span className="font-mono bg-muted/30 rounded px-2 py-1 inline-block">
                                  {formatCantidad(
                                    watch(`detalles.${index}.cantidad`),
                                  )}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                  Precio
                                </span>
                                <span className="text-muted-foreground font-mono">
                                  Q
                                  {watch(
                                    `detalles.${index}.precio_unitario`,
                                  ).toFixed(2)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                  Subtotal
                                </span>
                                <span className="font-bold font-mono">
                                  Q
                                  {watch(`detalles.${index}.subtotal`).toFixed(
                                    2,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:grid grid-cols-12 items-center py-3 px-4 hover:bg-muted/10 transition-colors text-sm">
                            <div className="col-span-5 font-medium truncate pr-2">
                              {watch(`detalles.${index}.nombre_producto`) ||
                                "Producto"}
                            </div>
                            <div className="col-span-2 text-center font-mono bg-muted/30 rounded py-0.5 mx-2">
                              {formatCantidad(
                                watch(`detalles.${index}.cantidad`),
                              )}
                            </div>
                            <div className="col-span-2 text-right text-muted-foreground whitespace-nowrap tabular-nums">
                              Q
                              {watch(
                                `detalles.${index}.precio_unitario`,
                              ).toFixed(2)}
                            </div>
                            <div className="col-span-2 text-right font-bold whitespace-nowrap tabular-nums">
                              Q{watch(`detalles.${index}.subtotal`).toFixed(2)}
                            </div>
                            <div className="col-span-1 text-right">
                              {!camposDeshabilitados && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-muted/30 border-t p-4 flex justify-end items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Total
                    </span>
                    <span className="text-2xl font-black text-primary tracking-tight">
                      Q{watch("total")?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                  Datos adicionales
                </label>
                <textarea
                  {...register("observaciones")}
                  disabled={camposDeshabilitados}
                  placeholder="detalles de vehículo o observaciones adicionales..."
                  className="w-full min-h-20 max-h-32 p-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {tipoVenta === "Contado" && (
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider shrink-0">
                      Forma de pago
                    </h3>

                    <div className="flex gap-2 sm:gap-3">
                      <button
                        type="button"
                        disabled={pagoDeshabilitado}
                        onClick={() => void seleccionarEfectivo()}
                        className={cn(
                          "flex items-center justify-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold whitespace-nowrap transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                          metodoPago === "Efectivo"
                            ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                            : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <Banknote className="size-4 shrink-0" />
                        Efectivo
                      </button>
                      <button
                        type="button"
                        disabled={pagoDeshabilitado}
                        onClick={() => {
                          setValue("metodo_pago", "Transferencia");
                          void guardarPago({ metodo_pago: "Transferencia" });
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold whitespace-nowrap transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
                          metodoPago === "Transferencia"
                            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                            : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <ArrowRightLeft className="size-4 shrink-0" />
                        Transferencia
                      </button>
                    </div>
                  </div>

                  {metodoPago === "Transferencia" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:items-stretch">
                        <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Nº de boleta (opcional)
                            </label>
                            <input
                              type="text"
                              {...register("numero_boleta")}
                              disabled={pagoDeshabilitado}
                              placeholder="Ej. 12345"
                              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Banco (opcional)
                            </label>
                            <input
                              type="text"
                              {...register("banco")}
                              disabled={pagoDeshabilitado}
                              placeholder="Ej. Banrural"
                              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Fecha y hora transferencia (opcional)
                            </label>
                            <input
                              type="datetime-local"
                              {...register("fecha_transferencia")}
                              disabled={pagoDeshabilitado}
                              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-col space-y-2 min-w-0 lg:min-h-[220px]">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Comprobante (opcional)
                          </label>
                          <ImageUploader
                            bucketName={BUCKET_COMPROBANTES}
                            currentImagePath={imgComprobante ?? null}
                            onUploadSuccess={(path) => {
                              setValue("img_comprobante_url", path);
                              void guardarPago({ img_comprobante_url: path });
                            }}
                            onDeleteSuccess={() => {
                              setValue("img_comprobante_url", null);
                              void guardarPago({ img_comprobante_url: null });
                            }}
                            disabled={pagoDeshabilitado}
                            permitirTodos
                            aspect={4 / 3}
                            aspectLabel="Horizontal 4:3"
                            previewClassName="max-h-[220px] lg:max-h-none lg:h-full lg:object-contain"
                            className="min-h-[180px] lg:min-h-0 lg:flex-1 w-full justify-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          <div className="shrink-0 p-4 border-t bg-muted/30">
            <div className="mx-auto w-full max-w-5xl flex justify-between items-center gap-3">
              <div>
                {ventaToEdit && !camposDeshabilitados && !isAnulado && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    className="px-6 py-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500 font-bold text-sm hover:bg-red-500/20 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    Anular Venta
                  </button>
                )}
              </div>

              {isAnulado || (isReadOnly && !soloPagoEditable) ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-2 rounded-lg border bg-background font-bold text-sm hover:bg-muted cursor-pointer transition-colors"
                >
                  CERRAR VISTA
                </button>
              ) : soloPagoEditable ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-2 rounded-lg border bg-background font-bold text-sm hover:bg-muted cursor-pointer transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      updatePagoMutation.isPending ||
                      tipoVenta !== "Contado"
                    }
                    onClick={async () => {
                      const res = await guardarPago();
                      if (res?.success) onClose();
                    }}
                    className="px-8 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    GUARDAR PAGO
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-2 rounded-lg border bg-background font-bold text-sm hover:bg-muted cursor-pointer transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    form="venta-form"
                    disabled={isSubmitting || fields.length === 0}
                    className="px-8 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    {ventaToEdit ? "ACTUALIZAR" : "GUARDAR"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={modals.client}
        onClose={() => {
          setModals({ ...modals, client: false });
          refetch();
        }}
      />
      <AddProductModal
        isOpen={modals.product}
        onClose={() => setModals({ ...modals, product: false })}
        onAdd={(prod) => append(prod)}
        catalogos={catalogos}
      />
    </>
  );
}

function Header({
  title,
  onClose,
  estado,
}: {
  title: string;
  onClose: () => void;
  estado?: string;
}) {
  const estadoNormal = String(estado || "")
    .trim()
    .toLowerCase();
  const badgeColor =
    estadoNormal === "pendiente"
      ? "bg-amber-500"
      : estadoNormal === "entregado"
        ? "bg-green-500"
        : estadoNormal === "anulado"
          ? "bg-red-500"
          : "bg-muted";

  return (
    <div className="shrink-0 px-6 py-4 border-b flex justify-between items-center bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/10 p-2 rounded-lg">
          <ShoppingCart className="size-6 text-orange-500" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{title}</h2>
            {estado && (
              <span
                className={`px-2 py-0.5 text-[10px] text-white font-black uppercase tracking-widest rounded-full ${badgeColor}`}
              >
                {estado}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Gestión de ventas <span className="text-orange-500">LA ARADA</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 hover:bg-muted rounded-full cursor-pointer"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
