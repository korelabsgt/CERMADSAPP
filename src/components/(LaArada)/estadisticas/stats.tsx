"use client";

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CalendarDays,
  Layers,
  Droplets,
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  Scale,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { LabelProps } from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fetchMonthlyWeather,
  getCachedMonthlyWeather,
  getWeatherIcon,
  getWeatherEmoji,
  LA_ARADA_LOCATION,
  type DayWeather,
  type WeatherSummary,
} from "@/lib/weather";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadisticasDataSkeleton } from "./estadisticas-skeleton";
import { PeriodPicker, toPeriodKey } from "./PeriodPicker";
import BalanceComparativo from "./BalanceComparativo";
import type { GastoItem } from "@/components/(LaArada)/gastos/lib/zod";

const CHART_COLORS = {
  default: "#4D9FE8",
  max: "#28C07A",
  min: "#E85D5D",
} as const;

const CHART_TABS = [
  {
    id: "balance" as const,
    label: "Balance",
    icon: Scale,
    activeBg: "bg-blue-600 dark:bg-blue-500",
    activeGlow: "shadow-blue-500/25",
  },
  {
    id: "ingresos" as const,
    label: "Ingresos",
    icon: BarChart3,
    activeBg: "bg-emerald-600 dark:bg-emerald-500",
    activeGlow: "shadow-emerald-500/25",
  },
  {
    id: "gastos" as const,
    label: "Egresos",
    icon: TrendingDown,
    activeBg: "bg-orange-500 dark:bg-orange-500",
    activeGlow: "shadow-orange-500/25",
  },
] as const;
const BAR_SIZE_MONTHLY = 32;
const BAR_SIZE_ANNUAL = 48;
const BAR_Z_INDEX = 500;

function formatCompactMoney(val: number) {
  const n = Number(val || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toFixed(0);
}

function formatChartPeakAmount(val: number) {
  return formatCompactMoney(val).replace(/k$/i, "K").replace(/m$/i, "M");
}

function createBarAmountLabel(maxValue: number, minValue: number) {
  return function BarAmountLabel(props: LabelProps) {
    const x = Number(props.x);
    const y = Number(props.y);
    const width = Number(props.width);
    const value = Number(props.value);

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(width) ||
      !value ||
      value <= 0
    ) {
      return <g />;
    }

    const isMax = value === maxValue;
    const isMin = value === minValue && minValue !== maxValue;
    const color = isMax
      ? CHART_COLORS.max
      : isMin
        ? CHART_COLORS.min
        : CHART_COLORS.default;
    const amount = formatChartPeakAmount(value);
    const centerX = x + width / 2;

    if (isMax || isMin) {
      return (
        <g>
          <text
            x={centerX}
            y={y - 16}
            textAnchor="middle"
            fill={color}
            fontSize={9}
            fontWeight={900}
          >
            {isMax ? "MÁX" : "MÍN"}
          </text>
          <text
            x={centerX}
            y={y - 4}
            textAnchor="middle"
            fill={color}
            fontSize={10}
            fontWeight={900}
          >
            {amount}
          </text>
        </g>
      );
    }

    return (
      <text
        x={centerX}
        y={y - 5}
        textAnchor="middle"
        fill={color}
        fontSize={9}
        fontWeight={900}
      >
        {amount}
      </text>
    );
  };
}

