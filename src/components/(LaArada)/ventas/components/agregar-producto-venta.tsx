"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetalleVentaValues, ProductoCatalogo } from "../lib/zod";

interface AgregarProductoVentaProps {
  productos: ProductoCatalogo[];
  onAdd: (detalle: DetalleVentaValues) => void;
}

const money = (n: number) =>
  `Q${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const snapCantidad = (value: number) => Math.max(0.5, Math.round(value * 2) / 2);

function sanitizarDecimal(value: string) {
  const raw = value.replace(/[^\d.]/g, "");
  const parts = raw.split(".");
  if (parts.length <= 2) return raw;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AgregarProductoVenta({
  productos,
  onAdd,
}: AgregarProductoVentaProps) {
  const [search, setSearch] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [seleccionado, setSeleccionado] = useState<ProductoCatalogo | null>(
    null,
  );
  const [cantidadTexto, setCantidadTexto] = useState("");
  const [precioTexto, setPrecioTexto] = useState("");

  const resetForm = () => {
    setSearch("");
    setListaAbierta(false);
    setSeleccionado(null);
    setCantidadTexto("");
    setPrecioTexto("");
  };

  const filtrados = useMemo(() => {
    const activos = productos.filter((p) => p.activo !== false);
    if (!search) return activos.slice(0, 6);
    const s = search.toLowerCase();
    return activos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(s) ||
          (p.codigo ?? "").toLowerCase().includes(s),
      )
      .slice(0, 20);
  }, [productos, search]);

  const cantidad = parseDecimal(cantidadTexto);
  const precio = parseDecimal(precioTexto);
  const subtotal =
    cantidad != null && precio != null ? Math.max(0, precio * cantidad) : 0;
  const stockSuficiente =
    !seleccionado || cantidad == null || seleccionado.stock_actual >= cantidad;
  const puedeAgregar =
    !!seleccionado &&
    cantidad != null &&
    cantidad >= 0.5 &&
    precio != null &&
    precio > 0 &&
    stockSuficiente;
  const mostrarLista = listaAbierta && !seleccionado;

  const confirmar = () => {
    if (!seleccionado || cantidad == null || precio == null || !puedeAgregar) {
      return;
    }
    const cantidadFinal = snapCantidad(cantidad);
    const precioFinal = Math.max(0.01, Math.round(precio * 100) / 100);
    onAdd({
      producto_id: seleccionado.id,
      nombre_producto: seleccionado.nombre,
      cantidad: cantidadFinal,
      precio_unitario: precioFinal,
      subtotal: Number((precioFinal * cantidadFinal).toFixed(2)),
    });
    resetForm();
  };

  const inputClass =
    "w-full h-9 px-3 rounded-lg border-2 border-celeste-trifinio bg-transparent text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 transition-all";

  return (
    <div className="relative z-20 space-y-2 overflow-visible rounded-xl border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-12 md:items-end">
        <div className="relative flex min-w-0 flex-col gap-1 md:col-span-6">
          <label className="flex h-6 items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Producto
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              autoComplete="off"
              value={search}
              onFocus={() => setListaAbierta(true)}
              onBlur={() => {
                window.setTimeout(() => setListaAbierta(false), 120);
              }}
              onChange={(e) => {
                setSearch(e.target.value);
                setListaAbierta(true);
                if (seleccionado && e.target.value !== seleccionado.nombre) {
                  setSeleccionado(null);
                }
              }}
              className={cn(inputClass, "pl-8")}
            />
            {mostrarLista && (
              <div className="absolute top-full left-0 z-30 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-100 text-foreground dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                {filtrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setSeleccionado(p);
                      setPrecioTexto(String(Math.max(0.01, p.precio_base)));
                      setCantidadTexto("");
                      setSearch(p.nombre);
                      setListaAbierta(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-zinc-200 cursor-pointer dark:border-zinc-700 dark:hover:bg-zinc-700"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{p.nombre}</span>
                      {p.codigo && (
                        <span className="font-mono text-[10px] uppercase text-muted-foreground">
                          Cod: {p.codigo}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold",
                        p.stock_actual <= 0
                          ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                          : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {p.stock_actual} {p.medida}
                    </span>
                  </button>
                ))}
                {filtrados.length === 0 && (
                  <p className="p-2.5 text-center text-xs text-muted-foreground">
                    Sin coincidencias
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1 md:col-span-3">
          <label
            className={cn(
              "flex h-6 items-end truncate text-[10px] font-bold uppercase tracking-widest",
              seleccionado && !stockSuficiente
                ? "text-red-500"
                : "text-muted-foreground",
            )}
          >
            Cantidad
            {seleccionado ? ` · ${seleccionado.stock_actual} ${seleccionado.medida}` : ""}
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={cantidadTexto}
            onChange={(e) => setCantidadTexto(sanitizarDecimal(e.target.value))}
            onBlur={() => {
              const parsed = parseDecimal(cantidadTexto);
              if (parsed == null || parsed <= 0) {
                setCantidadTexto("");
                return;
              }
              setCantidadTexto(String(snapCantidad(parsed)));
            }}
            className={cn(
              inputClass,
              seleccionado && !stockSuficiente && "border-red-500",
            )}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1 md:col-span-3">
          <label className="flex h-6 items-end text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Precio (Q)
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={precioTexto}
            onChange={(e) => setPrecioTexto(sanitizarDecimal(e.target.value))}
            onBlur={() => {
              const parsed = parseDecimal(precioTexto);
              if (parsed == null || parsed <= 0) {
                setPrecioTexto("");
                return;
              }
              setPrecioTexto((Math.round(parsed * 100) / 100).toFixed(2));
            }}
            className={cn(inputClass, "text-right tabular-nums")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-9 items-center justify-between rounded-lg bg-zinc-100 px-3 dark:bg-zinc-800 sm:min-w-[10rem]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Subtotal
          </span>
          <span className="text-sm font-black tabular-nums text-foreground">
            {money(subtotal)}
          </span>
        </div>
        <button
          type="button"
          onClick={confirmar}
          disabled={!puedeAgregar}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-emerald-200 px-4 text-xs font-bold text-emerald-900 transition-colors hover:bg-emerald-300 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto dark:bg-emerald-800/70 dark:text-emerald-50 dark:hover:bg-emerald-700/80"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
