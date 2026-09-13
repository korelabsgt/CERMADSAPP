"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Tag,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GastoItem } from "@/components/(LaArada)/gastos/lib/zod";

interface BalanceComparativoProps {
  viewMode: "mensual" | "anual";
  selectedYear: number;
  selectedMonth: number;
  orders: any[];
  gastos: GastoItem[];
  daysInMonth: number;
  monthsList: string[];
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formatMoney = (val: number) =>
  Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BalanceComparativo({
  viewMode,
  selectedYear,
  selectedMonth,
  orders = [],
  gastos = [],
  daysInMonth,
  monthsList,
}: BalanceComparativoProps) {
  const isAnual = viewMode === "anual";
  const [activeTab, setActiveTab] = useState<"balance" | "categorias">("balance");
  const [soloConMovimiento, setSoloConMovimiento] = useState(true);

  // 1. Filtrar órdenes válidas (excluyendo anuladas)
  const validOrders = useMemo(() => {
    return (orders || []).filter(
      (o) => String(o.estado || "").toLowerCase().trim() !== "anulado",
    );
  }, [orders]);

  // 2. Cálculos para Modo MENSUAL
  const monthlyData = useMemo(() => {
    const daySalesMap: Record<number, number> = {};
    const dayGastosMap: Record<number, number> = {};
    const dayCountSales: Record<number, number> = {};
    const dayCountGastos: Record<number, number> = {};
    const catGastosMap: Record<string, { total: number; count: number }> = {};

    for (let i = 1; i <= daysInMonth; i++) {
      daySalesMap[i] = 0;
      dayGastosMap[i] = 0;
      dayCountSales[i] = 0;
      dayCountGastos[i] = 0;
    }

    // Sumar ventas por día
    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (!dateString) return;
      if (typeof dateString === "string" && dateString.length === 10) {
        dateString = `${dateString}T12:00:00`;
      }
      const date = new Date(dateString);
      if (
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      ) {
        const day = date.getDate();
        const amount = Number(item.total || 0);
        daySalesMap[day] = (daySalesMap[day] || 0) + amount;
        dayCountSales[day] = (dayCountSales[day] || 0) + 1;
      }
    });

    // Sumar gastos por día y por categoría
    (gastos || []).forEach((gasto) => {
      if (!gasto.fecha) return;
      const date = new Date(gasto.fecha);
      if (
        date.getMonth() === selectedMonth &&
        date.getFullYear() === selectedYear
      ) {
        const day = date.getDate();
        const amount = Number(gasto.cantidad || 0);
        dayGastosMap[day] = (dayGastosMap[day] || 0) + amount;
        dayCountGastos[day] = (dayCountGastos[day] || 0) + 1;

        const cat = (gasto.categoria || "Otros").trim();
        if (!catGastosMap[cat]) {
          catGastosMap[cat] = { total: 0, count: 0 };
        }
        catGastosMap[cat].total += amount;
        catGastosMap[cat].count += 1;
      }
    });

    // Lista de filas por día
    const dailyRows = [];
    let totalMonthSales = 0;
    let totalMonthGastos = 0;
    let totalSalesCount = 0;
    let totalGastosCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const sales = daySalesMap[day] || 0;
      const expenses = dayGastosMap[day] || 0;
      const balance = sales - expenses;
      const margin = sales > 0 ? (balance / sales) * 100 : expenses > 0 ? -100 : 0;
      const countSales = dayCountSales[day] || 0;
      const countExpenses = dayCountGastos[day] || 0;

      totalMonthSales += sales;
      totalMonthGastos += expenses;
      totalSalesCount += countSales;
      totalGastosCount += countExpenses;

      const dateObj = new Date(selectedYear, selectedMonth, day);
      const diaSemana = DIAS_SEMANA[dateObj.getDay()];
      const pad = (n: number) => String(n).padStart(2, "0");
      const fechaLabel = `${diaSemana} ${pad(day)}/${pad(selectedMonth + 1)}`;

      dailyRows.push({
        day,
        fechaLabel,
        sales,
        expenses,
        balance,
        margin,
        countSales,
        countExpenses,
        hasActivity: sales > 0 || expenses > 0,
      });
    }

