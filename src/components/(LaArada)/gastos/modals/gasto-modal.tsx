"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GastoSchema, GastoFormValues, GastoItem, GastoCategoriaItem } from "../lib/zod";
import { useCreateGasto, useUpdateGasto, useCreateGastoCategoria } from "../lib/hooks";
import { X, Save, TrendingDown, Tag, Calendar, DollarSign, AlignLeft, Plus, Check } from "lucide-react";
import { toast } from "react-toastify";
import { formatLocalDatetimeInput } from "../lib/ui";

interface GastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gastoToEdit?: GastoItem | null;
  categorias: GastoCategoriaItem[];
}

const DEFAULT_CATEGORIAS = [
  "Planilla",
  "Compras",
  "Servicios",
  "Mantenimiento",
  "Viáticos",
  "Otros",
];

export default function GastoModal({
  isOpen,
  onClose,
  gastoToEdit,
  categorias,
}: GastoModalProps) {
  const createMutation = useCreateGasto();
  const updateMutation = useUpdateGasto();
  const createCategoriaMutation = useCreateGastoCategoria();

  const isEditing = !!gastoToEdit;

  const [isAddingCategoria, setIsAddingCategoria] = useState(false);
  const [newCategoriaName, setNewCategoriaName] = useState("");
  const [extraCategorias, setExtraCategorias] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormValues>({
    resolver: zodResolver(GastoSchema) as never,
    mode: "onSubmit",
    defaultValues: {
      nombre: "",
      cantidad: "" as any,
      categoria: "Compras",
      descripcion: "",
      fecha: formatLocalDatetimeInput(),
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsAddingCategoria(false);
      setNewCategoriaName("");
      return;
    }

    if (gastoToEdit) {
      reset({
        nombre: gastoToEdit.nombre,
        cantidad: gastoToEdit.cantidad ?? ("" as any),
        categoria: gastoToEdit.categoria,
        descripcion: gastoToEdit.descripcion || "",
        fecha: formatLocalDatetimeInput(gastoToEdit.fecha),
      });
    } else {
      reset({
        nombre: "",
        cantidad: "" as any,
        categoria: "Compras",
        descripcion: "",
        fecha: formatLocalDatetimeInput(),
      });
    }
  }, [gastoToEdit, reset, isOpen]);

  const categoryOptions = Array.from(
    new Set([
      ...DEFAULT_CATEGORIAS,
      ...(categorias || []).map((c) => c.categoria),
      ...extraCategorias,
    ]),
  );

  const handleSaveNewCategoria = async () => {
    const trimmed = newCategoriaName.trim();
    if (!trimmed) {
      toast.warn("Ingresa el nombre de la nueva categoría");
      return;
    }

    // Normalizar para comparación exacta (insensible a acentos y mayúsculas/minúsculas)
    const normalize = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const normalizedNew = normalize(trimmed);
    const alreadyExists = categoryOptions.some(
      (cat) => normalize(cat) === normalizedNew
    );

    if (alreadyExists) {
      toast.error(`La categoría "${trimmed}" ya existe`);
      return;
    }

    // Formatear primera letra en mayúscula
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setExtraCategorias((prev) => [...prev, formatted]);
    setValue("categoria", formatted);
    setIsAddingCategoria(false);
    setNewCategoriaName("");

    if (isEditing && gastoToEdit?.id.startsWith("simulado-")) {
      toast.success(`Categoría "${formatted}" añadida (modo simulación)`);
      return;
    }

    const res = await createCategoriaMutation.mutateAsync(formatted);
    if (res?.error && res.error.toLowerCase().includes("ya existe")) {
      toast.error(`La categoría "${formatted}" ya existe`);
    }
  };

  if (!isOpen) return null;

  const onSubmit = async (values: GastoFormValues) => {
    // Preservar la fecha y hora seleccionada por el usuario convertida a ISO
    let finalFechaIso = new Date().toISOString();
    if (values.fecha) {
      const parsedDate = new Date(values.fecha);
      if (!isNaN(parsedDate.getTime())) {
        finalFechaIso = parsedDate.toISOString();
      }
    }

    const finalValues: GastoFormValues = {
      ...values,
      cantidad:
        values.cantidad === ("" as any) ||
        values.cantidad === undefined ||
        isNaN(Number(values.cantidad))
          ? 0
          : Number(values.cantidad),
      fecha: finalFechaIso,
    };

    if (isEditing && gastoToEdit) {
      if (gastoToEdit.id.startsWith("simulado-")) {
        toast.info("Gasto simulado (los cambios no se guardan en base de datos)");
        onClose();
        return;
      }
      await updateMutation.mutateAsync({
        id: gastoToEdit.id,
        data: finalValues,
      });
    } else {
      await createMutation.mutateAsync(finalValues);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <TrendingDown className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? "Editar Gasto" : "Registrar Nuevo Gasto"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Modifica los datos del gasto registrado"
                  : "Ingresa los detalles del gasto para control administrativo"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Nombre / Concepto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Concepto *
            </label>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Ej: Pago de planilla quincenal, Compra de combustible..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                />
              )}
            />
            {errors.nombre && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monto / Cantidad */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Monto (Q) *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">
                  Q
                </span>
                <Controller
                  name="cantidad"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-8 pr-3 text-sm font-bold text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  )}
                />
              </div>
              {errors.cantidad && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.cantidad.message}
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {isAddingCategoria ? "Nueva Categoría *" : "Categoría *"}
              </label>

              {isAddingCategoria ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej: Combustible, Fletes, Mantenimiento..."
                    value={newCategoriaName}
                    onChange={(e) => setNewCategoriaName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveNewCategoria();
                      } else if (e.key === "Escape") {
                        setIsAddingCategoria(false);
                        setNewCategoriaName("");
                      }
                    }}
                    className="h-10 flex-1 min-w-0 rounded-xl border border-red-400 bg-white px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-red-500 dark:bg-zinc-800"
                  />
                  <button
                    type="button"
                    disabled={createCategoriaMutation.isPending}
                    onClick={handleSaveNewCategoria}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar categoría"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategoria(false);
                      setNewCategoriaName("");
                    }}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                    title="Cancelar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Controller
                    name="categoria"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="h-10 flex-1 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategoria(true);
                      setNewCategoriaName("");
                    }}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:border-red-300 dark:border-red-900/60 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900/80 cursor-pointer shadow-xs"
                    title="Añadir nueva categoría"
                    aria-label="Añadir nueva categoría"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              )}

              {errors.categoria && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {errors.categoria.message}
                </p>
              )}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Fecha y Hora *
            </label>
            <Controller
              name="fecha"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="datetime-local"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                />
              )}
            />
            {errors.fecha && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.fecha.message}
              </p>
            )}
          </div>

          {/* Descripción opcional */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Descripción / Observaciones (Opcional)
            </label>
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={2}
                  placeholder="Detalles adicionales, proveedor, no. factura o justificación..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 resize-none"
                />
              )}
            />
            {errors.descripcion && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold uppercase text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-xs font-bold uppercase text-white shadow-sm transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="size-4" />
              <span>{isEditing ? "Guardar Cambios" : "Registrar Gasto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
