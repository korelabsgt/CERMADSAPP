"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  Maximize2,
  Minimize2,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { useProducts } from "./lib/hooks";
import ProductModal from "./modals/product-modal";
import StatsAccordion from "./components/stats-accordion";
import TopProductsModal from "./modals/top-products-modal";
import { ProductosSkeleton } from "./productos-skeleton";
import { ProductFormValues } from "./lib/zod";
import { cn } from "@/lib/utils";
import TablePagination, { PageSizeOption } from "@/components/(LaArada)/lib/pagination";

type ProductoCatalogo = ProductFormValues & { id: string };

export default function ListadoProductos() {
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const canViewStats = ["super", "admin"].includes(realRole);
  const tableColSpan = canViewStats ? 7 : 6;

  const { data: productos = [], isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "activos" | "inactivos" | "todos"
  >("activos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<
    ProductoCatalogo | undefined
  >(undefined);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isTopModalOpen, setIsTopModalOpen] = useState(false);

  const filteredProductos = (productos || []).filter((prod: any) => {
    const isActivo = prod.activo !== false;
    const matchesSearch =
      prod.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "activos" && !isActivo) return false;
    if (statusFilter === "inactivos" && isActivo) return false;
    return true;
  });

  const [pageSize, setPageSize] = useState<PageSizeOption>(15);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(filteredProductos.length / (Number(pageSize) || 15)));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProductos = useMemo(() => {
    if (pageSize === "all") return filteredProductos;
    const size = Number(pageSize) || 15;
    const start = (safeCurrentPage - 1) * size;
    return filteredProductos.slice(start, start + size);
  }, [filteredProductos, safeCurrentPage, pageSize]);

  const allExpanded = useMemo(() => {
    if (filteredProductos.length === 0) return false;
    return filteredProductos.every((p: any) => expandedRows[p.id]);
  }, [filteredProductos, expandedRows]);

  const handleEdit = (product: ProductoCatalogo) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const newExpanded: Record<string, boolean> = {};
      filteredProductos.forEach((p: any) => {
        newExpanded[p.id] = true;
      });
      setExpandedRows(newExpanded);
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return <ProductosSkeleton />;
  }

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <Link
          href="/cermadsa/laarada"
          className="group inline-flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </Link>
        <div className="min-w-0 text-right">
          <h1 className="text-base md:text-xl font-black uppercase tracking-tight text-foreground flex items-center justify-end gap-2">
            <Package className="size-5 text-amber-600 dark:text-amber-400" />
            Inventario de Productos
          </h1>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">
          <span className="text-foreground">Total: </span>
          <span className="text-zinc-600 dark:text-zinc-300">
            {filteredProductos.length}
          </span>
        </p>

        <div className="overflow-hidden rounded-t-2xl border border-zinc-200 border-t-4 border-t-amber-600 bg-white shadow-sm dark:border-zinc-700 dark:border-t-amber-500 dark:bg-zinc-900">
          <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700">
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
              <div className="relative min-w-[220px] w-full sm:w-auto flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex bg-muted/40 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 w-full sm:w-auto gap-1">
                <button
                  onClick={() => setStatusFilter("activos")}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === "activos"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  ACTIVOS
                </button>
                <button
                  onClick={() => setStatusFilter("inactivos")}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === "inactivos"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  INACTIVOS
                </button>
                <button
                  onClick={() => setStatusFilter("todos")}
                  className={cn(
                    "flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    statusFilter === "todos"
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  TODOS
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              {canViewStats && (
                <>
                  <button
                    onClick={() => setIsTopModalOpen(true)}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-bold uppercase text-amber-700 transition-colors hover:bg-amber-500/20 cursor-pointer dark:text-amber-400"
                  >
                    <Trophy className="size-4" />
                    TOP 5
                  </button>
                  <button
                    onClick={toggleAll}
                    disabled={filteredProductos.length === 0}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-bold uppercase text-foreground transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50"
                  >
                    {allExpanded ? (
                      <Minimize2 className="size-4 text-blue-500" />
                    ) : (
                      <Maximize2 className="size-4 text-blue-500" />
                    )}
                    {allExpanded ? "CONTRAER" : "EXPANDIR"}
                  </button>
                </>
              )}

              <button
                onClick={handleCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-600 bg-amber-100 px-5 text-xs font-bold uppercase text-amber-700 transition-colors hover:bg-amber-200 cursor-pointer dark:border-amber-400 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
              >
                <Plus className="size-4" />
                NUEVO PRODUCTO
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-[9px] md:text-sm text-left table-fixed sm:table-auto">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr>
                  <th className="w-[10%] md:w-auto px-2 md:px-6 py-3 md:py-4">Cod.</th>
                  <th className="w-[30%] md:w-auto px-2 md:px-6 py-3 md:py-4">Nombre</th>
                  <th className="w-[10%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-center">
                    Unidad
                  </th>
                  <th className="w-[10%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-center">
                    Min.
                  </th>
                  <th className="w-[15%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-center">
                    Stock
                  </th>
                  <th className="w-[15%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-right">
                    Precio
                  </th>
                  {canViewStats && (
                    <th className="w-[10%] md:w-auto px-2 md:px-6 py-3 md:py-4 text-center">
                      Stats
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={tableColSpan}
                      className="px-6 py-8 text-center text-muted-foreground italic"
                    >
                      Cargando productos...
                    </td>
                  </tr>
                ) : filteredProductos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tableColSpan}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No hay resultados.
                    </td>
                  </tr>
                ) : (
                  paginatedProductos.map((prod: any) => {
                    const isLowStock = prod.stock_actual <= prod.stock_minimo;
                    const isExpanded = expandedRows[prod.id];
                    const isActivo = prod.activo !== false;

                    return (
                      <React.Fragment key={prod.id}>
                        <tr
                          onClick={() => handleEdit(prod as ProductoCatalogo)}
                          className={cn(
                            "transition-colors cursor-pointer group",
                            isExpanded ? "bg-muted/30" : "hover:bg-muted/50",
                            !isActivo &&
                              "opacity-50 bg-muted/10 hover:bg-muted/20",
                          )}
                        >
                          <td className="px-2 md:px-6 py-4 font-mono font-bold text-primary truncate">
                            {prod.codigo}
                          </td>
                          <td className="px-2 md:px-6 py-4 font-semibold uppercase truncate">
                            <div className="flex items-center gap-2">
                              {prod.nombre}
                              {!isActivo && (
                                <span className="bg-red-500/10 text-red-500 text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-wider">
                                  INACTIVO
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 md:px-6 py-4 text-center font-medium text-muted-foreground">
                            {prod.medida}
                          </td>
                          <td className="px-2 md:px-6 py-4 text-center font-medium text-muted-foreground">
                            {prod.stock_minimo}
                          </td>
                          <td className="px-2 md:px-6 py-4 text-center">
                            <div
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold",
                                isLowStock
                                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {isLowStock && <AlertTriangle className="size-3" />}
                              {prod.stock_actual}
                            </div>
                          </td>
                          <td className="px-2 md:px-6 py-4 font-black text-foreground text-right whitespace-nowrap">
                            Q{prod.precio_base.toFixed(2)}
                          </td>
                          {canViewStats && (
                            <td className="px-2 md:px-6 py-4 text-center">
                              <button
                                onClick={(e) => toggleRow(prod.id, e)}
                                className={cn(
                                  "p-2 rounded-lg transition-colors cursor-pointer group/btn",
                                  isExpanded
                                    ? "bg-blue-600 text-white shadow-md scale-105"
                                    : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                                )}
                              >
                                <TrendingUp className="size-4 transition-transform" />
                              </button>
                            </td>
                          )}
                        </tr>

                        {isExpanded && canViewStats && (
                          <tr>
                            <td
                              colSpan={tableColSpan}
                              className="p-0 border-b-4 border-blue-500/20"
                            >
                              <div className="bg-muted/10 animate-in slide-in-from-top-2 duration-200 border-x border-border/50 shadow-inner">
                                <StatsAccordion product={prod} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredProductos.length > 0 && (
            <TablePagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredProductos.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
      />
      <TopProductsModal
        isOpen={isTopModalOpen}
        onClose={() => setIsTopModalOpen(false)}
      />
    </div>
  );
}
