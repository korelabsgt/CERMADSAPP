"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  TrendingDown,
  Calendar,
  DollarSign,
  Tag,
  User,
  History,
  Pencil,
  Trash2,
  Filter,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { useGastos, useGastosCategorias, useDeleteGasto } from "./lib/hooks";
import { GastoItem } from "./lib/zod";
import { MOCK_GASTOS_SIMULADOS } from "./lib/mock-simulados";
import { readLaAradaSimulatedRole, canUsePreventasSimular } from "@/components/(LaArada)/lib/simulated-role";
import TablePagination, { PageSizeOption } from "@/components/(LaArada)/lib/pagination";
import {
  tableShell,
  gastosTableWrap,
  gastosTableScroll,
  gastosTableClass,
  gastosTheadClass,
  gastosTbodyClass,
  gastosRowClass,
  nuevoGastoBtn,
  simularToggleActive,
  simularToggleInactive,
  searchInput,
  actionBtn,
  formatMoney,
  formatFechaHora,
  formatFechaSimple,
  formatFechaCorta,
  formatNombreCorto,
  getCurrentMonthSlashRange,
  formatSlashDateInput,
  parseSlashDate,
} from "./lib/ui";
import { GastosSkeleton } from "./gastos-skeleton";
import GastoModal from "./modals/gasto-modal";
import MovimientosModal from "./modals/movimientos-modal";

const SIMULAR_KEY = "gastos-simular";