function createGastosBarAmountLabel(maxValue: number, minValue: number) {
  return function GastosBarAmountLabel(props: LabelProps) {
    const x = Number(props.x);
    const y = Number(props.y);
    const width = Number(props.width);
    const value = Number(props.value);

    if (
      Number.isNaN(x) ||
      Number.isNaN(y) ||
      Number.isNaN(width) ||
      !value ||
      value <= 0
    ) {
      return <g />;
    }

    const isMax = value === maxValue;
    const isMin = value === minValue && minValue !== maxValue;
    const color = isMax ? "#EA580C" : isMin ? "#FB923C" : "#F97316";
    const amount = `-${formatChartPeakAmount(value)}`;
    const centerX = x + width / 2;

    if (isMax || isMin) {
      return (
        <g>
          <text
            x={centerX}
            y={y - 16}
            textAnchor="middle"
            fill={color}
            fontSize={9}
            fontWeight={900}
          >
            {isMax ? "MÁX" : "MÍN"}
          </text>
          <text
            x={centerX}
            y={y - 4}
            textAnchor="middle"
            fill={color}
            fontSize={10}
            fontWeight={900}
          >
            {amount}
          </text>
        </g>
      );
    }

    return (
      <text
        x={centerX}
        y={y - 5}
        textAnchor="middle"
        fill={color}
        fontSize={9}
        fontWeight={900}
      >
        {amount}
      </text>
    );
  };
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatMoneyAmount(val: number) {
  return Number(val || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CurrencyValue({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="text-[0.55em] font-black opacity-75 align-top mr-px">
        Q
      </span>
      {formatMoneyAmount(amount)}
    </span>
  );
}

type ChartStyle = "balance" | "ingresos" | "gastos";

export default function Stats({
  orders,
  gastos = [],
}: {
  orders: any[];
  gastos?: GastoItem[];
}) {
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();

  const [viewMode, setViewMode] = useState<"mensual" | "anual">("mensual");
  const [chartStyle, setChartStyle] = useState<ChartStyle>("balance");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  const cachedWeather = useMemo(() => {
    return getCachedMonthlyWeather(selectedYear, selectedMonth, daysInMonth);
  }, [selectedYear, selectedMonth, daysInMonth]);

  const [weatherByDay, setWeatherByDay] = useState<
    Record<number, DayWeather>
  >(() => cachedWeather?.days ?? {});
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(
    () => cachedWeather?.summary ?? null,
  );
  const [weatherLoading, setWeatherLoading] = useState(() => !cachedWeather);
  const [weatherHasForecast, setWeatherHasForecast] = useState<boolean | null>(
    () => cachedWeather?.hasForecast ?? null,
  );
  const [expandedBarKey, setExpandedBarKey] = useState<string | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredWeatherDay, setHoveredWeatherDay] = useState<number | null>(
    null,
  );
  const [weatherTooltipPos, setWeatherTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (viewMode !== "mensual") {
      setWeatherByDay({});
      setWeatherSummary(null);
      setWeatherHasForecast(null);
      setWeatherLoading(false);
      return;
    }

    const cached = getCachedMonthlyWeather(selectedYear, selectedMonth, daysInMonth);
    if (cached) {
      setWeatherByDay(cached.days);
      setWeatherSummary(cached.summary);
      setWeatherHasForecast(cached.hasForecast);
      setWeatherLoading(false);
      return;
    }

    let cancelled = false;
    setWeatherLoading(true);
    setWeatherHasForecast(null);

    fetchMonthlyWeather(selectedYear, selectedMonth, daysInMonth)
      .then(({ days, summary, hasForecast }) => {
        if (!cancelled) {
          setWeatherByDay(days);
          setWeatherSummary(summary);
          setWeatherHasForecast(hasForecast);
          setWeatherLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherByDay({});
          setWeatherSummary(null);
          setWeatherHasForecast(false);
          setWeatherLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, selectedYear, selectedMonth, daysInMonth]);

  const validOrders = useMemo(() => {
    return (orders || []).filter(
      (o) => String(o.estado).toLowerCase().trim() !== "anulado",
    );
  }, [orders]);

  const periodsWithData = useMemo(() => {
    const periods = new Set<string>();
    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (!dateString) return;
      if (typeof dateString === "string" && dateString.length === 10) {
        dateString = `${dateString}T12:00:00`;
      }
      const date = new Date(dateString);
      periods.add(toPeriodKey(date.getFullYear(), date.getMonth()));
    });
    gastos.forEach((g: GastoItem) => {
      if (!g.fecha) return;
      let dateString = g.fecha;
      if (typeof dateString === "string" && dateString.length === 10) {
        dateString = `${dateString}T12:00:00`;
      }
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        periods.add(toPeriodKey(date.getFullYear(), date.getMonth()));
      }
    });
    return periods;
  }, [validOrders, gastos]);

  const yearsWithData = useMemo(() => {
    const years = new Set<number>();
    periodsWithData.forEach((key) => {
      years.add(Number(key.split("-")[0]));
    });
    if (years.size === 0) years.add(currentYearVal);
    return Array.from(years).sort((a, b) => b - a);
  }, [periodsWithData, currentYearVal]);

  const chartInfo = useMemo(() => {
    if (validOrders.length === 0)
      return {
        data: [],
        max: 0,
        min: 0,
        avg: 0,
        total: 0,
        maxDayLabel: "N/A",
        minDayLabel: "N/A",
      };

    const dayMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dayMap[i] = 0;
    }

    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (dateString) {
        if (typeof dateString === "string" && dateString.length === 10) {
          dateString = `${dateString}T12:00:00`;
        }

        const date = new Date(dateString);
        if (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        ) {
          const day = date.getDate();
          dayMap[day] += Number(item.total || 0);
        }
      }
    });

    const data = Object.entries(dayMap).map(([day, total]) => ({
      name: day,
      total: total,
    }));

    const values = data.map((d) => d.total).filter((v) => v > 0);
    const max = values.length > 0 ? Math.max(...values) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? total / values.length : 0;

    const maxEntry = data.find((d) => d.total === max && max > 0);
    const minEntry = data.find((d) => d.total === min && min > 0);

    const formatDay = (dayStr: string) => {
      const d = new Date(selectedYear, selectedMonth, Number(dayStr));
      const weekday = d
        .toLocaleDateString("es-GT", { weekday: "long" })
        .replace(".", "")
        .trim();
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayStr}`;
    };

    const maxDayLabel = maxEntry ? formatDay(maxEntry.name) : "N/A";
    const minDayLabel = minEntry ? formatDay(minEntry.name) : "N/A";

    return { data, max, min, avg, total, maxDayLabel, minDayLabel };
  }, [validOrders, daysInMonth, selectedMonth, selectedYear]);

  const yearlyInfo = useMemo(() => {
    if (validOrders.length === 0) return null;

    const yearData = validOrders.filter((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (!d) return false;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";
      return new Date(d).getFullYear() === selectedYear;
    });

    const monthsData = Array.from({ length: 12 }, () => ({
      total: 0,
      days: {} as Record<number, number>,
    }));

    yearData.forEach((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (typeof d === "string" && d.length === 10) d += "T12:00:00";
      const date = new Date(d);
      const m = date.getMonth();
      const day = date.getDate();
      const amount = Number(item.total || 0);

      monthsData[m].total += amount;
      monthsData[m].days[day] = (monthsData[m].days[day] || 0) + amount;
    });

    const processedMonths = monthsData.map((m, index) => {
      const daysInM = new Date(selectedYear, index + 1, 0).getDate();
      const fullDailyValues = [];
      for (let i = 1; i <= daysInM; i++) {
        fullDailyValues.push(m.days[i] || 0);
      }

      const dailyValues = fullDailyValues.filter((v) => v > 0);
      const max = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
      const min = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;
      const avg = daysInM > 0 ? m.total / daysInM : 0;

      const isValid =
        selectedYear < currentYearVal ||
        (selectedYear === currentYearVal && index <= currentMonthIdx);

      return {
        index,
        name: MONTHS[index],
        shortName: MONTHS[index].substring(0, 3),
        total: m.total,
        max,
        min,
        avg,
        isValid,
      };
    });

    const validMonths = processedMonths.filter((m) => m.isValid);
    if (validMonths.length === 0) return null;

    const monthsWithSales = validMonths.filter((m) => m.total > 0);

    const highestMonth =
      monthsWithSales.length > 0
        ? monthsWithSales.reduce(
            (prev, curr) => (curr.total > prev.total ? curr : prev),
            monthsWithSales[0],
          )
        : null;

    const lowestMonth =
      monthsWithSales.length > 0
        ? monthsWithSales.reduce(
            (prev, curr) => (curr.total < prev.total ? curr : prev),
            monthsWithSales[0],
          )
        : null;

    const totalYear = yearData.reduce(
      (acc, curr) => acc + Number(curr.total || 0),
      0,
    );
    const avgYear =
      monthsWithSales.length > 0 ? totalYear / monthsWithSales.length : 0;

    const chartData = processedMonths.map((m) => ({
      name: m.shortName,
      fullName: m.name,
      total: m.total,
    }));

    const maxMonthlyTotal = highestMonth ? highestMonth.total : 0;
    const minMonthlyTotal = lowestMonth ? lowestMonth.total : 0;

    return {
      totalYear,
      avgYear,
      highestMonth,
      lowestMonth,
      chartData,
      maxMonthlyTotal,
      minMonthlyTotal,
    };
  }, [validOrders, selectedYear, currentYearVal, currentMonthIdx]);

  const isAnual = viewMode === "anual";
  const currentGraphData = isAnual
    ? yearlyInfo?.chartData || []
    : chartInfo.data;
  const currentMax = isAnual ? yearlyInfo?.maxMonthlyTotal || 0 : chartInfo.max;
  const currentMin = isAnual ? yearlyInfo?.minMonthlyTotal || 0 : chartInfo.min;
  const currentAvg = isAnual ? yearlyInfo?.avgYear || 0 : chartInfo.avg;
  const monthlyCalendarAvg = isAnual
    ? yearlyInfo?.avgYear || 0
    : daysInMonth > 0
      ? chartInfo.total / daysInMonth
      : 0;
  const totalRevenue = isAnual
    ? yearlyInfo?.totalYear || 0
    : chartInfo.total;

  const gastosDayMap = useMemo(() => {
    const map: Record<number, number> = {};
    if (!gastos || isAnual) return map;
    gastos.forEach((g) => {
      if (!g.fecha) return;
      const parts = String(g.fecha).split("T")[0].split("-");
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2]);
        if (y === selectedYear && m === selectedMonth) {
          map[d] = (map[d] || 0) + Number(g.cantidad || 0);
        }
      }
    });
    return map;
  }, [gastos, selectedYear, selectedMonth, isAnual]);

  const gastosMesMap = useMemo(() => {
    const map: Record<number, number> = {};
    if (!gastos) return map;
    gastos.forEach((g) => {
      if (!g.fecha) return;
      const parts = String(g.fecha).split("T")[0].split("-");
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        if (y === selectedYear) {
          map[m] = (map[m] || 0) + Number(g.cantidad || 0);
        }
      }
    });
    return map;
  }, [gastos, selectedYear]);

  const totalGastosPeriodo = useMemo(() => {
    if (isAnual) {
      return Object.values(gastosMesMap).reduce((acc, v) => acc + v, 0);
    }
    return Object.values(gastosDayMap).reduce((acc, v) => acc + v, 0);
  }, [isAnual, gastosMesMap, gastosDayMap]);

  const balancePeriodo = totalRevenue - totalGastosPeriodo;

  const maxGasto = useMemo(() => {
    if (isAnual) {
      const vals = Object.values(gastosMesMap);
      return vals.length > 0 ? Math.max(...vals, 0) : 0;
    }
    const vals = Object.values(gastosDayMap);
    return vals.length > 0 ? Math.max(...vals, 0) : 0;
  }, [isAnual, gastosMesMap, gastosDayMap]);

  const chartDataWithWeather = useMemo(() => {
    if (isAnual) {
      return (currentGraphData || []).map((d: any, idx: number) => {
        const g = gastosMesMap[idx] || 0;
        return {
          ...d,
          gastos: g,
          balance: Number(d.total || 0) - g,
        };
      });
    }
    return (currentGraphData || []).map((d: any) => {
      const dayNum = Number(d.name);
      const g = gastosDayMap[dayNum] || 0;
      return {
        ...d,
        gastos: g,
        balance: Number(d.total || 0) - g,
        weather: weatherByDay[dayNum] ?? null,
      };
    });
  }, [currentGraphData, isAnual, weatherByDay, gastosDayMap, gastosMesMap]);

  useEffect(() => {
    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setExpandedBarKey(null);
  }, [selectedMonth, selectedYear, viewMode, weatherLoading]);

  const barSize = isAnual ? BAR_SIZE_ANNUAL : BAR_SIZE_MONTHLY;

  const barAmountLabel = useMemo(
    () => createBarAmountLabel(currentMax, currentMin),
    [currentMax, currentMin],
  );

  const gastosStats = useMemo(() => {
    const rawVals = isAnual
      ? Object.values(gastosMesMap)
      : Object.values(gastosDayMap);
    const positiveVals = rawVals.filter((v) => v > 0);
    const max = positiveVals.length > 0 ? Math.max(...positiveVals) : 0;
    const min = positiveVals.length > 0 ? Math.min(...positiveVals) : 0;
    const total = totalGastosPeriodo;
    const avg =
      positiveVals.length > 0
        ? total / positiveVals.length
        : 0;
    return { max, min, total, avg };
  }, [isAnual, gastosMesMap, gastosDayMap, totalGastosPeriodo]);

  const totalGastosAnual = useMemo(() => {
    return Object.values(gastosMesMap).reduce((acc, v) => acc + v, 0);
  }, [gastosMesMap]);

  const gastosYearlyAvg = totalGastosAnual / 12;
  const gastosMonthlyCalendarAvg =
    daysInMonth > 0 ? totalGastosPeriodo / daysInMonth : 0;

  const gastosBarAmountLabel = useMemo(
    () => createGastosBarAmountLabel(gastosStats.max, gastosStats.min),
    [gastosStats.max, gastosStats.min],
  );

  const chartYMax = useMemo(() => {
    let peak = 1;
    if (chartStyle === "gastos") {
      peak = Math.max(gastosStats.max, gastosStats.avg, 1);
    } else if (chartStyle === "balance") {
      peak = Math.max(currentMax, maxGasto, currentAvg, 1);
    } else {
      peak = Math.max(currentMax, currentAvg, 1);
    }
    const padded = peak * 1.15;
    if (padded <= 10_000) return Math.ceil(padded / 2_000) * 2_000;
    if (padded <= 50_000) return Math.ceil(padded / 5_000) * 5_000;
    if (padded <= 200_000) return Math.ceil(padded / 10_000) * 10_000;
    return Math.ceil(padded / 50_000) * 50_000;
  }, [currentMax, maxGasto, currentAvg, chartStyle, gastosStats]);

  const weatherAxisHeight = isAnual ? 28 : 52;
  const desktopChartHeight = isAnual ? 400 : 430;

  const handleWeatherHover = useCallback(
    (day: number, x: number, y: number) => {
      setHoveredWeatherDay(day);
      setWeatherTooltipPos({ x, y });
    },
    [],
  );

  const handleWeatherLeave = useCallback(() => {
    setHoveredWeatherDay(null);
  }, []);

  const showDataSkeleton = false;

  return (
    <div className="w-full flex flex-col gap-3 relative text-foreground animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center shrink-0 gap-2">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <Link
            href="/cermadsa/laarada"
            className="group inline-flex shrink-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-4.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Volver
            </span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-bold uppercase text-xs md:text-sm tracking-widest">
            <TrendingUp className="size-4 shrink-0 text-orange-500" />
            <span>Análisis de Operaciones</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-background p-0.5 rounded-lg border border-border/50 shadow-sm">
            <button
              onClick={() => setViewMode("mensual")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all flex items-center gap-1.5",
                !isAnual
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <CalendarDays className="size-3" /> Mes
            </button>
            <button
              onClick={() => setViewMode("anual")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all flex items-center gap-1.5",
                isAnual
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Layers className="size-3" /> Año
            </button>
          </div>

          <PeriodPicker
            mode={isAnual ? "anual" : "mensual"}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            periodsWithData={periodsWithData}
            yearsWithData={yearsWithData}
            onSelectMonth={(year, month) => {
              setSelectedYear(year);
              setSelectedMonth(month);
            }}
            onSelectYear={setSelectedYear}
          />
        </div>
      </div>

      {showDataSkeleton ? (
        <EstadisticasDataSkeleton />
      ) : (
        <>
        {!isAnual && (
          <div className="rounded-lg border border-border/50 overflow-hidden shrink-0">
            <WeatherSummaryBanner
              summary={weatherSummary}
              hasForecast={weatherHasForecast}
              daysInMonth={daysInMonth}
              loading={weatherLoading}
            />
          </div>
        )}

      <div className="w-full bg-background rounded-xl p-3 md:p-4 border border-border/50 relative shadow-sm">
        {hoveredWeatherDay !== null && weatherByDay[hoveredWeatherDay] && (
          <div className="hidden md:block">
            <WeatherTooltipCard
              day={hoveredWeatherDay}
              weather={weatherByDay[hoveredWeatherDay]}
              monthName={MONTHS[selectedMonth]}
              x={weatherTooltipPos.x}
              y={weatherTooltipPos.y}
            />
          </div>
        )}
        {/* Header con Switch de Gráfica: Balance (azul), Ingresos (verde), Egresos (naranja) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-border/40">
          <div className="flex items-center gap-3">
            {chartStyle === "balance" ? (
              <div className="flex flex-wrap items-center gap-2.5 font-bold text-xs">
                <div className="hidden sm:flex items-center gap-1.5 text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px] font-black">
                  <Scale className="size-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Balance</span>
                  <span className="text-muted-foreground/40 font-normal">|</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#10B981]">
                  <span className="size-2.5 rounded-full bg-[#10B981] ring-2 ring-[#10B981]/20" />
                  <span>Ingresos (Ventas)</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#F97316]">
                  <span className="size-2.5 rounded-full bg-[#F97316] ring-2 ring-[#F97316]/20" />
                  <span>Egresos (Gastos)</span>
                </div>
              </div>
            ) : chartStyle === "ingresos" ? (
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-[11px]">
                <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Gráfica de Ingresos</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 text-[11px]">
                <TrendingDown className="size-4 text-orange-500" />
                <span>Gráfica de Egresos</span>
              </div>
            )}
          </div>

          <div className="relative flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 shadow-xs">
            {CHART_TABS.map((tab) => {
              const isActive = chartStyle === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartStyle(tab.id)}
                  className="relative px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer select-none"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeChartTabPill"
                      className={cn(
                        "absolute inset-0 rounded-lg shadow-sm transition-colors duration-300",
                        tab.activeBg,
                        tab.activeGlow,
                      )}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex items-center gap-1.5 transition-colors duration-200",
                      isActive
                        ? "text-white font-black"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={chartStyle}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full"
          >
            {currentGraphData.length === 0 && (chartStyle !== "gastos" || totalGastosPeriodo === 0) ? (
              <div className="h-[min(65vh,480px)] md:min-h-[420px] flex items-center justify-center text-muted-foreground font-bold uppercase border-2 border-dashed border-border rounded-xl text-center px-4 text-sm">
                Sin entregas registradas en este periodo
              </div>
            ) : chartStyle === "balance" ? (
              <>
                {/* Resumen Superior para Vista Balance */}
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-8 mb-2 text-[11px] font-black uppercase tracking-wider text-center">
                  <span className="text-[#10B981] inline-flex items-baseline gap-1">
                    Ingresos:
                    <CurrencyValue amount={totalRevenue} />
                  </span>
                  <span className="text-[#F97316] inline-flex items-baseline gap-1">
                    Egresos:
                    <CurrencyValue amount={totalGastosPeriodo} />
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-baseline gap-1 px-2 py-0.5 rounded-md font-bold",
                      balancePeriodo >= 0
                        ? "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20"
                        : "text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20",
                    )}
                  >
                    Balance:
                    {balancePeriodo >= 0 ? "+" : ""}
                    <CurrencyValue amount={balancePeriodo} />
                  </span>
                </div>

            {/* Móvil: Scroll horizontal para apreciar con claridad todos los puntos y clima */}
            <div className="md:hidden w-full overflow-x-auto pb-2 -mx-1 px-1">
              {!isAnual && (
                <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  👉 Desliza para explorar todos los días y clima
                </p>
              )}
              <div
                style={{
                  width: isAnual ? "100%" : `${Math.max(daysInMonth * 26, 680)}px`,
                  height: 380,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartDataWithWeather}
                    margin={{
                      top: 24,
                      right: 18,
                      left: 0,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical
                      horizontal
                      stroke="#88888828"
                    />
                    <XAxis
                      dataKey="name"
                      height={weatherAxisHeight}
                      tickMargin={0}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={
                        !isAnual
                          ? (props) => (
                              <WeatherAxisTick
                                {...props}
                                weatherByDay={weatherByDay}
                                onHover={handleWeatherHover}
                                onLeave={handleWeatherLeave}
                              />
                            )
                          : { fill: "#888", fontWeight: "900", dy: 10 }
                      }
                      interval={0}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, chartYMax]}
                      tick={{ fill: "#888", fontWeight: "900" }}
                      tickFormatter={(val) => formatCompactMoney(val)}
                    />
                    <Tooltip
                      cursor={{
                        stroke: "#88888860",
                        strokeDasharray: "3 3",
                        strokeWidth: 1,
                      }}
                      offset={28}
                      wrapperStyle={{ zIndex: 50, outline: "none" }}
                      content={
                        <ChartTooltipContent
                          isAnual={isAnual}
                          selectedMonth={selectedMonth}
                          selectedYear={selectedYear}
                          chartType="balance"
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="gastos"
                      name="Egresos"
                      stroke="#F97316"
                      strokeWidth={2.5}
                      dot={{
                        r: 3.5,
                        strokeWidth: 2,
                        fill: "#F97316",
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: "#F97316",
                        stroke: "#ffffff",
                      }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Ingresos"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{
                        r: 3.5,
                        strokeWidth: 2,
                        fill: "#10B981",
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: "#10B981",
                        stroke: "#ffffff",
                      }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Escritorio: Ancho completo */}
            <div className="hidden md:block w-full" style={{ height: desktopChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartDataWithWeather}
                  margin={{
                    top: 24,
                    right: 24,
                    left: 8,
                    bottom: 8,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical
                    horizontal
                    stroke="#88888828"
                  />
                  <XAxis
                    dataKey="name"
                    height={weatherAxisHeight}
                    tickMargin={0}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={
                      !isAnual
                        ? (props) => (
                            <WeatherAxisTick
                              {...props}
                              weatherByDay={weatherByDay}
                              onHover={handleWeatherHover}
                              onLeave={handleWeatherLeave}
                            />
                          )
                        : { fill: "#888", fontWeight: "900", dy: 10 }
                    }
                    interval={0}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, chartYMax]}
                    tick={{ fill: "#888", fontWeight: "900" }}
                    tickFormatter={(val) =>
                      `Q${Number(val).toLocaleString("en-US")}`
                    }
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#88888860",
                      strokeDasharray: "3 3",
                      strokeWidth: 1,
                    }}
                    offset={28}
                    wrapperStyle={{ zIndex: 50, outline: "none" }}
                    content={
                      <ChartTooltipContent
                        isAnual={isAnual}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        chartType="balance"
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    name="Egresos"
                    stroke="#F97316"
                    strokeWidth={2.75}
                    dot={{
                      r: 3.5,
                      strokeWidth: 2,
                      fill: "#F97316",
                      stroke: "#ffffff",
                    }}
                    activeDot={{
                      r: 6.5,
                      strokeWidth: 2.5,
                      fill: "#F97316",
                      stroke: "#ffffff",
                    }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Ingresos"
                    stroke="#10B981"
                    strokeWidth={2.75}
                    dot={{
                      r: 3.5,
                      strokeWidth: 2,
                      fill: "#10B981",
                      stroke: "#ffffff",
                    }}
                    activeDot={{
                      r: 6.5,
                      strokeWidth: 2.5,
                      fill: "#10B981",
                      stroke: "#ffffff",
                    }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : chartStyle === "ingresos" ? (
          <>
            <div className="md:hidden w-full">
              <MobileBarChart
                data={chartDataWithWeather}
                max={currentMax}
                min={currentMin}
                avg={currentAvg}
                isAnual={isAnual}
                selectedMonth={selectedMonth}
                weatherByDay={weatherByDay}
                expandedKey={expandedBarKey}
                onToggleExpand={setExpandedBarKey}
                scrollRef={mobileScrollRef}
                variant="ingresos"
              />
            </div>

            <div className="hidden md:block w-full">
              {(currentMax > 0 || currentMin > 0 || currentAvg > 0) && (
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-8 mb-2 text-[11px] font-black uppercase tracking-wider text-center">
                  {currentMax > 0 && (
                    <span className="text-[#28C07A] inline-flex items-baseline gap-1">
                      Max:
                      <CurrencyValue amount={currentMax} />
                    </span>
                  )}
                  {currentMin > 0 && (
                    <span className="text-[#E85D5D] inline-flex items-baseline gap-1">
                      Min:
                      <CurrencyValue amount={currentMin} />
                    </span>
                  )}
                  {currentAvg > 0 && (
                    <span className="text-[#4D9FE8] inline-flex items-baseline gap-1">
                      Prom:
                      <CurrencyValue amount={currentAvg} />
                    </span>
                  )}
                </div>
              )}
              <div className="w-full" style={{ height: desktopChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartDataWithWeather}
                  margin={{
                    top: 24,
                    right: 24,
                    left: 8,
                    bottom: 8,
                  }}
                  barCategoryGap={!isAnual ? "6%" : "12%"}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical
                    horizontal
                    stroke="#88888828"
                  />
                  <XAxis
                    dataKey="name"
                    height={weatherAxisHeight}
                    tickMargin={0}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={
                      !isAnual
                        ? (props) => (
                            <WeatherAxisTick
                              {...props}
                              weatherByDay={weatherByDay}
                              onHover={handleWeatherHover}
                              onLeave={handleWeatherLeave}
                            />
                          )
                        : { fill: "#888", fontWeight: "900", dy: 10 }
                    }
                    interval={0}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, chartYMax]}
                    tick={{ fill: "#888", fontWeight: "900" }}
                    tickFormatter={(val) =>
                      `Q${Number(val).toLocaleString("en-US")}`
                    }
                  />
                  <Tooltip
                    cursor={{ fill: `${CHART_COLORS.default}20` }}
                    offset={28}
                    wrapperStyle={{ zIndex: 50, outline: "none" }}
                    content={
                      <ChartTooltipContent
                        isAnual={isAnual}
                        selectedMonth={selectedMonth}
                        selectedYear={selectedYear}
                        chartType="ingresos"
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={barSize}
                    minPointSize={2}
                    isAnimationActive={false}
                    activeBar={false}
                    zIndex={BAR_Z_INDEX}
                  >
                    {chartDataWithWeather.map((entry, index) => {
                      const hasSales = entry.total > 0;
                      const isMax = hasSales && entry.total === currentMax;
                      const isMin = hasSales && entry.total === currentMin;
                      return (
                        <Cell
                          key={`bar-${index}`}
                          fill={
                            !hasSales
                              ? "transparent"
                              : isMax
                                ? CHART_COLORS.max
                                : isMin
                                  ? CHART_COLORS.min
                                  : CHART_COLORS.default
                          }
                        />
                      );
                    })}
                    <LabelList
                      dataKey="total"
                      content={barAmountLabel}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* View 3: Gastos (BarChart con números negativos en el eje Y) */}
            <div className="md:hidden w-full">
              <MobileBarChart
                data={chartDataWithWeather}
                max={gastosStats.max}
                min={gastosStats.min}
                avg={gastosStats.avg}
                isAnual={isAnual}
                selectedMonth={selectedMonth}
                weatherByDay={weatherByDay}
                expandedKey={expandedBarKey}
                onToggleExpand={setExpandedBarKey}
                scrollRef={mobileScrollRef}
                variant="gastos"
              />
            </div>

            <div className="hidden md:block w-full">
              {(gastosStats.max > 0 || gastosStats.min > 0 || gastosStats.avg > 0) && (
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-8 mb-2 text-[11px] font-black uppercase tracking-wider text-center">
                  {gastosStats.max > 0 && (
                    <span className="text-[#EA580C] inline-flex items-baseline gap-1">
                      Max:
                      <span>-Q{formatMoneyAmount(gastosStats.max)}</span>
                    </span>
                  )}
                  {gastosStats.min > 0 && (
                    <span className="text-[#FB923C] inline-flex items-baseline gap-1">
                      Min:
                      <span>-Q{formatMoneyAmount(gastosStats.min)}</span>
                    </span>
                  )}
                  {gastosStats.avg > 0 && (
                    <span className="text-[#F97316] inline-flex items-baseline gap-1">
                      Prom:
                      <span>-Q{formatMoneyAmount(gastosStats.avg)}</span>
                    </span>
                  )}
                </div>
              )}
              <div className="w-full" style={{ height: desktopChartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataWithWeather}
                    margin={{
                      top: 24,
                      right: 24,
                      left: 8,
                      bottom: 8,
                    }}
                    barCategoryGap={!isAnual ? "6%" : "12%"}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical
                      horizontal
                      stroke="#88888828"
                    />
                    <XAxis
                      dataKey="name"
                      height={weatherAxisHeight}
                      tickMargin={0}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={
                        !isAnual
                          ? (props) => (
                              <WeatherAxisTick
                                {...props}
                                weatherByDay={weatherByDay}
                                onHover={handleWeatherHover}
                                onLeave={handleWeatherLeave}
                              />
                            )
                          : { fill: "#888", fontWeight: "900", dy: 10 }
                      }
                      interval={0}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, chartYMax]}
                      tick={{ fill: "#888", fontWeight: "900" }}
                      tickFormatter={(val) =>
                        Number(val) === 0
                          ? "Q0"
                          : `-Q${Number(val).toLocaleString("en-US")}`
                      }
                    />
                    <Tooltip
                      cursor={{ fill: `#F9731618` }}
                      offset={28}
                      wrapperStyle={{ zIndex: 50, outline: "none" }}
                      content={
                        <ChartTooltipContent
                          isAnual={isAnual}
                          selectedMonth={selectedMonth}
                          selectedYear={selectedYear}
                          chartType="gastos"
                        />
                      }
                    />
                    <Bar
                      dataKey="gastos"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={barSize}
                      minPointSize={2}
                      isAnimationActive={false}
                      activeBar={false}
                      zIndex={BAR_Z_INDEX}
                    >
                      {chartDataWithWeather.map((entry, index) => {
                        const hasGasto = (entry.gastos || 0) > 0;
                        const isMax = hasGasto && entry.gastos === gastosStats.max;
                        const isMin = hasGasto && entry.gastos === gastosStats.min;
                        return (
                          <Cell
                            key={`bar-gasto-${index}`}
                            fill={
                              !hasGasto
                                ? "transparent"
                                : isMax
                                  ? "#EA580C"
                                  : isMin
                                    ? "#FB923C"
                                    : "#F97316"
                            }
                          />
                        );
                      })}
                      <LabelList
                        dataKey="gastos"
                        content={gastosBarAmountLabel}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
          </motion.div>
        </AnimatePresence>
        {!isAnual && !weatherLoading && weatherHasForecast === false && (
          <ChartClimateFooter variant="empty">
            Aún no hay pronóstico de clima disponible para {MONTHS[selectedMonth]}{" "}
            {selectedYear}
          </ChartClimateFooter>
        )}
        {!isAnual && !weatherLoading && weatherHasForecast && (
          <ChartClimateFooter />
        )}
      </div>

      <BalanceComparativo
        viewMode={viewMode}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        orders={validOrders}
        gastos={gastos}
        daysInMonth={daysInMonth}
        monthsList={MONTHS}
      />
        </>
      )}
    </div>
  );
}