    const monthBalance = totalMonthSales - totalMonthGastos;
    const monthMargin =
      totalMonthSales > 0
        ? (monthBalance / totalMonthSales) * 100
        : totalMonthGastos > 0
          ? -100
          : 0;

    // Desglose de categorías ordenadas por mayor gasto
    const categoryRows = Object.entries(catGastosMap)
      .map(([categoria, info]) => ({
        categoria,
        total: info.total,
        count: info.count,
        percentOfExpenses:
          totalMonthGastos > 0 ? (info.total / totalMonthGastos) * 100 : 0,
        percentOfRevenue:
          totalMonthSales > 0 ? (info.total / totalMonthSales) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      dailyRows,
      categoryRows,
      totalSales: totalMonthSales,
      totalGastos: totalMonthGastos,
      balance: monthBalance,
      margin: monthMargin,
      totalSalesCount,
      totalGastosCount,
    };
  }, [validOrders, gastos, selectedMonth, selectedYear, daysInMonth]);

  // 3. Cálculos para Modo ANUAL
  const annualData = useMemo(() => {
    const monthSalesMap: Record<number, number> = {};
    const monthGastosMap: Record<number, number> = {};
    const monthCountSales: Record<number, number> = {};
    const monthCountGastos: Record<number, number> = {};
    const catGastosMapYear: Record<string, { total: number; count: number }> = {};

    for (let m = 0; m < 12; m++) {
      monthSalesMap[m] = 0;
      monthGastosMap[m] = 0;
      monthCountSales[m] = 0;
      monthCountGastos[m] = 0;
    }

    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (!dateString) return;
      if (typeof dateString === "string" && dateString.length === 10) {
        dateString = `${dateString}T12:00:00`;
      }
      const date = new Date(dateString);
      if (date.getFullYear() === selectedYear) {
        const m = date.getMonth();
        const amount = Number(item.total || 0);
        monthSalesMap[m] = (monthSalesMap[m] || 0) + amount;
        monthCountSales[m] = (monthCountSales[m] || 0) + 1;
      }
    });

    (gastos || []).forEach((gasto) => {
      if (!gasto.fecha) return;
      const date = new Date(gasto.fecha);
      if (date.getFullYear() === selectedYear) {
        const m = date.getMonth();
        const amount = Number(gasto.cantidad || 0);
        monthGastosMap[m] = (monthGastosMap[m] || 0) + amount;
        monthCountGastos[m] = (monthCountGastos[m] || 0) + 1;

        const cat = (gasto.categoria || "Otros").trim();
        if (!catGastosMapYear[cat]) {
          catGastosMapYear[cat] = { total: 0, count: 0 };
        }
        catGastosMapYear[cat].total += amount;
        catGastosMapYear[cat].count += 1;
      }
    });

    let totalYearSales = 0;
    let totalYearGastos = 0;
    let totalYearSalesCount = 0;
    let totalYearGastosCount = 0;

    const monthRows = [];
    for (let m = 0; m < 12; m++) {
      const sales = monthSalesMap[m] || 0;
      const expenses = monthGastosMap[m] || 0;
      const balance = sales - expenses;
      const margin = sales > 0 ? (balance / sales) * 100 : expenses > 0 ? -100 : 0;
      const countSales = monthCountSales[m] || 0;
      const countExpenses = monthCountGastos[m] || 0;

      totalYearSales += sales;
      totalYearGastos += expenses;
      totalYearSalesCount += countSales;
      totalYearGastosCount += countExpenses;

      monthRows.push({
        monthIndex: m,
        monthName: monthsList[m],
        sales,
        expenses,
        balance,
        margin,
        countSales,
        countExpenses,
        hasActivity: sales > 0 || expenses > 0,
      });
    }

