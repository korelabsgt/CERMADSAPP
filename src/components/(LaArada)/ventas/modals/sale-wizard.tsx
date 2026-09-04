"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Wallet,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { VentaSchema, VentaFormValues, ClienteCatalogo } from "../lib/zod";
import { useCatalogos, useCrearVentaConPagos } from "../lib/hooks";
import ClientModal from "../../clientes/modals/client-modal";
import AgregarProductoVenta from "../components/agregar-producto-venta";
import ImageUploader from "@/components/(base)/imgs/ImageUploader";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useSaldoCliente } from "@/components/(LaArada)/preventas/lib/hooks";
import { ReciboPreventa } from "@/components/(LaArada)/preventas/lib/zod";

interface SaleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (ventaId: string) => void;
}

const BUCKET_COMPROBANTES = "ventas-comprobantes";

const money = (n: number) =>
  `Q${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function SaleWizard({
  isOpen,
  onClose,
  onCreated,
}: SaleWizardProps) {
  const { data: catalogos, refetch } = useCatalogos();
  const crearMutation = useCrearVentaConPagos();

  const [step, setStep] = useState(1);
  const [modals, setModals] = useState({ client: false });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado del pago
  const [aplicarSaldo, setAplicarSaldo] = useState(false);
  const [montoPreventa, setMontoPreventa] = useState("");
  const [usarEfectivo, setUsarEfectivo] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [usarTransferencia, setUsarTransferencia] = useState(false);
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [usarCredito, setUsarCredito] = useState(false);
  const [montoCreditoInput, setMontoCreditoInput] = useState("");
  const [numeroBoleta, setNumeroBoleta] = useState("");
  const [banco, setBanco] = useState("");
  const [fechaTransferencia, setFechaTransferencia] = useState("");
  const [imgComprobante, setImgComprobante] = useState<string | null>(null);

  const savedRef = useRef(false);

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(VentaSchema) as never,
    defaultValues: {
      cliente_id: "",
      tipo_venta: "Contado",
      tipo_comprobante: "Recibo",
      metodo_pago: "Efectivo",
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
    setValue,
    getValues,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const detalles = watch("detalles");
  const selectedClientId = watch("cliente_id");

  const total = useMemo(
    () => detalles.reduce((acc, curr) => acc + (curr.subtotal || 0), 0),
    [detalles],
  );

  useEffect(() => {
    setValue("total", total);
  }, [total, setValue]);

  const { data: saldoCliente = 0 } = useSaldoCliente(selectedClientId || null);

  const today = new Date().toISOString().split("T")[0];

  // Bloqueo de scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset al abrir
  useEffect(() => {
    if (!isOpen) return;
    savedRef.current = false;
    setStep(1);
    setClientSearch("");
    setShowClientList(false);
    setAplicarSaldo(false);
    setMontoPreventa("");
    setUsarEfectivo(false);
    setMontoEfectivo("");
    setUsarTransferencia(false);
    setMontoTransferencia("");
    setUsarCredito(false);
    setMontoCreditoInput("");
    setNumeroBoleta("");
    setBanco("");
    setFechaTransferencia("");
    setImgComprobante(null);
    reset({
      cliente_id: "",
      tipo_venta: "Contado",
      tipo_comprobante: "Recibo",
      metodo_pago: "Efectivo",
      img_comprobante_url: null,
      fecha_entrega: new Date().toISOString().split("T")[0],
      total: 0,
      detalles: [],
      observaciones: "",
    });
  }, [isOpen, reset]);

  // Reinicia el pago cuando cambia el cliente
  useEffect(() => {
    setAplicarSaldo(false);
    setMontoPreventa("");
  }, [selectedClientId]);

  const filteredClients = useMemo(() => {
    if (!catalogos?.clientes || clientSearch.length < 2) return [];
    const s = clientSearch.toLowerCase();
    return catalogos.clientes.filter(
      (c: ClienteCatalogo) =>
        c.nombre.toLowerCase().includes(s) || c.nit.includes(s),
    );
  }, [catalogos, clientSearch]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowClientList(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // --- Cálculo del desglose de pago ---
  const maxPreventa = Math.min(saldoCliente, total);
  const preventaAplicada = aplicarSaldo
    ? Math.min(Math.max(Number(montoPreventa) || 0, 0), maxPreventa)
    : 0;
  const efectivoMonto = usarEfectivo
    ? Math.max(Number(montoEfectivo) || 0, 0)
    : 0;
  const transferenciaMonto = usarTransferencia
    ? Math.max(Number(montoTransferencia) || 0, 0)
    : 0;

  const maxCredito = Math.max(
    0,
    total - preventaAplicada - efectivoMonto - transferenciaMonto,
  );
  const creditoMonto = usarCredito
    ? Math.min(Math.max(Number(montoCreditoInput) || 0, 0), maxCredito)
    : 0;

  const restanteSinAsignar = Math.max(
    total - preventaAplicada - efectivoMonto - transferenciaMonto - creditoMonto,
    0,
  );
  const esCredito = creditoMonto > 0.001;

  const maxSaldo = Math.max(
    0,
    Math.min(
      maxPreventa,
      total - efectivoMonto - transferenciaMonto - creditoMonto,
    ),
  );
  const maxEfectivo = Math.max(
    0,
    total - preventaAplicada - transferenciaMonto - creditoMonto,
  );
  const maxTransferencia = Math.max(
    0,
    total - preventaAplicada - efectivoMonto - creditoMonto,
  );

  // --- Validación por paso ---
  const step1Valido = !!selectedClientId && fields.length > 0;
  const step2Valido = total > 0 && restanteSinAsignar < 0.01;

  const limpiarComprobanteHuerfano = async () => {
    if (savedRef.current) return;
    const path = imgComprobante;
    if (!path) return;
    const supabase = createClient();
    await supabase.storage.from(BUCKET_COMPROBANTES).remove([path]);
  };

  const handleClose = async () => {
    await limpiarComprobanteHuerfano();
    onClose();
  };

  const irAPago = async () => {
    const ok = await trigger(["cliente_id", "fecha_entrega"]);
    if (!ok || !step1Valido) return;
    setStep(2);
  };

  const handleGuardar = async () => {
    const data = getValues();
    const res = await crearMutation.mutateAsync({
      cliente_id: data.cliente_id,
      tipo_comprobante: "Recibo",
      fecha_entrega: data.fecha_entrega || today,
      observaciones: data.observaciones,
      total,
      detalles: data.detalles,
      pago: {
        preventa_monto: preventaAplicada,
        efectivo_monto: efectivoMonto,
        transferencia_monto: transferenciaMonto,
        numero_boleta: transferenciaMonto > 0 ? numeroBoleta : "",
        banco: transferenciaMonto > 0 ? banco : "",
        fecha_transferencia: transferenciaMonto > 0 ? fechaTransferencia : "",
        img_comprobante_url: transferenciaMonto > 0 ? imgComprobante : null,
      },
    });

    if (res?.success) {
      savedRef.current = true;
      const ventaId = (res as { ventaId?: string }).ventaId;
      const recibo = (res as { reciboPreventa?: ReciboPreventa | null })
        .reciboPreventa;
      if (recibo) {
        window.dispatchEvent(
          new CustomEvent<ReciboPreventa>("imprimir-preventa", {
            detail: recibo,
          }),
        );
      }
      onClose();
      if (ventaId && onCreated) onCreated(ventaId);
    }
  };

  const formatCantidad = (c: number) =>
    Number.isInteger(c) ? c : c.toFixed(1);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
        <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-background">
          <WizardHeader step={step} onClose={handleClose} />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:px-8 lg:py-6 [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto w-full max-w-5xl space-y-6">
              {/* PASO 1: Cliente, productos y datos adicionales */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div
                      className="md:col-span-8 space-y-1.5 relative"
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
                            className={cn(
                              "w-full h-10 pl-9 pr-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20",
                              errors.cliente_id && "border-red-500",
                            )}
                            value={clientSearch}
                            onChange={(e) => {
                              setClientSearch(e.target.value);
                              setShowClientList(e.target.value.length >= 3);
                              if (!e.target.value) setValue("cliente_id", "");
                            }}
                            onFocus={() =>
                              clientSearch.length >= 3 && setShowClientList(true)
                            }
                            autoComplete="off"
                          />
                          {showClientList && (
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
                        <button
                          type="button"
                          onClick={() =>
                            setModals({ ...modals, client: true })
                          }
                          className="size-10 flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus className="size-5" />
                        </button>
                      </div>
                      {selectedClientId && saldoCliente > 0 && (
                        <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Wallet className="size-3.5" />
                          Saldo a favor: {money(saldoCliente)}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-4 space-y-1.5">
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
                        className={cn(
                          "w-full h-10 px-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 transition-all",
                          errors.fecha_entrega
                            ? "border-red-500 focus:ring-red-500/20"
                            : "border-border focus:ring-primary/20",
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 overflow-visible">
                    <AgregarProductoVenta
                      productos={catalogos?.productos ?? []}
                      onAdd={(prod) => append(prod)}
                    />

                    <div className="border-b pb-2">
                      <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                        Detalle de la venta
                      </h3>
                    </div>

                    <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                      <div className="hidden md:grid grid-cols-12 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase py-2 px-4 border-b">
                        <div className="col-span-5">Producto</div>
                        <div className="col-span-2 text-center">Cant.</div>
                        <div className="col-span-2 text-right">Precio</div>
                        <div className="col-span-2 text-right">Subtotal</div>
                        <div className="col-span-1"></div>
                      </div>
                      <div className="divide-y md:max-h-72 md:overflow-y-auto">
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
                                    {watch(
                                      `detalles.${index}.nombre_producto`,
                                    ) || "Producto"}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
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
                                      {watch(
                                        `detalles.${index}.subtotal`,
                                      ).toFixed(2)}
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
                                  Q
                                  {watch(`detalles.${index}.subtotal`).toFixed(
                                    2,
                                  )}
                                </div>
                                <div className="col-span-1 text-right">
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="bg-muted/30 border-t p-4 flex items-center justify-end gap-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          Total
                        </span>
                        <span className="text-2xl font-black text-primary tracking-tight">
                          {money(total)}
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
                      placeholder="detalles de vehículo u observaciones adicionales..."
                      className="w-full min-h-20 max-h-32 p-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y transition-all"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: Forma de pago */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Total a cubrir
                      </span>
                      <span className="text-2xl font-black text-primary tracking-tight">
                        {money(total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2 text-xs">
                      <span className="font-bold uppercase tracking-wide text-muted-foreground">
                        Restante por cubrir
                      </span>
                      <span
                        className={cn(
                          "font-black tabular-nums",
                          restanteSinAsignar > 0.001
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {money(restanteSinAsignar)}
                      </span>
                    </div>
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      Distribuye el total entre saldo a favor, efectivo,
                      transferencia y crédito hasta que el restante sea Q0.00.
                    </p>

                    {saldoCliente > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const next = !aplicarSaldo;
                            setAplicarSaldo(next);
                            if (next) {
                              const uncovered = Math.max(
                                total -
                                  efectivoMonto -
                                  transferenciaMonto -
                                  creditoMonto,
                                0,
                              );
                              setMontoPreventa(
                                Math.min(uncovered, maxPreventa).toFixed(2),
                              );
                            } else {
                              setMontoPreventa("");
                            }
                          }}
                          className={cn(
                            "flex h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm font-bold transition-colors cursor-pointer",
                            aplicarSaldo
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-border bg-background hover:bg-muted/50",
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                                aplicarSaldo
                                  ? "border-current"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {aplicarSaldo && <Check className="size-3.5" />}
                            </span>
                            <Wallet className="size-4 shrink-0" />
                            Aplicar saldo a favor
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            Disp. {money(saldoCliente)}
                          </span>
                        </button>

                        {aplicarSaldo && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Monto a aplicar · restante por cubrir{" "}
                              {money(maxSaldo)}
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              step="0.01"
                              value={montoPreventa}
                              onChange={(e) => {
                                if (e.target.value === "") {
                                  setMontoPreventa("");
                                  return;
                                }
                                let val = Number(e.target.value);
                                if (val > maxSaldo) val = maxSaldo;
                                if (val < 0) val = 0;
                                setMontoPreventa(String(val));
                              }}
                              onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key))
                                  e.preventDefault();
                              }}
                              className="h-10 w-full rounded-lg border border-emerald-500/40 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cómo se paga */}
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      ¿Cómo se paga?
                    </h3>

                    {/* Efectivo */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !usarEfectivo;
                          setUsarEfectivo(next);
                          if (next) {
                            const uncovered = Math.max(
                              total -
                                preventaAplicada -
                                transferenciaMonto -
                                creditoMonto,
                              0,
                            );
                            setMontoEfectivo(
                              uncovered ? uncovered.toFixed(2) : "",
                            );
                          } else {
                            setMontoEfectivo("");
                          }
                        }}
                        className={cn(
                          "flex h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm font-bold transition-colors cursor-pointer",
                          usarEfectivo
                            ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                            : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                              usarEfectivo
                                ? "border-current"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {usarEfectivo && <Check className="size-3.5" />}
                          </span>
                          <Banknote className="size-4 shrink-0" />
                          Efectivo
                        </span>
                      </button>
                      {usarEfectivo && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Monto en efectivo · restante por cubrir{" "}
                            {money(maxEfectivo)}
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={montoEfectivo}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setMontoEfectivo("");
                                return;
                              }
                              let val = Number(e.target.value);
                              if (val > maxEfectivo) val = maxEfectivo;
                              if (val < 0) val = 0;
                              setMontoEfectivo(String(val));
                            }}
                            onKeyDown={(e) => {
                              if (["-", "e", "E", "+"].includes(e.key))
                                e.preventDefault();
                            }}
                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Transferencia */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !usarTransferencia;
                          setUsarTransferencia(next);
                          if (next) {
                            const uncovered = Math.max(
                              total -
                                preventaAplicada -
                                efectivoMonto -
                                creditoMonto,
                              0,
                            );
                            setMontoTransferencia(
                              uncovered ? uncovered.toFixed(2) : "",
                            );
                          } else {
                            setMontoTransferencia("");
                          }
                        }}
                        className={cn(
                          "flex h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm font-bold transition-colors cursor-pointer",
                          usarTransferencia
                            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300"
                            : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                              usarTransferencia
                                ? "border-current"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {usarTransferencia && (
                              <Check className="size-3.5" />
                            )}
                          </span>
                          <ArrowRightLeft className="size-4 shrink-0" />
                          Transferencia
                        </span>
                      </button>
                      {usarTransferencia && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Monto por transferencia · restante por cubrir{" "}
                              {money(maxTransferencia)}
                            </label>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              value={montoTransferencia}
                              onChange={(e) => {
                                if (e.target.value === "") {
                                  setMontoTransferencia("");
                                  return;
                                }
                                let val = Number(e.target.value);
                                if (val > maxTransferencia)
                                  val = maxTransferencia;
                                if (val < 0) val = 0;
                                setMontoTransferencia(String(val));
                              }}
                              onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key))
                                  e.preventDefault();
                              }}
                              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:items-stretch">
                            <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                  Nº de boleta (opcional)
                                </label>
                                <input
                                  type="text"
                                  value={numeroBoleta}
                                  onChange={(e) =>
                                    setNumeroBoleta(e.target.value)
                                  }
                                  placeholder="Ej. 12345"
                                  className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                  Banco (opcional)
                                </label>
                                <input
                                  type="text"
                                  value={banco}
                                  onChange={(e) => setBanco(e.target.value)}
                                  placeholder="Ej. Banrural"
                                  className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                  Fecha y hora (opcional)
                                </label>
                                <input
                                  type="datetime-local"
                                  value={fechaTransferencia}
                                  onChange={(e) =>
                                    setFechaTransferencia(e.target.value)
                                  }
                                  className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                              </div>
                            </div>
                            <div className="lg:col-span-3 flex flex-col space-y-2 min-w-0 lg:min-h-[220px]">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                Comprobante (opcional)
                              </label>
                              <ImageUploader
                                bucketName={BUCKET_COMPROBANTES}
                                currentImagePath={imgComprobante}
                                onUploadSuccess={(path) =>
                                  setImgComprobante(path)
                                }
                                onDeleteSuccess={() => setImgComprobante(null)}
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

                    {/* Crédito */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !usarCredito;
                          setUsarCredito(next);
                          if (next) {
                            const uncovered = Math.max(
                              total -
                                preventaAplicada -
                                efectivoMonto -
                                transferenciaMonto,
                              0,
                            );
                            setMontoCreditoInput(
                              uncovered ? uncovered.toFixed(2) : "",
                            );
                          } else {
                            setMontoCreditoInput("");
                          }
                        }}
                        className={cn(
                          "flex h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm font-bold transition-colors cursor-pointer",
                          usarCredito
                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-border bg-background hover:bg-muted/50",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-md border-2 transition-colors",
                              usarCredito
                                ? "border-current"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {usarCredito && <Check className="size-3.5" />}
                          </span>
                          <CreditCard className="size-4 shrink-0" />
                          Crédito
                        </span>
                      </button>
                      {usarCredito && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">
                            Monto a crédito · restante por cubrir{" "}
                            {money(maxCredito)}
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={montoCreditoInput}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setMontoCreditoInput("");
                                return;
                              }
                              let val = Number(e.target.value);
                              if (val > maxCredito) val = maxCredito;
                              if (val < 0) val = 0;
                              setMontoCreditoInput(String(val));
                            }}
                            onKeyDown={(e) => {
                              if (["-", "e", "E", "+"].includes(e.key))
                                e.preventDefault();
                            }}
                            className="h-10 w-full rounded-lg border border-amber-500/40 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/30"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <DesglosePago
                    total={total}
                    preventa={preventaAplicada}
                    efectivo={efectivoMonto}
                    transferencia={transferenciaMonto}
                    credito={creditoMonto}
                    sinAsignar={restanteSinAsignar}
                  />
                </div>
              )}

              {/* PASO 3: Resumen */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Cliente
                    </h3>
                    <p className="text-base font-bold">{clientSearch}</p>
                    {watch("observaciones") && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {watch("observaciones")}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                      <ClipboardList className="size-4 text-muted-foreground" />
                      <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Productos ({fields.length})
                      </h3>
                    </div>
                    <div className="divide-y">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                        >
                          <span className="truncate">
                            {watch(`detalles.${index}.nombre_producto`)}{" "}
                            <span className="text-muted-foreground">
                              x
                              {formatCantidad(
                                watch(`detalles.${index}.cantidad`),
                              )}
                            </span>
                          </span>
                          <span className="font-bold tabular-nums whitespace-nowrap">
                            Q{watch(`detalles.${index}.subtotal`).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-muted-foreground">
                        Total
                      </span>
                      <span className="text-xl font-black text-primary">
                        {money(total)}
                      </span>
                    </div>
                  </div>

                  <DesglosePago
                    total={total}
                    preventa={preventaAplicada}
                    efectivo={efectivoMonto}
                    transferencia={transferenciaMonto}
                    credito={creditoMonto}
                    sinAsignar={0}
                    resaltado
                  />

                  <div
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm font-bold flex items-center gap-2",
                      esCredito
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
                    )}
                  >
                    {esCredito ? (
                      <>
                        <CreditCard className="size-4" />
                        Venta a CRÉDITO — pendiente {money(creditoMonto)}
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        Venta de CONTADO — pagada por completo
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer navegación */}
          <div className="shrink-0 p-4 border-t bg-muted/30">
            <div className="mx-auto w-full max-w-5xl flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={step === 1 ? handleClose : () => setStep(step - 1)}
                className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-lg bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500 font-bold text-sm hover:bg-gray-500/20 cursor-pointer transition-colors"
              >
                {step === 1 ? (
                  "CANCELAR"
                ) : (
                  <>
                    <ChevronLeft className="size-4" /> ATRÁS
                  </>
                )}
              </button>

              {step === 1 && (
                <button
                  type="button"
                  onClick={irAPago}
                  disabled={!step1Valido}
                  className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500 font-bold text-sm hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  SIGUIENTE <ChevronRight className="size-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!step2Valido}
                  className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500 font-bold text-sm hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  RESUMEN <ChevronRight className="size-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={crearMutation.isPending || fields.length === 0}
                  className="inline-flex items-center gap-2 px-5 sm:px-8 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500 font-bold text-sm hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <Check className="size-4" />
                  {crearMutation.isPending ? "GUARDANDO..." : "GUARDAR VENTA"}
                </button>
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
    </>
  );
}

function DesglosePago({
  total,
  preventa,
  efectivo,
  transferencia,
  credito,
  sinAsignar,
  resaltado,
}: {
  total: number;
  preventa: number;
  efectivo: number;
  transferencia: number;
  credito: number;
  sinAsignar: number;
  resaltado?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2 text-sm",
        resaltado ? "bg-card" : "bg-muted/10",
      )}
    >
      <Row label="Total" value={money(total)} strong />
      {preventa > 0 && (
        <Row
          label="Saldo a favor"
          value={`- ${money(preventa)}`}
          className="text-emerald-600 dark:text-emerald-400"
        />
      )}
      {efectivo > 0 && (
        <Row
          label="Efectivo"
          value={`- ${money(efectivo)}`}
          className="text-green-600 dark:text-green-400"
        />
      )}
      {transferencia > 0 && (
        <Row
          label="Transferencia"
          value={`- ${money(transferencia)}`}
          className="text-blue-600 dark:text-blue-400"
        />
      )}
      {credito > 0 && (
        <Row
          label="Crédito"
          value={`- ${money(credito)}`}
          className="text-amber-600 dark:text-amber-400"
        />
      )}
      <div className="border-t pt-2">
        {sinAsignar > 0.001 ? (
          <Row
            label="Sin asignar"
            value={money(sinAsignar)}
            strong
            className="text-red-600 dark:text-red-400"
          />
        ) : (
          <Row
            label="Restante"
            value={money(0)}
            strong
            className="text-emerald-600 dark:text-emerald-400"
          />
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "uppercase text-[11px] tracking-wide",
          strong ? "font-bold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "font-black text-base" : "font-bold",
          className,
        )}
      >
        {value}
      </span>
    </div>
  );
}

const STEPS = [
  { n: 1, label: "Cliente" },
  { n: 2, label: "Forma de pago" },
  { n: 3, label: "Resumen" },
];

function WizardHeader({
  step,
  onClose,
}: {
  step: number;
  onClose: () => void;
}) {
  return (
    <div className="shrink-0 border-b bg-muted/30">
      <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2 rounded-lg">
            <ShoppingCart className="size-6 text-orange-500" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold">Nueva Venta</h2>
            <p className="text-xs text-muted-foreground">
              Gestión de ventas{" "}
              <span className="text-orange-500">LA ARADA</span>
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

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors",
                    step === s.n
                      ? "bg-orange-500 text-white"
                      : step > s.n
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {step > s.n ? <Check className="size-4" /> : s.n}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wide hidden sm:inline",
                    step === s.n
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors",
                    step > s.n ? "bg-emerald-500" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
