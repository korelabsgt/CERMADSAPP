"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type PageSize = 15 | 30 | 45 | "all";

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 45, label: "45" },
  { value: "all", label: "Todos" },
];

interface TablePaginationProps {
  totalItems: number;
  pageSize: PageSize;
  currentPage: number;
  onPageSizeChange: (size: PageSize) => void;
  onPageChange: (page: number) => void;
  className?: string;
}

export function useTablePagination<T>(items: T[], initialPageSize: PageSize = 15) {
  const [pageSize, setPageSize] = useState<PageSize>(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(items.length / pageSize));
  }, [items.length, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  const pageItems = useMemo(() => {
    if (pageSize === "all") return items;
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  return {
    pageSize,
    setPageSize,
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    pageItems,
  };
}

export default function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageSizeChange,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(totalItems / (pageSize || 15)));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-1 sm:justify-end">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={pageSize === "all" || safeCurrentPage <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer dark:hover:bg-zinc-800"
          aria-label="Página anterior"
        >
          &lt;
        </button>
        <span className="min-w-14 text-center text-xs font-bold tabular-nums text-foreground">
          {pageSize === "all" ? "Todos" : `${safeCurrentPage}/${totalPages}`}
        </span>
        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(totalPages, safeCurrentPage + 1))
          }
          disabled={
            pageSize === "all" ||
            safeCurrentPage === totalPages ||
            totalPages === 0
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer dark:hover:bg-zinc-800"
          aria-label="Página siguiente"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
