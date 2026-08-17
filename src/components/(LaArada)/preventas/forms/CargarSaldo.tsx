"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPortal } from "react-dom";
import { X, Search, Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PreventaSchema,
  PreventaFormValues,
  METODOS_PAGO_PREVENTA,
  ClienteLista,
  ReciboPreventa,
  PreventaMovimiento,
} from "../lib/zod";
import { useClientesLista, useCrearPreventa, useEditarCargaPreventa } from "../lib/hooks";
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

  const [clientSearch, setClientSearch] = useState("");
  const [fechaDisplay, setFechaDisplay] = useState("");
  const [showClientList, setShowClientList] = useState(false);
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
    },
  });

  const selectedClientId = watch("cliente_id");

  const editMovId = editMov?.id;
  const clientePresetId = preselectedCliente?.id;
  const clientePresetNombre = preselectedCliente?.nombre;

  useEffect(() => {
    if (!isOpen) return;

    if (editMov) {
      const fechaIso = editMov.fecha_emision ?? editMov.created_at.split("T")[0];
      reset({
        cliente_id: editMov.cliente_id,
        monto: editMov.monto,
        fecha_emision: fechaIso,
        metodo_pago:
          (editMov.metodo_pago as PreventaFormValues["metodo_pago"]) ?? "Efectivo",
        img_comprobante_url: null,
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
    });
    setFechaDisplay(isoToFechaDisplay(fechaHoy));
    setClientSearch(clientePresetNombre || "");
    setShowClientList(false);
  }, [isOpen, editMovId, clientePresetId, clientePresetNombre, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
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

  const onSubmit = async (data: PreventaFormValues) => {
    if (isEdit && editMov) {
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/75 backdrop-blur-sm p-0 text-foreground dark:bg-black/75 sm:p-4">
      <div className="relative flex h-dvh w-full flex-col bg-zinc-100 dark:bg-zinc-900 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl sm:shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-100 dark:bg-zinc-800 sm:rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-2 text-azul-trifinio dark:bg-sky-950">
              <Wallet className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-900 px-5 py-5 space-y-4"
        >
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
                          onClick={() => {
                            setValue("cliente_id", c.id, { shouldValidate: true });
                            setClientSearch(c.nombre);
                            setShowClientList(false);
                          }}
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
                {errors.cliente_id && (
                  <span className="text-[10px] font-bold uppercase text-red-500">
                    {errors.cliente_id.message}
                  </span>
                )}
              </>
            )}
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
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground"
                  >
                    Q
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={field.value === 0 ? "" : String(field.value)}
                    onChange={(e) => {
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
                    className={cn(inputClass(!!errors.monto), "pl-8")}
                  />
                </div>
              )}
            />
            {errors.monto && (
              <span className="text-[10px] font-bold uppercase text-red-500">
                {errors.monto.message}
              </span>
            )}
          </div>

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
            {errors.fecha_emision && (
              <span className="text-[10px] font-bold uppercase text-red-500">
                {errors.fecha_emision.message}
              </span>
            )}
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
                  onChange={(e) => {
                    field.onChange(
                      e.target.value as PreventaFormValues["metodo_pago"],
                    );
                  }}
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
        </form>

        <ModalFooter>
          <ModalCancel onClick={onClose} />
          <ModalSubmit
            disabled={
              isSubmitting ||
              crearMutation.isPending ||
              editarMutation.isPending
            }
            onClick={handleSubmit(onSubmit)}
          />
        </ModalFooter>
      </div>
    </div>,
    document.body,
  );
}