export default function Gastos() {
  const router = useRouter();
  const user = useUser();
  const { data: gastos = [], isLoading } = useGastos();
  const { data: categorias = [] } = useGastosCategorias();
  const deleteMutation = useDeleteGasto();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("TODAS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoItem | null>(null);
  const [viewingMovimientosGasto, setViewingMovimientosGasto] = useState<GastoItem | null>(null);
  const [pageSize, setPageSize] = useState<PageSizeOption>(15);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtro por Fechas: Inicializado por defecto en el mes actual ("DD / MM / AA")
  const currentMonthRange = useMemo(() => getCurrentMonthSlashRange(), []);
  const [fechaDesde, setFechaDesde] = useState<string>(currentMonthRange.desde);
  const [fechaHasta, setFechaHasta] = useState<string>(currentMonthRange.hasta);

  const metadata = user?.user_metadata || {};
  const realRole = (metadata.rol || user?.role || "user") as string;
  const [effectiveRole, setEffectiveRole] = useState(() =>
    readLaAradaSimulatedRole(realRole)
  );

  useEffect(() => {
    setEffectiveRole(readLaAradaSimulatedRole(realRole));
    const syncRole = (e?: any) => {
      const newRole = e?.detail || readLaAradaSimulatedRole(realRole);
      setEffectiveRole(newRole);
    };
    window.addEventListener("laarada-simulated-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    window.addEventListener("focus", syncRole);
    return () => {
      window.removeEventListener("laarada-simulated-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
      window.removeEventListener("focus", syncRole);
    };
  }, [realRole]);

  // Roles con acceso al área de gastos: super, admin, ventas
  const allowedRoles = ["super", "admin", "ventas"];
  const hasAccess = allowedRoles.includes(effectiveRole);

  // Permisos:
  // - Super: acceso a todo (ver, crear, editar, eliminar, simular)
  // - Admin: ver, crear y editar (NO eliminar)
  // - Ventas: solo ver y crear (NO editar, NO eliminar)
  const canCrear = allowedRoles.includes(effectiveRole);
  const canEditar = effectiveRole === "super" || effectiveRole === "admin";
  const canEliminar = effectiveRole === "super";
  const isSuper = canUsePreventasSimular(realRole, effectiveRole);

  // Estado de simulación para Super
  const [simular, setSimular] = useState(false);

  useEffect(() => {
    if (!isSuper) {
      setSimular(false);
      sessionStorage.removeItem(SIMULAR_KEY);
      return;
    }
    setSimular(sessionStorage.getItem(SIMULAR_KEY) === "1");
  }, [isSuper]);

  const toggleSimular = () => {
    if (!isSuper) return;
    setSimular((prev) => {
      const next = !prev;
      sessionStorage.setItem(SIMULAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Conjunto de datos a mostrar (reales o simulados)
  const displayGastos = useMemo(() => {
    if (simular) {
      return MOCK_GASTOS_SIMULADOS;
    }
    return gastos;
  }, [simular, gastos]);

  // Filtros
  const filtrados = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const dateDesde = parseSlashDate(fechaDesde, false);
    const dateHasta = parseSlashDate(fechaHasta, true);

    return displayGastos.filter((item) => {
      const matchTerm =
        !term ||
        item.nombre.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term) ||
        (item.created_by && item.created_by.toLowerCase().includes(term)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(term));

      const matchCategoria =
        selectedCategoria === "TODAS" || item.categoria === selectedCategoria;

      let matchFecha = true;
      if (item.fecha && (dateDesde || dateHasta)) {
        const itemDate = new Date(item.fecha);
        if (!isNaN(itemDate.getTime())) {
          if (dateDesde && itemDate < dateDesde) matchFecha = false;
          if (dateHasta && itemDate > dateHasta) matchFecha = false;
        }
      }

      return matchTerm && matchCategoria && matchFecha;
    });
  }, [displayGastos, searchTerm, selectedCategoria, fechaDesde, fechaHasta]);

  // Paginación con selector 15 / 30 / 45 / Todos
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(filtrados.length / (Number(pageSize) || 15)));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria, fechaDesde, fechaHasta, simular, pageSize]);

  const paginatedGastos = useMemo(() => {
    if (pageSize === "all") return filtrados;
    const size = Number(pageSize) || 15;
    const start = (safeCurrentPage - 1) * size;
    return filtrados.slice(start, start + size);
  }, [filtrados, safeCurrentPage, pageSize]);

  // Resumen métricas
  const totalMonto = useMemo(() => {
    return filtrados.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  }, [filtrados]);

  const totalPlanilla = useMemo(() => {
    return filtrados
      .filter((g) => g.categoria.toLowerCase() === "planilla")
      .reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  }, [filtrados]);

  const totalCompras = useMemo(() => {
    return filtrados
      .filter((g) => g.categoria.toLowerCase().includes("compra"))
      .reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);
  }, [filtrados]);

  // Lista de categorías únicas para el filtro
  const categoriasFilterList = useMemo(() => {
    const set = new Set<string>();
    categorias.forEach((c) => set.add(c.categoria));
    displayGastos.forEach((g) => set.add(g.categoria));
    return Array.from(set);
  }, [categorias, displayGastos]);

  // Acciones
  const handleOpenCreate = () => {
    if (!canCrear) return;
    setEditingGasto(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (gasto: GastoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditar) return;
    setEditingGasto(gasto);
    setModalOpen(true);
  };

  const handleOpenMovimientos = (gasto: GastoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingMovimientosGasto(gasto);
  };

  const handleConfirmDelete = async (gasto: GastoItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (gasto.id.startsWith("simulado-")) {
      toast.info("En modo simulación no se eliminan registros de base de datos.");
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Eliminar registro de gasto?",
      html: `¿Está seguro de eliminar el gasto <strong>"${gasto.nombre}"</strong> por <strong>Q${formatMoney(
        gasto.cantidad
      )}</strong>? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      customClass: {
        popup: "!rounded-2xl border border-border dark:border-zinc-700",
        confirmButton:
          "inline-flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 border-0 shadow-none cursor-pointer",
        cancelButton:
          "inline-flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border-0 shadow-none cursor-pointer",
        actions: "flex w-full flex-wrap justify-center gap-2",
      },
      background: isDark ? "#18181b" : "#f4f4f5",
      color: isDark ? "#fafafa" : "#18181b",
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "10001";
      },
    });

    if (!result.isConfirmed) return;

    await deleteMutation.mutateAsync(gasto.id);
  };

  if (isLoading) {
    return <GastosSkeleton />;
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-md p-8 my-16 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-4 shadow-sm">
        <div className="mx-auto size-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
          <TrendingDown className="size-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">Acceso No Autorizado</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          El módulo de Gastos solo está habilitado para usuarios con rol <strong>Super</strong>, <strong>Admin</strong> y <strong>Ventas</strong>.
        </p>
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada")}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-300">
      {/* Header idéntico a preventas */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada")}
          className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </button>
        <div className="min-w-0 text-right">
          <h1 className="text-base md:text-xl font-black uppercase tracking-tight text-foreground">
            Gastos
          </h1>
        </div>
      </div>

      {/* Banner de Simulación (solo si está activo) */}
      {simular && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
            </span>
            <span>
              <strong>Modo Simulación Activo:</strong> Estás previsualizando datos de demostración con 7 gastos, categorías y movimientos (Solo visible para <strong>Super</strong>).
            </span>
          </div>
          <button
            type="button"
            onClick={toggleSimular}
            className="text-xs font-bold underline hover:opacity-80 cursor-pointer self-end sm:self-auto"
          >
            Desactivar Simulación
          </button>
        </div>
      )}

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Gastos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Gastos
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
            Q{formatMoney(totalMonto)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? "registro" : "registros"}
          </p>
        </div>

        {/* Total Planilla */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Planilla
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <User className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
            Q{formatMoney(totalPlanilla)}
          </p>
          <p className="text-[11px] text-muted-foreground">Sueldos y jornales</p>
        </div>

        {/* Total Compras */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Compras
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Tag className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
            Q{formatMoney(totalCompras)}
          </p>
          <p className="text-[11px] text-muted-foreground">Insumos y materiales</p>
        </div>

        {/* Total Registros */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categorías
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
            {categoriasFilterList.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Tipos clasificados</p>
        </div>
      </div>

      {/* Conteo superior como en preventas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-bold">
          <p>
            <span className="text-foreground">Total Gastos: </span>
            <span className="text-zinc-600 dark:text-zinc-300">
              {filtrados.length}
            </span>
          </p>
        </div>

        {/* Table Shell con pestaña roja según solicitud del usuario */}
        <div className={tableShell}>
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700 lg:flex-row lg:items-center">
            {/* Buscador */}
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por concepto, categoría, usuario o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchInput}
              />
            </div>

            {/* Acciones derecha: Filtro de Fechas, Selector de Categoría, Botón Simular (solo Super) y Botón Registrar */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Filtro por Rango de Fechas (formato / /, sin calendarios, por defecto mes actual - ancho completo en teléfono) */}
              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 h-11 text-xs text-foreground shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none shrink-0">
                  Del
                </span>
                <input
                  type="text"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(formatSlashDateInput(e.target.value))}
                  placeholder="01 / 09 / 26"
                  className="w-full sm:w-24 flex-1 sm:flex-initial text-center font-bold text-xs bg-transparent outline-none text-foreground tracking-wider placeholder:text-muted-foreground/50"
                  maxLength={12}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground select-none shrink-0">
                  al
                </span>
                <input
                  type="text"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(formatSlashDateInput(e.target.value))}
                  placeholder="30 / 09 / 26"
                  className="w-full sm:w-24 flex-1 sm:flex-initial text-center font-bold text-xs bg-transparent outline-none text-foreground tracking-wider placeholder:text-muted-foreground/50"
                  maxLength={12}
                />
                {(fechaDesde !== currentMonthRange.desde || fechaHasta !== currentMonthRange.hasta) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFechaDesde(currentMonthRange.desde);
                      setFechaHasta(currentMonthRange.hasta);
                    }}
                    title="Restablecer al mes actual"
                    className="ml-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Contenedor Categoría y Nuevo Gasto (50/50 en teléfono, natural en pantallas grandes) */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="h-11 flex-1 sm:flex-initial sm:w-auto min-w-0 rounded-xl border border-zinc-200 bg-white px-2.5 sm:px-3 text-xs font-semibold text-foreground outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer"
                >
                  <option value="TODAS">Todas las Categorías</option>
                  {categoriasFilterList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Botón Registrar Gasto (solo para roles con permiso de crear: super, admin, ventas) */}
                {canCrear && (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className={cn(
                      nuevoGastoBtn,
                      "flex-1 sm:flex-initial sm:w-auto min-w-0 px-2.5 sm:px-5 justify-center"
                    )}
                  >
                    <Plus className="size-4 shrink-0" />
                    <span className="truncate">Nuevo Gasto</span>
                  </button>
                )}
              </div>

              {/* Botón Simular solo visible para rol Super */}
              {isSuper && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={simular}
                  onClick={toggleSimular}
                  className={cn(
                    simular ? simularToggleActive : simularToggleInactive,
                    "w-auto cursor-pointer"
                  )}
                  title={simular ? "Desactivar modo simulación" : "Simular datos de gastos (Super Admin)"}
                >
                  <span
                    className={cn(
                      "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
                      simular ? "bg-red-600 dark:bg-red-400" : "bg-zinc-400 dark:bg-zinc-500"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block size-3 rounded-full bg-white transition-transform",
                        simular ? "translate-x-3.5" : "translate-x-0.5"
                      )}
                    />
                  </span>
                  Simular
                </button>
              )}
            </div>
          </div>

          {/* Tabla o Estado Vacío */}
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
              <TrendingDown className="size-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-bold uppercase">
                {searchTerm ||
                selectedCategoria !== "TODAS" ||
                fechaDesde !== currentMonthRange.desde ||
                fechaHasta !== currentMonthRange.hasta
                  ? "No se encontraron gastos con los filtros aplicados"
                  : "Sin gastos registrados"}
              </p>
              {searchTerm ||
              selectedCategoria !== "TODAS" ||
              fechaDesde !== currentMonthRange.desde ||
              fechaHasta !== currentMonthRange.hasta ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategoria("TODAS");
                    setFechaDesde(currentMonthRange.desde);
                    setFechaHasta(currentMonthRange.hasta);
                  }}
                  className="mt-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Restablecer filtros al mes actual
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  Crear el primer gasto
                </button>
              )}
            </div>
          ) : (
            <div className={gastosTableScroll}>
              <table className={gastosTableClass}>
                <thead className={gastosTheadClass}>
                  <tr>
                    <th className="sticky left-0 z-20 w-12 bg-zinc-50 px-2 py-3 text-center shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800/60">
                      No.
                    </th>
                    <th className="w-full min-w-[14rem] px-4 py-3 text-left">
                      Concepto
                    </th>
                    <th className="w-[1%] px-3 py-3 whitespace-nowrap text-left">Categoría</th>
                    <th className="w-[1%] px-3 py-3 whitespace-nowrap text-right">Monto</th>
                    <th className="w-[1%] px-3 py-3 whitespace-nowrap text-left">Registro / Fecha</th>
                    <th className="w-[1%] px-2 py-3 whitespace-nowrap text-center">Movs.</th>
                    <th className="w-[1%] px-3 py-3 whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={gastosTbodyClass}>
                  {paginatedGastos.map((gasto, index) => {
                    const movsCount = Array.isArray(gasto.movimientos)
                      ? gasto.movimientos.length
                      : 0;
                    const sizeNum = pageSize === "all" ? filtrados.length : Number(pageSize) || 15;
                    const rowNumber = (safeCurrentPage - 1) * sizeNum + index + 1;

                    return (
                      <tr
                        key={gasto.id}
                        className={gastosRowClass}
                        onClick={(e) => handleOpenEdit(gasto, e)}
                      >
                        {/* No. */}
                        <td className="sticky left-0 z-10 w-12 bg-white px-2 py-2.5 text-center tabular-nums shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-900 lg:py-3">
                          {rowNumber}
                        </td>

                        {/* Concepto (toma todo el espacio disponible) */}
                        <td className="px-4 py-2.5 lg:py-3 text-[12px] lg:text-sm font-bold uppercase leading-snug text-foreground">
                          <div className="flex flex-col">
                            <span>{gasto.nombre}</span>
                            {gasto.descripcion && (
                              <span className="text-[10px] text-muted-foreground font-normal normal-case mt-0.5">
                                {gasto.descripcion}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categoría con distintivo de color (todos con el mismo ancho del más ancho) */}
                        <td className="w-[1%] px-3 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex w-36 items-center justify-center gap-1.5 px-2 py-1 text-xs font-bold rounded-md",
                              gasto.categoria.toLowerCase() === "planilla"
                                ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                : gasto.categoria.toLowerCase().includes("compra")
                                ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                : gasto.categoria.toLowerCase().includes("mantenimiento")
                                ? "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
                                : gasto.categoria.toLowerCase().includes("servicio")
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                : gasto.categoria.toLowerCase().includes("viático") || gasto.categoria.toLowerCase().includes("viatico")
                                ? "border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300"
                                : "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            )}
                          >
                            <Tag className="size-3 shrink-0" />
                            <span>{gasto.categoria}</span>
                          </span>
                        </td>

                        {/* Monto */}
                        <td className="w-[1%] px-3 py-3 text-right font-bold tabular-nums text-red-600 dark:text-red-400 whitespace-nowrap text-sm">
                          Q{formatMoney(gasto.cantidad)}
                        </td>

                        {/* Registro y Fecha (Unificado en 2 líneas: línea 1 fecha, línea 2 Registrado por: nombre) */}
                        <td className="w-[1%] px-3 py-2.5 lg:py-3 whitespace-nowrap text-left">
                          <div className="flex flex-col">
                            <span className="text-xs text-foreground font-semibold tabular-nums">
                              {formatFechaHora(gasto.fecha)}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-normal mt-0.5">
                              Registrado por:{" "}
                              <strong className="font-semibold text-foreground">
                                {formatNombreCorto(gasto.created_by)}
                              </strong>
                            </span>
                          </div>
                        </td>

                        {/* Movs */}
                        <td className="w-[1%] px-2 py-3 text-center tabular-nums whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleOpenMovimientos(gasto, e)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/80 cursor-pointer transition-colors"
                            title="Ver historial de movimientos"
                          >
                            <History className="size-3" />
                            {movsCount}
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="w-[1%] px-3 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {canEditar && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(gasto, e)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                title="Editar gasto"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                            )}

                            {canEliminar && (
                              <button
                                type="button"
                                disabled={deleteMutation.isPending}
                                onClick={(e) => void handleConfirmDelete(gasto, e)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/60 cursor-pointer transition-colors disabled:opacity-50"
                                title="Eliminar gasto"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtrados.length > 0 && (
            <TablePagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filtrados.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Gasto */}
      <GastoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGasto(null);
        }}
        gastoToEdit={editingGasto}
        categorias={categorias}
      />

      {/* Modal Historial Movimientos */}
      <MovimientosModal
        isOpen={!!viewingMovimientosGasto}
        onClose={() => setViewingMovimientosGasto(null)}
        gasto={viewingMovimientosGasto}
      />
    </div>
  );
}
