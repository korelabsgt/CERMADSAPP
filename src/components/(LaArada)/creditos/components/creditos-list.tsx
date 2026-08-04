"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ClienteCredito } from "../lib/zod";
import { getClienteSlug } from "../lib/slug";

type PageSize = 15 | 30 | 45 | "all";

interface CreditosListProps {
  clientes: ClienteCredito[];
}

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "Todos" },
];

const formatDeuda = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CreditosList({ clientes }: CreditosListProps) {
  const router = useRouter();
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [currentPage, setCurrentPage] = useState(1);

  const ordenados = useMemo(
    () =>
      [...clientes].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      ),
    [clientes],
  );

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(ordenados.length / pageSize));
  }, [ordenados.length, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientes, pageSize]);

  const pagina = useMemo(() => {
    if (pageSize === "all") return ordenados;
    const start = (safeCurrentPage - 1) * pageSize;
    return ordenados.slice(start, start + pageSize);
  }, [ordenados, pageSize, safeCurrentPage]);

  const totalPendientes = useMemo(
    () => ordenados.reduce((sum, c) => sum + c.cantidadPedidos, 0),
    [ordenados],
  );

  const totalDeuda = useMemo(
    () => ordenados.reduce((sum, c) => sum + c.totalDeuda, 0),
    [ordenados],
  );

  if (clientes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm font-bold text-zinc-500">
        Sin créditos activos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[36rem] text-xs md:text-sm text-left">
            <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500">
              <tr>
                <th className="sticky left-0 z-20 w-[9rem] max-w-[9rem] bg-zinc-50 px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] lg:w-[20rem] lg:max-w-[20rem] lg:px-4 xl:w-[26rem] xl:max-w-[26rem]">
                  Cliente
                </th>
                <th className="px-4 py-3">NIT</th>
                <th className="px-4 py-3 text-center">Pendientes</th>
                <th className="px-4 py-3 text-right">Deuda</th>
                <th className="px-4 py-3 w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagina.map((cliente) => {
                const slug = getClienteSlug(cliente, clientes);
                const href = `/cermadsa/laarada/creditos/${slug}`;

                return (
                  <tr
                    key={cliente.cliente_id}
                    onClick={() => router.push(href)}
                    className="cursor-pointer transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="sticky left-0 z-10 w-[9rem] max-w-[9rem] bg-white px-2 py-2.5 text-[11px] font-bold uppercase leading-snug text-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] lg:w-[20rem] lg:max-w-[20rem] lg:px-4 lg:py-3 lg:text-sm xl:w-[26rem] xl:max-w-[26rem]">
                      <span className="line-clamp-2">{cliente.nombre}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap">
                      {cliente.nit}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {cliente.cantidadPedidos} Pendientes
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      Q{formatDeuda(cliente.totalDeuda)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(href);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-red-100 hover:text-red-600 cursor-pointer"
                        aria-label={`Ver crédito de ${cliente.nombre}`}
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-zinc-200 bg-zinc-50 font-black text-[10px]">
              <tr>
                <td className="sticky left-0 z-10 bg-zinc-50 px-2 py-3 text-zinc-500 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] lg:px-4">
                  Totales
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-center tabular-nums text-sm">
                  <span className="inline-flex rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {totalPendientes} Pendientes
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm text-red-500">
                  Q{formatDeuda(totalDeuda)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={pageSize}
          onChange={(e) => {
            const value = e.target.value;
            setPageSize(value === "all" ? "all" : (Number(value) as PageSize));
          }}
          className="h-10 rounded-xl border-2 border-celeste-trifinio bg-transparent px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-celeste-trifinio/30 cursor-pointer"
          aria-label="Filas por página"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={pageSize === "all" || safeCurrentPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-celeste-trifinio text-foreground transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-12 text-center text-xs font-black tabular-nums text-foreground">
            {pageSize === "all"
              ? "Todos"
              : `${safeCurrentPage}/${totalPages}`}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={
              pageSize === "all" ||
              safeCurrentPage === totalPages ||
              totalPages === 0
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-celeste-trifinio text-foreground transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