    const yearBalance = totalYearSales - totalYearGastos;
    const yearMargin =
      totalYearSales > 0
        ? (yearBalance / totalYearSales) * 100
        : totalYearGastos > 0
          ? -100
          : 0;

    const categoryRowsYear = Object.entries(catGastosMapYear)
      .map(([categoria, info]) => ({
        categoria,
        total: info.total,
        count: info.count,
        percentOfExpenses:
          totalYearGastos > 0 ? (info.total / totalYearGastos) * 100 : 0,
        percentOfRevenue:
          totalYearSales > 0 ? (info.total / totalYearSales) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      monthRows,
      categoryRowsYear,
      totalSales: totalYearSales,
      totalGastos: totalYearGastos,
      balance: yearBalance,
      margin: yearMargin,
      totalYearSalesCount,
      totalYearGastosCount,
    };
  }, [validOrders, gastos, selectedYear, monthsList]);

  // Selección de datos según modo activo (Mes o Año)
  const activeSummary = isAnual
    ? {
        sales: annualData.totalSales,
        expenses: annualData.totalGastos,
        balance: annualData.balance,
        margin: annualData.margin,
        salesCount: annualData.totalYearSalesCount,
        gastosCount: annualData.totalYearGastosCount,
      }
    : {
        sales: monthlyData.totalSales,
        expenses: monthlyData.totalGastos,
        balance: monthlyData.balance,
        margin: monthlyData.margin,
        salesCount: monthlyData.totalSalesCount,
        gastosCount: monthlyData.totalGastosCount,
      };

  const currentPeriodLabel = isAnual
    ? `Año ${selectedYear}`
    : `${monthsList[selectedMonth]} ${selectedYear}`;

  const displayedDailyRows = isAnual
    ? annualData.monthRows.filter((r) => !soloConMovimiento || r.hasActivity)
    : monthlyData.dailyRows.filter((r) => !soloConMovimiento || r.hasActivity);

  const activeCategoryRows = isAnual
    ? annualData.categoryRowsYear
    : monthlyData.categoryRows;

  const isProfit = activeSummary.balance >= 0;

