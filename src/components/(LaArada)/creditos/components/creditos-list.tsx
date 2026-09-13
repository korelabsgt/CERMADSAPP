"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ClienteCredito } from "../lib/zod";
import { getClienteSlug } from "../lib/slug";
import TablePagination, { PageSizeOption } from "@/components/(LaArada)/lib/pagination";

interface CreditosListProps {
  clientes: ClienteCredito[];
}

const formatDeuda = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CreditosList({ clientes }: CreditosListProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(15);

  const ordenados = useMemo(
    () =>
      [...clientes].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
      ),
    [clientes],
  );

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(ordenados.length / (Number(pageSize) || 15)));
  }, [ordenados.length, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [ordenados.length, pageSize]);

  const pagina = useMemo(() => {
    if (pageSize === "all") return ordenados;
    const size = Number(pageSize) || 15;
    const start = (safeCurrentPage - 1) * size;
    return ordenados.slice(start, start + size);
  }, [ordenados, safeCurrentPage, pageSize]);

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
      <div className="px-6 py-8 text-center text-sm font-bold text-zinc-500 dark:text-zinc-400">
        Sin créditos activos
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[36rem] text-xs md:text-sm text-left">
          <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
            <tr>
              <th className="sticky left-0 z-20 w-[9rem] max-w-[9rem] bg-zinc-50 px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800/60 lg:w-[20rem] lg:max-w-[20rem] lg:px-4 xl:w-[26rem] xl:max-w-[26rem]">
                Cliente
              </th>
              <th className="px-4 py-3">NIT</th>
              <th className="px-4 py-3 text-center">Pendientes</th>
              <th className="px-4 py-3 text-right">Deuda</th>
              <th className="px-4 py-3 w-14" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {pagina.map((cliente) => {
              const slug = getClienteSlug(cliente, clientes);
              const href = `/cermadsa/laarada/creditos/${slug}`;

              return (
                <tr
                  key={cliente.cliente_id}
                  onClick={() => router.push(href)}
                  className="cursor-pointer transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                >
                  <td className="sticky left-0 z-10 w-[9rem] max-w-[9rem] bg-white px-2 py-2.5 text-[11px] font-bold uppercase leading-snug text-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-900 lg:w-[20rem] lg:max-w-[20rem] lg:px-4 lg:py-3 lg:text-sm xl:w-[26rem] xl:max-w-[26rem]">
                    <span className="line-clamp-2">{cliente.nombre}</span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap dark:text-orange-400">
                    {cliente.nit}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors hover:bg-red-100 hover:text-red-600 cursor-pointer dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950 dark:hover:text-red-400"
                      aria-label={`Ver crédito de ${cliente.nombre}`}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50 font-black text-[10px] dark:border-zinc-700 dark:bg-zinc-800/60">
            <tr>
              <td className="sticky left-0 z-10 bg-zinc-50 px-2 py-3 text-zinc-500 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800/60 dark:text-zinc-400 lg:px-4">
                Totales
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-center tabular-nums text-sm">
                <span className="inline-flex rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                  {totalPendientes} Pendientes
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-sm text-red-500 dark:text-red-400">
                Q{formatDeuda(totalDeuda)}
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <TablePagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        totalItems={ordenados.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
