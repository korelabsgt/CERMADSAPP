"use client";

import { useState, useMemo, useEffect, useRef, type ReactNode, type RefObject } from "react";
import {
  TrendingUp,
  CalendarDays,
  Layers,
  Droplets,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fetchMonthlyWeather,
  getWeatherIcon,
  getWeatherEmoji,
  LA_ARADA_LOCATION,
  type DayWeather,
  type WeatherSummary,
} from "@/lib/weather";
import { EstadisticasDataSkeleton } from "./estadisticas-skeleton";

const CHART_COLORS = {
  default: "#4D9FE8",
  max: "#28C07A",
  min: "#E85D5D",
} as const;
const BAR_SIZE_MONTHLY = 32;
const BAR_SIZE_ANNUAL = 48;
const BAR_Z_INDEX = 500;
const REF_LINE_Z_INDEX = 100;

function formatCompactMoney(val: number) {
  const n = Number(val || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toFixed(0);
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

export default function Stats({ orders }: { orders: any[] }) {
  const currentMonthIdx = new Date().getMonth();
  const currentYearVal = new Date().getFullYear();

  const [viewMode, setViewMode] = useState<"mensual" | "anual">("mensual");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearVal);
  const [weatherByDay, setWeatherByDay] = useState<
    Record<number, DayWeather>
  >({});
  const [weatherSummary, setWeatherSummary] = useState<WeatherSummary | null>(
    null,
  );
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherHasForecast, setWeatherHasForecast] = useState<boolean | null>(
    null,
  );
  const [expandedBarKey, setExpandedBarKey] = useState<string | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [hoveredWeatherDay, setHoveredWeatherDay] = useState<number | null>(
    null,
  );
  const [weatherTooltipPos, setWeatherTooltipPos] = useState({ x: 0, y: 0 });

  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (viewMode !== "mensual") {
      setWeatherByDay({});
      setWeatherSummary(null);
      setWeatherHasForecast(null);
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

  const availableYears = useMemo(() => {
    if (validOrders.length === 0) return [currentYearVal];
    const years = new Set<number>([currentYearVal]);
    validOrders.forEach((item: any) => {
      let d = item.fecha_entrega || item.created_at;
      if (d) {
        if (typeof d === "string" && d.length === 10) d += "T12:00:00";
        years.add(new Date(d).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [validOrders, currentYearVal]);

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

    const highestMonth = validMonths.reduce(
      (prev, curr) => (curr.total > prev.total ? curr : prev),
      validMonths[0],
    );
    const lowestMonth = validMonths.reduce(
      (prev, curr) => (curr.total < prev.total ? curr : prev),
      validMonths[0],
    );

    const totalYear = yearData.reduce(
      (acc, curr) => acc + Number(curr.total || 0),
      0,
    );
    const divisor = selectedYear === currentYearVal ? currentMonthIdx + 1 : 12;
    const avgYear = totalYear / divisor;

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

  const chartDataWithWeather = useMemo(() => {
    if (isAnual) return currentGraphData;
    return currentGraphData.map((d: { name: string; total: number }) => ({
      ...d,
      weather: weatherByDay[Number(d.name)] ?? null,
    }));
  }, [currentGraphData, isAnual, weatherByDay]);

  useEffect(() => {
    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setExpandedBarKey(null);
  }, [selectedMonth, selectedYear, viewMode, weatherLoading]);

  const barSize = isAnual ? BAR_SIZE_ANNUAL : BAR_SIZE_MONTHLY;

  const showDataSkeleton = !isAnual && weatherLoading;

  return (
    <div className="w-full flex flex-col gap-3 relative text-foreground animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-2">
        <div className="flex items-center gap-2 text-orange-500 font-bold uppercase text-xs tracking-widest">
          <TrendingUp className="size-3.5 shrink-0" />
          <span>Ingresos y Ventas</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

          <div className="flex items-center bg-background rounded-lg border border-border/50 shrink-0 overflow-hidden shadow-sm">
            {!isAnual && (
              <select
                className="bg-transparent font-black uppercase tracking-widest text-xs outline-none cursor-pointer p-2 pr-1.5 border-r border-border/50 hover:bg-muted/50"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            )}
            <select
              className="bg-transparent font-black uppercase tracking-widest text-xs outline-none cursor-pointer p-2 pl-2 hover:bg-muted/50"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showDataSkeleton ? (
        <EstadisticasDataSkeleton />
      ) : (
        <>
        <div className="rounded-lg border border-border/50 overflow-hidden shrink-0">
        {/* Móvil: layout vertical de ancho completo */}
        <div className="md:hidden flex flex-col">
          <div className="px-4 py-5 border-b border-border/40 bg-muted/20">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              {isAnual
                ? `Ingresos ${selectedYear}`
                : `Ingresos ${MONTHS[selectedMonth]}`}
            </p>
            <div className="text-4xl font-bold tabular-nums mt-2 leading-none">
              <CurrencyValue amount={totalRevenue} />
            </div>
          </div>

          {!isAnual && (
            <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 bg-background">
              <MobilePromStat
                label="Prom. activo"
                hint="c/ventas"
                value={
                  <CurrencyValue
                    amount={currentAvg}
                    className="text-orange-500 text-base"
                  />
                }
              />
              <MobilePromStat
                label="Prom. mes"
                hint={`${daysInMonth}d`}
                value={
                  <CurrencyValue
                    amount={monthlyCalendarAvg}
                    className="text-base"
                  />
                }
              />
              <MobilePromStat
                label="Prom. anual"
                hint="/mes"
                value={
                  <CurrencyValue
                    amount={yearlyInfo?.avgYear || 0}
                    className="text-base"
                  />
                }
              />
            </div>
          )}

          {isAnual && (
            <div className="px-4 py-4 border-b border-border/40">
              <MiniStat
                label="Promedio mensual"
                value={
                  <CurrencyValue
                    amount={currentAvg}
                    className="text-orange-500 text-lg"
                  />
                }
              />
            </div>
          )}

          <div className="divide-y divide-border/40">
            <MobileMetricRow
              label={isAnual ? "Mes máximo" : "Día máximo"}
              hint={
                isAnual
                  ? yearlyInfo?.highestMonth?.name || "N/A"
                  : chartInfo.maxDayLabel
              }
              value={
                <CurrencyValue amount={currentMax} className="text-[#28C07A]" />
              }
            />
            <MobileMetricRow
              label={isAnual ? "Mes mínimo" : "Día mínimo"}
              hint={
                isAnual
                  ? yearlyInfo?.lowestMonth?.name || "N/A"
                  : chartInfo.minDayLabel
              }
              value={
                <CurrencyValue amount={currentMin} className="text-[#E85D5D]" />
              }
            />
            <MobileMetricRow
              label="Mejor mes"
              hint={yearlyInfo?.highestMonth?.name || "N/A"}
              value={
                <CurrencyValue
                  amount={yearlyInfo?.highestMonth?.total || 0}
                  className="text-[#28C07A]"
                />
              }
            />
            <MobileMetricRow
              label="Peor mes"
              hint={yearlyInfo?.lowestMonth?.name || "N/A"}
              value={
                <CurrencyValue
                  amount={yearlyInfo?.lowestMonth?.total || 0}
                  className="text-[#E85D5D]"
                />
              }
            />
          </div>

          {!isAnual && (
            <WeatherSummaryBanner
              summary={weatherSummary}
              hasForecast={weatherHasForecast}
              daysInMonth={daysInMonth}
            />
          )}
        </div>

        {/* Escritorio: grid de 6 columnas */}
        <div className="hidden md:grid lg:grid-cols-6 divide-x divide-border/40">
          <div className="col-span-2 px-4 py-3 flex flex-col justify-center gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {isAnual
                  ? `Ingresos ${selectedYear}`
                  : `Ingresos ${MONTHS[selectedMonth]}`}
              </p>
              <div className="text-2xl md:text-3xl font-bold tabular-nums mt-1">
                <CurrencyValue amount={totalRevenue} />
              </div>
            </div>
            {!isAnual && (
              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  label="Prom. activo"
                  value={
                    <CurrencyValue
                      amount={currentAvg}
                      className="text-orange-500 text-sm"
                    />
                  }
                  hint="c/ventas"
                />
                <MiniStat
                  label="Prom. mes"
                  value={
                    <CurrencyValue
                      amount={monthlyCalendarAvg}
                      className="text-sm"
                    />
                  }
                  hint={`${daysInMonth}d`}
                />
                <MiniStat
                  label="Prom. anual"
                  value={
                    <CurrencyValue
                      amount={yearlyInfo?.avgYear || 0}
                      className="text-sm"
                    />
                  }
                  hint="/mes"
                />
              </div>
            )}
            {isAnual && (
              <MiniStat
                label="Promedio mensual"
                value={
                  <CurrencyValue
                    amount={currentAvg}
                    className="text-orange-500"
                  />
                }
              />
            )}
          </div>

          <MetricCell
            label={isAnual ? "Mes máximo" : "Día máximo"}
            hint={
              isAnual
                ? yearlyInfo?.highestMonth?.name || "N/A"
                : chartInfo.maxDayLabel
            }
            value={
              <CurrencyValue amount={currentMax} className="text-[#28C07A]" />
            }
          />
          <MetricCell
            label={isAnual ? "Mes mínimo" : "Día mínimo"}
            hint={
              isAnual
                ? yearlyInfo?.lowestMonth?.name || "N/A"
                : chartInfo.minDayLabel
            }
            value={
              <CurrencyValue amount={currentMin} className="text-[#E85D5D]" />
            }
          />
          <MetricCell
            label="Mejor mes"
            hint={yearlyInfo?.highestMonth?.name || "N/A"}
            value={
              <CurrencyValue
                amount={yearlyInfo?.highestMonth?.total || 0}
                className="text-[#28C07A]"
              />
            }
          />
          <MetricCell
            label="Peor mes"
            hint={yearlyInfo?.lowestMonth?.name || "N/A"}
            value={
              <CurrencyValue
                amount={yearlyInfo?.lowestMonth?.total || 0}
                className="text-[#E85D5D]"
              />
            }
          />
        </div>

        {!isAnual && (
          <div className="hidden md:block">
            <WeatherSummaryBanner
              summary={weatherSummary}
              hasForecast={weatherHasForecast}
              daysInMonth={daysInMonth}
            />
          </div>
        )}
      </div>

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
        {currentGraphData.length === 0 ? (
          <div className="h-[min(65vh,480px)] md:min-h-[420px] flex items-center justify-center text-muted-foreground font-bold uppercase border-2 border-dashed border-border rounded-xl text-center px-4 text-sm">
            Sin entregas registradas en este periodo
          </div>
        ) : (
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
              />
            </div>

            <div className="hidden md:block w-full h-[calc(100vh-22rem)] min-h-[420px] xl:min-h-[480px] xl:h-[calc(100vh-18rem)]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartDataWithWeather}
                  margin={{
                    top: 28,
                    right: 52,
                    left: 8,
                    bottom: !isAnual ? 72 : 12,
                  }}
                  barCategoryGap={!isAnual ? "6%" : "12%"}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#88888815"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={
                      !isAnual
                        ? (props) => (
                            <WeatherAxisTick
                              {...props}
                              weatherByDay={weatherByDay}
                              onHover={(day, x, y) => {
                                setHoveredWeatherDay(day);
                                setWeatherTooltipPos({ x, y });
                              }}
                              onLeave={() => setHoveredWeatherDay(null)}
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
                    domain={[0, "auto"]}
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
                      />
                    }
                  />
                  {currentMax > 0 && (
                    <ReferenceLine
                      y={currentMax}
                      stroke={CHART_COLORS.max}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      zIndex={REF_LINE_Z_INDEX}
                    >
                      <Label
                        value="MÁX"
                        position="insideTopRight"
                        fill={CHART_COLORS.max}
                        fontSize={11}
                        fontWeight="900"
                        offset={8}
                      />
                    </ReferenceLine>
                  )}
                  {currentMin > 0 && (
                    <ReferenceLine
                      y={currentMin}
                      stroke={CHART_COLORS.min}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      zIndex={REF_LINE_Z_INDEX}
                    >
                      <Label
                        value="MÍN"
                        position="insideBottomRight"
                        fill={CHART_COLORS.min}
                        fontSize={10}
                        fontWeight="900"
                        dy={-10}
                      />
                    </ReferenceLine>
                  )}
                  {currentAvg > 0 && (
                    <ReferenceLine
                      y={currentAvg}
                      stroke={CHART_COLORS.default}
                      strokeDasharray="6 4"
                      strokeWidth={2}
                      strokeOpacity={0.7}
                      zIndex={REF_LINE_Z_INDEX}
                    >
                      <Label
                        value="PROM"
                        position="insideBottomRight"
                        fill={CHART_COLORS.default}
                        fontSize={9}
                        fontWeight="900"
                        dy={-4}
                      />
                    </ReferenceLine>
                  )}
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={barSize}
                    minPointSize={2}
                    animationDuration={800}
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
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {!isAnual && !weatherLoading && weatherHasForecast === false && (
          <p className="text-[10px] text-muted-foreground/70 mt-2 pt-1 text-center shrink-0 italic">
            Aún no hay pronóstico de clima disponible para {MONTHS[selectedMonth]}{" "}
            {selectedYear}
          </p>
        )}
        {!isAnual && !weatherLoading && weatherHasForecast && (
          <p className="text-[10px] text-muted-foreground/70 mt-2 pt-1 text-center shrink-0">
            Clima en {LA_ARADA_LOCATION} · atenuado = pronóstico · más atenuado =
            pronóstico extendido
          </p>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground truncate">
        {label}
      </p>
      <div className="font-bold tabular-nums mt-0.5 truncate">{value}</div>
      {hint && (
        <p className="text-[9px] text-muted-foreground/70 truncate">{hint}</p>
      )}
    </div>
  );
}

function MobilePromStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 px-2.5 py-3.5 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">
        {label}
      </p>
      <div className="font-bold tabular-nums text-base mt-1.5 leading-tight">
        {value}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground/70 mt-1">{hint}</p>
      )}
    </div>
  );
}

function MobileMetricRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        {hint && (
          <p className="text-sm text-muted-foreground/80 mt-1 leading-snug">
            {hint}
          </p>
        )}
      </div>
      <div className="text-lg font-bold tabular-nums shrink-0 text-right">
        {value}
      </div>
    </div>
  );
}

function WeatherSummaryBanner({
  summary,
  hasForecast,
  daysInMonth,
}: {
  summary: WeatherSummary | null;
  hasForecast: boolean | null;
  daysInMonth: number;
}) {
  if (!summary || !hasForecast) {
    return (
      <div className="border-t border-border/40 px-4 md:px-5 py-4 md:py-4 bg-muted/20 flex items-center gap-3 md:gap-4">
        <div className="size-12 md:size-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xl md:text-xl shrink-0">
          —
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-xs uppercase tracking-wider text-muted-foreground font-medium leading-tight">
            Clima · {LA_ARADA_LOCATION}
          </p>
          <p className="text-base md:text-base font-semibold text-muted-foreground mt-1">
            Sin pronóstico disponible
          </p>
          <p className="text-sm md:text-sm text-muted-foreground/70 mt-0.5 italic">
            Aún no hay pronóstico para este mes
          </p>
        </div>
      </div>
    );
  }

  const Icon = getWeatherIcon(summary.dominantCode);

  return (
    <div className="border-t border-border/40 px-4 md:px-5 py-4 md:py-4 bg-gradient-to-r from-sky-500/[0.07] via-sky-500/[0.03] to-transparent flex items-center gap-3.5 md:gap-5">
      <div className="size-12 md:size-14 shrink-0 rounded-2xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
        <Icon className="size-6 md:size-7 text-sky-500" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-xs uppercase tracking-wider text-muted-foreground font-medium leading-tight">
          Clima del mes · {LA_ARADA_LOCATION}
        </p>
        <p className="text-2xl md:text-2xl font-bold tabular-nums mt-1">
          {summary.avgTempMin.toFixed(0)}° – {summary.avgTempMax.toFixed(0)}°C
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-sm md:text-sm text-muted-foreground">
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
          {summary.rainyDays > 0 && (
            <span>{summary.rainyDays} días lluviosos</span>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="px-4 py-3 min-w-0 flex flex-col justify-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
        {label}
      </p>
      <div className="text-lg font-bold tabular-nums mt-1 truncate">{value}</div>
      {hint && (
        <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">
          {hint}
        </p>
      )}
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
}: {
  data: Array<{
    name: string;
    total: number;
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
}) {
  const scaleMax = max > 0 ? max : 1;

  return (
    <div className="space-y-2">
      {max > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <span className="text-[#28C07A]">
            Máx Q{formatCompactMoney(max)}
          </span>
          {avg > 0 && (
            <span className="text-[#4D9FE8]">
              Prom Q{formatCompactMoney(avg)}
            </span>
          )}
          {min > 0 && (
            <span className="text-[#E85D5D]">Mín Q{formatCompactMoney(min)}</span>
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
          const hasSales = entry.total > 0;
          const barPct = hasSales
            ? Math.max((entry.total / scaleMax) * 100, 4)
            : 0;
          const isMax = hasSales && entry.total === max;
          const isMin = hasSales && entry.total === min;
          const isExpanded = expandedKey === key;

          return (
            <div key={key} className="rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => onToggleExpand(isExpanded ? null : key)}
                className={cn(
                  "w-full flex items-center gap-2.5 py-2.5 px-2 text-left transition-colors duration-200",
                  isExpanded ? "bg-muted/60" : "active:bg-muted/40",
                  hasSales && "bg-[#4D9FE8]/8",
                )}
              >
                <div className="w-11 shrink-0 text-center leading-tight">
                  <div className="text-sm font-black text-foreground">
                    {entry.name}
                  </div>
                  {!isAnual && weather && (
                    <div
                      className="text-lg leading-none mt-0.5"
                      style={{
                        opacity: weather.isExtendedForecast
                          ? 0.45
                          : weather.isForecast
                            ? 0.65
                            : 1,
                      }}
                    >
                      {getWeatherEmoji(weather.code)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 relative h-7 rounded-full bg-muted/50 overflow-hidden">
                  {hasSales && (
                    <div
                      className={cn(
                        "absolute inset-y-1 left-0 rounded-full transition-all duration-500 ease-out",
                        isMax
                          ? "bg-[#28C07A]"
                          : isMin
                            ? "bg-[#E85D5D]"
                            : "bg-[#4D9FE8]",
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                <div className="w-16 shrink-0 text-right">
                  {hasSales ? (
                    <span
                      className={cn(
                        "text-sm font-black tabular-nums",
                        isMax
                          ? "text-[#28C07A]"
                          : isMin
                            ? "text-[#E85D5D]"
                            : "text-foreground",
                      )}
                    >
                      <span className="text-[10px] opacity-70">Q</span>
                      {formatCompactMoney(entry.total)}
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
                            <CurrencyValue amount={entry.total} />
                          </>
                        ) : (
                          <>
                            Día {entry.name} de {MONTHS[selectedMonth]} ·{" "}
                            <CurrencyValue amount={entry.total} />
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

      <p className="text-xs text-muted-foreground/70 text-center px-2">
        Toca un día para ver detalle · barras en azul = ingresos
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
  const dayFontSize = dense ? 13 : 15;
  const emojiFontSize = dense ? 22 : 26;
  const emojiDy = dense ? 26 : 30;

  return (
    <g transform={`translate(${tx},${ty})`}>
      <text
        dy={10}
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
        <circle cy={28} r={1.5} fill="#555" opacity={0.35} />
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
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: { fullName?: string; weather?: DayWeather | null };
  }>;
  label?: string;
  isAnual: boolean;
  selectedMonth: number;
  selectedYear: number;
}) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0]?.value || 0);
  const weather = payload[0]?.payload?.weather;
  const fullName = payload[0]?.payload?.fullName;

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
