"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageSizeOption = 15 | 30 | 45 | "all";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: PageSizeOption | number | string;
  onPageSizeChange?: (size: PageSizeOption) => void;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 15,
  onPageSizeChange,
  onPageChange,
  className,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.max(1, Math.min(currentPage, safeTotalPages));
  const count = typeof totalItems === "number" ? totalItems : 0;

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-between border-t border-zinc-200 p-3 sm:p-4 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30",
        className,
      )}
    >
      {/* Selector de cantidad a mostrar: 15 / 30 / 45 / Todos */}
      {onPageSizeChange ? (
        <div className="flex items-center gap-1.5">
          <select
            value={pageSize}
            onChange={(e) => {
              const val =
                e.target.value === "all"
                  ? "all"
                  : (Number(e.target.value) as PageSizeOption);
              onPageSizeChange(val);
            }}
            className="h-8 sm:h-9 rounded-xl border border-zinc-200 bg-white px-2.5 sm:px-3 text-xs font-bold text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer shadow-2xs"
            aria-label="Cantidad a mostrar por página"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value="all">Todos</option>
          </select>
        </div>
      ) : (
        <div />
      )}

      {/* Navegación < 1/1 > */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1 || count === 0 || pageSize === "all"}
          className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer dark:hover:bg-zinc-800"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-10 sm:min-w-12 text-center text-xs font-black tabular-nums text-foreground">
          {pageSize === "all"
            ? "Todos"
            : count === 0
            ? "1/1"
            : `${safeCurrentPage}/${safeTotalPages}`}
        </span>
        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))
          }
          disabled={
            safeCurrentPage >= safeTotalPages || count === 0 || pageSize === "all"
          }
          className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 text-foreground transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer dark:hover:bg-zinc-800"
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