function WeatherSummaryBanner({
  summary,
  hasForecast,
  daysInMonth,
  loading,
}: {
  summary: WeatherSummary | null;
  hasForecast: boolean | null;
  daysInMonth: number;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="px-4 md:px-5 py-3 md:py-4 bg-muted/20 flex items-center gap-3.5">
        <Skeleton className="size-12 md:size-14 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
    );
  }

  if (!summary || !hasForecast) {
    return (
      <div className="px-4 md:px-5 py-3 md:py-4 bg-muted/20">
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium leading-tight">
          <span className="text-muted-foreground">—</span>
          Clima · {LA_ARADA_LOCATION}
        </p>
        <p className="text-base font-semibold text-muted-foreground mt-1">
          Sin pronóstico disponible
        </p>
        <p className="text-sm text-muted-foreground/70 mt-0.5 italic">
          Aún no hay pronóstico para este mes
        </p>
      </div>
    );
  }

  const Icon = getWeatherIcon(summary.dominantCode);

  return (
    <div className="px-4 md:px-5 py-4 md:py-4 bg-gradient-to-r from-sky-500/[0.07] via-sky-500/[0.03] to-transparent flex items-center gap-3.5 md:items-start md:gap-5">
      <div className="size-12 md:size-14 shrink-0 rounded-2xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
        <Icon className="size-6 md:size-7 text-sky-500" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground font-medium leading-tight">
          Clima del mes · {LA_ARADA_LOCATION}
        </p>
        <p className="text-2xl font-bold tabular-nums mt-1 leading-none">
          {summary.avgTempMin.toFixed(0)}° – {summary.avgTempMax.toFixed(0)}°C
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-xs md:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {summary.dominantLabel}
          </span>
          {summary.totalPrecipitation > 0 && (
            <span className="flex items-center gap-1">
              <Droplets className="size-3.5 text-sky-500" />
              {summary.totalPrecipitation.toFixed(1)} mm
            </span>
          )}
          <span>
            {summary.daysWithData >= daysInMonth
              ? "Mes completo"
              : `${summary.daysWithData}/${daysInMonth} días`}
          </span>
        </div>
        {summary.rainyDays > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {summary.rainyDays} días lluviosos
          </p>
        )}
      </div>
    </div>
  );
}