  return (
    <div className="w-full space-y-4 pt-4 border-t border-border/60">
      {/* Header de la sección de Balance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Scale className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
              <span>Comparativa & Balance Financiero</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {currentPeriodLabel}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Ingresos (Ventas) vs. Egresos (Gastos) con cálculo de margen y utilidad neta
            </p>
          </div>
        </div>

        {/* Pestañas de Vista (Balance Temporal vs. Desglose por Categoría) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-border/50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("balance")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "balance"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="size-3.5" />
            <span>{isAnual ? "Mes a Mes" : "Día a Día"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categorias")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "categorias"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="size-3.5" />
            <span>Gastos por Categoría</span>
          </button>
        </div>
      </div>

      {/* KPI Cards del Balance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Ingresos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Ingresos (Ventas)
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-foreground tabular-nums">
            Q{formatMoney(activeSummary.sales)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeSummary.salesCount} {activeSummary.salesCount === 1 ? "pedido entregado" : "pedidos entregados"}
          </p>
        </div>

        {/* Total Gastos */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Egresos (Gastos)
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
            Q{formatMoney(activeSummary.expenses)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {activeSummary.gastosCount} {activeSummary.gastosCount === 1 ? "gasto registrado" : "gastos registrados"}
          </p>
        </div>

        {/* Balance Neto */}
        <div
          className={cn(
            "rounded-2xl border p-4 shadow-2xs transition-colors",
            isProfit
              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
              : "border-red-200 bg-red-50/50 dark:border-red-900/60 dark:bg-red-950/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Balance Neto
            </span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-lg font-black",
                isProfit
                  ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300"
              )}
            >
              {isProfit ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            </div>
          </div>
          <p
            className={cn(
              "mt-2 text-lg sm:text-xl font-black tabular-nums",
              isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {isProfit ? "+" : ""}Q{formatMoney(activeSummary.balance)}
          </p>
          <div className="mt-0.5 flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                isProfit
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300"
              )}
            >
              {isProfit ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
              {isProfit ? "Superávit" : "Déficit"}
            </span>
          </div>
        </div>

        {/* Margen Operativo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Margen de Ganancia
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
              <Percent className="size-4" />
            </div>
          </div>
          <p
            className={cn(
              "mt-2 text-lg sm:text-xl font-extrabold tabular-nums",
              activeSummary.margin >= 25
                ? "text-emerald-600 dark:text-emerald-400"
                : activeSummary.margin >= 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
            )}
          >
            {activeSummary.margin.toFixed(1)}%
          </p>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                activeSummary.margin >= 25
                  ? "bg-emerald-500"
                  : activeSummary.margin >= 0
                    ? "bg-amber-500"
                    : "bg-red-500"
              )}
              style={{
                width: `${Math.min(100, Math.max(0, activeSummary.margin))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-emerald-600 bg-white shadow-xs dark:border-zinc-700 dark:border-t-emerald-500 dark:bg-zinc-900">
        {/* Barra superior de la tabla */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-200 p-3.5 sm:px-4 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {activeTab === "balance"
                ? isAnual
                  ? "Resumen de Rendimiento Mensual"
                  : "Detalle Diario de Balance"
                : "Consolidado de Egresos por Categoría"}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              ({activeTab === "balance" ? displayedDailyRows.length : activeCategoryRows.length} registros)
            </span>
          </div>

          {activeTab === "balance" && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloConMovimiento}
                onChange={(e) => setSoloConMovimiento(e.target.checked)}
                className="size-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Mostrar solo {isAnual ? "meses" : "días"} con movimiento</span>
            </label>
          )}
        </div>

        {/* Tabla: Pestaña 1 - Balance Temporal */}
        {activeTab === "balance" && (
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[38rem] text-xs md:text-sm text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr>
                  <th className="px-3.5 py-2.5 text-left">{isAnual ? "Mes" : "Día / Fecha"}</th>
                  <th className="px-3.5 py-2.5 text-right">Ingresos (Ventas)</th>
                  <th className="px-3.5 py-2.5 text-right">Egresos (Gastos)</th>
                  <th className="px-3.5 py-2.5 text-right">Balance Neto</th>
                  <th className="px-3.5 py-2.5 text-right">Margen</th>
                  <th className="px-3.5 py-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {displayedDailyRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-semibold text-muted-foreground">
                      No hay movimientos registrados para este período con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  displayedDailyRows.map((row: any) => {
                    const rowIsProfit = row.balance >= 0;
                    return (
                      <tr
                        key={isAnual ? row.monthIndex : row.day}
                        className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                      >
                        {/* Fecha / Mes */}
                        <td className="px-3.5 py-2.5 font-bold text-foreground whitespace-nowrap">
                          {isAnual ? row.monthName : row.fechaLabel}
                        </td>

                        {/* Ingresos */}
                        <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                          {row.sales > 0 ? `Q${formatMoney(row.sales)}` : <span className="text-muted-foreground/60">—</span>}
                        </td>

                        {/* Egresos */}
                        <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-red-600 dark:text-red-400 whitespace-nowrap">
                          {row.expenses > 0 ? `Q${formatMoney(row.expenses)}` : <span className="text-muted-foreground/60">—</span>}
                        </td>

                        {/* Balance Neto */}
                        <td
                          className={cn(
                            "px-3.5 py-2.5 text-right font-extrabold tabular-nums whitespace-nowrap",
                            row.balance === 0
                              ? "text-muted-foreground"
                              : rowIsProfit
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {row.balance > 0 ? `+Q${formatMoney(row.balance)}` : row.balance < 0 ? `-Q${formatMoney(Math.abs(row.balance))}` : "Q0.00"}
                        </td>

                        {/* Margen */}
                        <td className="px-3.5 py-2.5 text-right font-bold tabular-nums whitespace-nowrap">
                          {row.sales > 0 ? (
                            <span
                              className={cn(
                                row.margin >= 25
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : row.margin >= 0
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {row.margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {row.balance > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Rentable
                            </span>
                          ) : row.balance < 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">
                              Déficit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                              Sin saldo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Fila de Totales al final */}
              <tfoot className="border-t-2 border-zinc-200 bg-zinc-50/90 font-black text-xs sm:text-sm text-foreground dark:border-zinc-700 dark:bg-zinc-800/80">
                <tr>
                  <td className="px-3.5 py-3 uppercase tracking-wider">
                    Total {isAnual ? `Año ${selectedYear}` : monthsList[selectedMonth]}
                  </td>
                  <td className="px-3.5 py-3 text-right tabular-nums text-foreground">
                    Q{formatMoney(activeSummary.sales)}
                  </td>
                  <td className="px-3.5 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                    Q{formatMoney(activeSummary.expenses)}
                  </td>
                  <td
                    className={cn(
                      "px-3.5 py-3 text-right tabular-nums font-black",
                      activeSummary.balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {activeSummary.balance >= 0 ? "+" : ""}Q{formatMoney(activeSummary.balance)}
                  </td>
                  <td className="px-3.5 py-3 text-right tabular-nums">
                    {activeSummary.margin.toFixed(1)}%
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase",
                        activeSummary.balance >= 0
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      )}
                    >
                      {activeSummary.balance >= 0 ? "Favorable" : "Déficit"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tabla: Pestaña 2 - Gastos por Categoría */}
        {activeTab === "categorias" && (
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[34rem] text-xs md:text-sm text-left">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr>
                  <th className="px-3.5 py-2.5 text-left">Categoría</th>
                  <th className="px-3.5 py-2.5 text-right">Total Gastado (Q)</th>
                  <th className="px-3.5 py-2.5 text-left">% de Egresos</th>
                  <th className="px-3.5 py-2.5 text-right">Impacto en Ventas</th>
                  <th className="px-3.5 py-2.5 text-center">No. Gastos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activeCategoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-semibold text-muted-foreground">
                      No hay gastos clasificados en este período.
                    </td>
                  </tr>
                ) : (
                  activeCategoryRows.map((catRow) => (
                    <tr
                      key={catRow.categoria}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    >
                      {/* Categoría */}
                      <td className="px-3.5 py-2.5 font-bold text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="size-3.5 text-muted-foreground" />
                          <span>{catRow.categoria}</span>
                        </span>
                      </td>

                      {/* Total Gastado */}
                      <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-red-600 dark:text-red-400 whitespace-nowrap">
                        Q{formatMoney(catRow.total)}
                      </td>

                      {/* % de Egresos con barra */}
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${Math.min(100, catRow.percentOfExpenses)}%` }}
                            />
                          </div>
                          <span className="tabular-nums font-semibold text-xs text-foreground">
                            {catRow.percentOfExpenses.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Impacto en Ventas */}
                      <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-muted-foreground whitespace-nowrap">
                        {activeSummary.sales > 0 ? (
                          <span>{catRow.percentOfRevenue.toFixed(1)}% de ventas</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* No. Gastos */}
                      <td className="px-3.5 py-2.5 text-center font-bold tabular-nums text-foreground whitespace-nowrap">
                        {catRow.count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeCategoryRows.length > 0 && (
                <tfoot className="border-t-2 border-zinc-200 bg-zinc-50/90 font-black text-xs sm:text-sm text-foreground dark:border-zinc-700 dark:bg-zinc-800/80">
                  <tr>
                    <td className="px-3.5 py-3 uppercase tracking-wider">
                      Total Egresos
                    </td>
                    <td className="px-3.5 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                      Q{formatMoney(activeSummary.expenses)}
                    </td>
                    <td className="px-3.5 py-3 font-bold">100.0%</td>
                    <td className="px-3.5 py-3 text-right font-bold">
                      {activeSummary.sales > 0
                        ? `${((activeSummary.expenses / activeSummary.sales) * 100).toFixed(1)}% de ventas`
                        : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-center font-bold">
                      {activeSummary.gastosCount}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