function MobileBarChart({
  data,
  max,
  min,
  avg,
  isAnual,
  selectedMonth,
  weatherByDay,
  expandedKey,
  onToggleExpand,
  scrollRef,
  variant = "ingresos",
}: {
  data: Array<{
    name: string;
    total: number;
    gastos?: number;
    fullName?: string;
    weather?: DayWeather | null;
  }>;
  max: number;
  min: number;
  avg: number;
  isAnual: boolean;
  selectedMonth: number;
  weatherByDay: Record<number, DayWeather>;
  expandedKey: string | null;
  onToggleExpand: (key: string | null) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  variant?: "ingresos" | "gastos";
}) {
  const isGastos = variant === "gastos";
  const scaleMax = max > 0 ? max : 1;

  return (
    <div className="space-y-2">
      {max > 0 && (
        <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-1 text-xs font-bold uppercase tracking-wide text-center text-muted-foreground">
          <span className={isGastos ? "text-[#EA580C]" : "text-[#28C07A]"}>
            Max {isGastos ? "-" : ""}Q{formatCompactMoney(max)}
          </span>
          {min > 0 && (
            <span className={isGastos ? "text-[#FB923C]" : "text-[#E85D5D]"}>
              Min {isGastos ? "-" : ""}Q{formatCompactMoney(min)}
            </span>
          )}
          {avg > 0 && (
            <span className={isGastos ? "text-[#F97316]" : "text-[#4D9FE8]"}>
              Prom {isGastos ? "-" : ""}Q{formatCompactMoney(avg)}
            </span>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="max-h-[65vh] overflow-y-auto overscroll-contain space-y-0.5 pr-1 -mr-1"
      >
        {data.map((entry) => {
          const key = entry.name;
          const day = Number(entry.name);
          const weather =
            entry.weather ?? (!isAnual ? weatherByDay[day] : null);
          const val = isGastos ? Number(entry.gastos || 0) : entry.total;
          const hasVal = val > 0;
          const barPct = hasVal
            ? Math.max((val / scaleMax) * 100, 4)
            : 0;
          const isMax = hasVal && val === max;
          const isMin = hasVal && val === min;
          const isExpanded = expandedKey === key;

          return (
            <div key={key} className="rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleExpand(isExpanded ? null : key)}
                className={cn(
                  "w-full flex items-center gap-2 py-1.5 px-2 text-left transition-colors duration-200",
                  isExpanded ? "bg-muted/60" : "active:bg-muted/40",
                  hasVal && (isGastos ? "bg-orange-500/8" : "bg-[#4D9FE8]/8"),
                )}
              >
                <div className="flex items-center gap-1 shrink-0 min-w-10">
                  <span className="text-sm font-black tabular-nums text-foreground w-5 text-right">
                    {entry.name}
                  </span>
                  {!isAnual && weather && (
                    <span
                      className="text-sm leading-none"
                      style={{
                        opacity: weather.isExtendedForecast
                          ? 0.45
                          : weather.isForecast
                            ? 0.65
                            : 1,
                      }}
                    >
                      {getWeatherEmoji(weather.code)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 relative h-5 rounded-full bg-muted/50 overflow-hidden">
                  {hasVal && (
                    <div
                      className={cn(
                        "absolute inset-y-0.5 left-0 rounded-full transition-all duration-500 ease-out",
                        isGastos
                          ? isMax
                            ? "bg-[#EA580C]"
                            : isMin
                              ? "bg-[#FB923C]"
                              : "bg-[#F97316]"
                          : isMax
                            ? "bg-[#28C07A]"
                            : isMin
                              ? "bg-[#E85D5D]"
                              : "bg-[#4D9FE8]",
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                <div className="w-20 shrink-0 text-right">
                  {hasVal ? (
                    <span
                      className={cn(
                        "text-sm font-black tabular-nums",
                        isGastos
                          ? isMax
                            ? "text-[#EA580C]"
                            : isMin
                              ? "text-[#FB923C]"
                              : "text-[#F97316]"
                          : isMax
                            ? "text-[#28C07A]"
                            : isMin
                              ? "text-[#E85D5D]"
                              : "text-foreground",
                      )}
                    >
                      <span className="text-[10px] opacity-70">
                        {isGastos ? "-Q" : "Q"}
                      </span>
                      {formatCompactMoney(val)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/35 font-bold">
                      —
                    </span>
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key={`detail-${key}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-2 text-sm border-t border-border/30 bg-muted/30">
                      <p className="font-bold text-foreground tabular-nums">
                        {isAnual ? (
                          <>
                            {entry.fullName || entry.name} ·{" "}
                            <span className={isGastos ? "text-[#F97316]" : ""}>
                              {isGastos ? "-" : ""}
                              <CurrencyValue amount={val} />
                            </span>
                          </>
                        ) : (
                          <>
                            Día {entry.name} de {MONTHS[selectedMonth]} ·{" "}
                            <span className={isGastos ? "text-[#F97316]" : ""}>
                              {isGastos ? "-" : ""}
                              <CurrencyValue amount={val} />
                            </span>
                          </>
                        )}
                      </p>
                      {weather && !isAnual && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08, duration: 0.22 }}
                          className="text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap"
                        >
                          <span>{weather.label}</span>
                          <span>·</span>
                          <span>
                            {weather.tempMin.toFixed(0)}°–
                            {weather.tempMax.toFixed(0)}°C
                          </span>
                          {weather.precipitation > 0 && (
                            <>
                              <span>·</span>
                              <span>{weather.precipitation.toFixed(1)} mm</span>
                            </>
                          )}
                          {weather.isForecast && (
                            <span className="text-amber-600 font-semibold uppercase text-[10px]">
                              pronóstico
                            </span>
                          )}
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="text-xs font-bold text-muted-foreground/70 text-center px-2">
        Toca para ver el detalle
      </p>
    </div>
  );
}

function ChartClimateFooter({
  variant = "default",
  children,
}: {
  variant?: "default" | "empty";
  children?: ReactNode;
}) {
  if (variant === "empty") {
    return (
      <div className="mt-2 shrink-0 rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground italic">
          {children}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 shrink-0 rounded-lg border border-sky-500/25 bg-sky-500/[0.08] dark:bg-sky-950/30 px-4 py-2.5 text-center">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-foreground">
        Clima ·{" "}
        <span className="text-sky-600 dark:text-sky-400">{LA_ARADA_LOCATION}</span>
      </p>
    </div>
  );
}

function WeatherAxisTick({
  x,
  y,
  payload,
  weatherByDay,
  onHover,
  onLeave,
}: {
  x?: string | number;
  y?: string | number;
  payload?: { value: string };
  weatherByDay: Record<number, DayWeather>;
  onHover: (day: number, x: number, y: number) => void;
  onLeave: () => void;
}) {
  const day = Number(payload?.value);
  const weather = weatherByDay[day];
  const tx = Number(x ?? 0);
  const ty = Number(y ?? 0);
  const dense = Object.keys(weatherByDay).length > 28;
  const emoji = weather ? getWeatherEmoji(weather.code) : null;
  const dayFontSize = dense ? 11 : 12;
  const emojiFontSize = dense ? 16 : 18;
  const dayDy = 10;
  const emojiDy = dense ? 34 : 38;

  return (
    <g transform={`translate(${tx},${ty})`}>
      <text
        dy={dayDy}
        textAnchor="middle"
        fill="#666"
        fontSize={dayFontSize}
        fontWeight={900}
      >
        {day}
      </text>
      {emoji ? (
        <text
          dy={emojiDy}
          textAnchor="middle"
          fontSize={emojiFontSize}
          opacity={
            weather.isExtendedForecast ? 0.4 : weather.isForecast ? 0.6 : 1
          }
          style={{ cursor: "pointer" }}
          onMouseEnter={(e) => {
            const rect = (e.target as SVGTextElement).getBoundingClientRect();
            onHover(day, rect.left + rect.width / 2, rect.top);
          }}
          onMouseLeave={onLeave}
        >
          {emoji}
        </text>
      ) : (
        <circle cy={emojiDy} r={1.5} fill="#555" opacity={0.35} />
      )}
    </g>
  );
}

function WeatherTooltipCard({
  day,
  weather,
  monthName,
  x,
  y,
}: {
  day: number;
  weather: DayWeather;
  monthName: string;
  x: number;
  y: number;
}) {
  const Icon = getWeatherIcon(weather.code);

  return (
    <div
      className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
      style={{ left: x, top: y - 12 }}
    >
      <div className="bg-zinc-950 border border-white/15 rounded-2xl px-5 py-4 shadow-2xl min-w-[260px]">
        <p className="text-sm font-bold uppercase tracking-wide text-white/60 mb-1">
          {day} de {monthName}
        </p>
        <p className="text-xs text-white/40 font-medium mb-3">
          {LA_ARADA_LOCATION}
        </p>
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
            <Icon className="size-5 text-sky-400" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">
              {weather.label}
              {weather.isForecast && (
                <span className="ml-1.5 text-[10px] font-semibold text-amber-400 uppercase">
                  {weather.isExtendedForecast
                    ? "pronóstico extendido"
                    : "pronóstico"}
                </span>
              )}
            </p>
            <p className="text-sm text-white/65 font-medium mt-1">
              {weather.tempMin.toFixed(0)}° — {weather.tempMax.toFixed(0)}°C
            </p>
          </div>
        </div>
        {weather.precipitation > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/10 text-sm text-sky-300/90 font-semibold">
            <Droplets className="size-4" />
            {weather.precipitation.toFixed(1)} mm de lluvia
          </div>
        )}
      </div>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  isAnual,
  selectedMonth,
  selectedYear,
  chartType = "balance",
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    dataKey?: string | number;
    payload?: {
      fullName?: string;
      weather?: DayWeather | null;
      total?: number;
      gastos?: number;
      balance?: number;
    };
  }>;
  label?: string;
  isAnual: boolean;
  selectedMonth: number;
  selectedYear: number;
  chartType?: "balance" | "ingresos" | "gastos" | "barras" | "lineas";
}) {
  if (!active || !payload?.length) return null;

  const firstEntry = payload[0];
  const itemData = firstEntry?.payload;
  const weather = itemData?.weather;
  const fullName = itemData?.fullName;

  if (chartType === "balance" || chartType === "lineas") {
    const totalVentas = Number(itemData?.total ?? 0);
    const totalGastos = Number(itemData?.gastos ?? 0);
    const balance = Number(itemData?.balance ?? (totalVentas - totalGastos));

    return (
      <div className="bg-zinc-950/95 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4 shadow-2xl min-w-[270px] max-w-[320px]">
        <div className="text-xs font-bold uppercase tracking-wide text-white/60 mb-2.5 pb-2 border-b border-white/10 flex items-center justify-between">
          <span>
            {isAnual
              ? `Mes: ${fullName || label} ${selectedYear}`
              : `Día ${label} de ${MONTHS[selectedMonth]}`}
          </span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/80 font-semibold">
            balance
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#10B981] ring-2 ring-[#10B981]/30" />
              <span className="text-xs text-white/70 font-medium">Ingresos (Ventas)</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-[#10B981]">
              Q{formatMoneyAmount(totalVentas)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#F97316] ring-2 ring-[#F97316]/30" />
              <span className="text-xs text-white/70 font-medium">Egresos (Gastos)</span>
            </div>
            <span className="text-sm font-bold tabular-nums text-[#F97316]">
              Q{formatMoneyAmount(totalGastos)}
            </span>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90">Balance Neto</span>
            <span
              className={cn(
                "text-sm font-black tabular-nums",
                balance > 0
                  ? "text-blue-400"
                  : balance < 0
                    ? "text-orange-400"
                    : "text-white/60",
              )}
            >
              {balance > 0 ? "+" : ""}Q{formatMoneyAmount(balance)}
            </span>
          </div>
        </div>

        {weather && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
            {(() => {
              const Icon = getWeatherIcon(weather.code);
              return (
                <>
                  <div className="size-9 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-sky-400" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/95">
                      {weather.label}
                      {weather.isForecast && (
                        <span className="text-amber-400/90 text-[9px] ml-1.5 uppercase">
                          {weather.isExtendedForecast
                            ? "pronóstico extendido"
                            : "pronóstico"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-white/55 font-medium mt-0.5">
                      {weather.tempMin.toFixed(0)}° — {weather.tempMax.toFixed(0)}°C
                      {weather.precipitation > 0 &&
                        ` · ${weather.precipitation.toFixed(1)} mm`}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  if (chartType === "gastos") {
    const totalGastos = Number(itemData?.gastos ?? firstEntry?.value ?? 0);

    return (
      <div className="bg-zinc-950/95 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4 shadow-2xl min-w-[260px] max-w-[300px] text-white">
        <p className="text-sm font-bold uppercase tracking-wide text-white/60 mb-2">
          {isAnual
            ? `Mes: ${fullName || label} ${selectedYear}`
            : `Día ${label} de ${MONTHS[selectedMonth]}`}
        </p>
        <p className="text-xl font-bold text-[#F97316] tabular-nums">
          <span className="text-[0.6em] font-black opacity-75 align-top mr-0.5">
            -Q
          </span>
          {formatMoneyAmount(totalGastos)}
        </p>
        <p className="text-sm text-white/50 font-medium mt-0.5">Egresos (Gastos)</p>
        {weather && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
            {(() => {
              const Icon = getWeatherIcon(weather.code);
              return (
                <>
                  <div className="size-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-sky-400" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/95">
                      {weather.label}
                      {weather.isForecast && (
                        <span className="text-amber-400/90 text-[10px] ml-1.5 uppercase">
                          {weather.isExtendedForecast
                            ? "pronóstico extendido"
                            : "pronóstico"}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-white/55 font-medium mt-0.5">
                      {weather.tempMin.toFixed(0)}° — {weather.tempMax.toFixed(0)}
                      °C
                      {weather.precipitation > 0 &&
                        ` · ${weather.precipitation.toFixed(1)} mm`}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      {LA_ARADA_LOCATION}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  const value = Number(firstEntry?.value || 0);

  return (
    <div className="bg-zinc-950 border border-white/15 rounded-2xl px-5 py-4 shadow-2xl min-w-[260px] max-w-[300px]">
      <p className="text-sm font-bold uppercase tracking-wide text-white/60 mb-2">
        {isAnual
          ? `Mes: ${fullName || label} ${selectedYear}`
          : `Día ${label} de ${MONTHS[selectedMonth]}`}
      </p>
      <p className="text-xl font-bold text-white tabular-nums">
        <span className="text-[0.6em] font-black opacity-75 align-top mr-0.5">
          Q
        </span>
        {formatMoneyAmount(value)}
      </p>
      <p className="text-sm text-white/50 font-medium mt-0.5">Ingresos</p>
      {weather && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
          {(() => {
            const Icon = getWeatherIcon(weather.code);
            return (
              <>
                <div className="size-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                  <Icon className="size-5 text-sky-400" strokeWidth={2.25} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/95">
                    {weather.label}
                    {weather.isForecast && (
                      <span className="text-amber-400/90 text-[10px] ml-1.5 uppercase">
                        {weather.isExtendedForecast
                          ? "pronóstico extendido"
                          : "pronóstico"}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-white/55 font-medium mt-0.5">
                    {weather.tempMin.toFixed(0)}° — {weather.tempMax.toFixed(0)}
                    °C
                    {weather.precipitation > 0 &&
                      ` · ${weather.precipitation.toFixed(1)} mm`}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {LA_ARADA_LOCATION}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
