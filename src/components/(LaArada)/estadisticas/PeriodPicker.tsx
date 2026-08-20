"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const MONTHS_SHORT = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

export function toPeriodKey(year: number, month: number) {
  return `${year}-${month}`;
}

type PeriodPickerProps = {
  mode: "mensual" | "anual";
  selectedYear: number;
  selectedMonth: number;
  periodsWithData: Set<string>;
  yearsWithData: number[];
  onSelectMonth: (year: number, month: number) => void;
  onSelectYear: (year: number) => void;
};

export function PeriodPicker({
  mode,
  selectedYear,
  selectedMonth,
  periodsWithData,
  yearsWithData,
  onSelectMonth,
  onSelectYear,
}: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [browseYear, setBrowseYear] = useState(selectedYear);
  const isMonthly = mode === "mensual";

  useEffect(() => {
    if (open) setBrowseYear(selectedYear);
  }, [open, selectedYear]);

  const browseYearIndex = yearsWithData.indexOf(browseYear);
  const canGoPrev = browseYearIndex < yearsWithData.length - 1;
  const canGoNext = browseYearIndex > 0;

  const monthsInBrowseYear = useMemo(() => {
    return MONTHS_SHORT.map((label, month) => ({
      label,
      month,
      hasData: periodsWithData.has(toPeriodKey(browseYear, month)),
    }));
  }, [browseYear, periodsWithData]);

  const triggerLabel = isMonthly
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : String(selectedYear);

  const handlePrevYear = () => {
    if (!canGoPrev) return;
    const nextYear = yearsWithData[browseYearIndex + 1];
    setBrowseYear(nextYear);
    if (!isMonthly) onSelectYear(nextYear);
  };

  const handleNextYear = () => {
    if (!canGoNext) return;
    const nextYear = yearsWithData[browseYearIndex - 1];
    setBrowseYear(nextYear);
    if (!isMonthly) onSelectYear(nextYear);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border border-border/50 bg-background px-3 shadow-sm",
            "text-xs font-black uppercase tracking-widest text-foreground",
            "hover:bg-muted/50 transition-colors cursor-pointer",
          )}
        >
          <CalendarDays className="size-3.5 shrink-0 text-orange-500" />
          <span className="truncate max-w-[9rem] sm:max-w-none">{triggerLabel}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(17rem,calc(100vw-2rem))] p-3"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={!canGoPrev}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg",
              "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
              "dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600",
              "cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            aria-label="Año anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="text-sm font-black tabular-nums tracking-wide">
            {browseYear}
          </span>

          <button
            type="button"
            onClick={handleNextYear}
            disabled={!canGoNext}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg",
              "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
              "dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600",
              "cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            aria-label="Año siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {isMonthly ? (
          <div className="grid grid-cols-4 gap-1.5">
            {monthsInBrowseYear.map(({ label, month, hasData }) => {
              const isSelected =
                selectedYear === browseYear && selectedMonth === month;

              return (
                <button
                  key={label}
                  type="button"
                  disabled={!hasData}
                  onClick={() => {
                    onSelectMonth(browseYear, month);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-[10px] font-black tracking-wider transition-colors",
                    isSelected
                      ? "bg-orange-500 text-white"
                      : hasData
                        ? "bg-zinc-200 text-foreground hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 cursor-pointer"
                        : "bg-zinc-100 text-muted-foreground/40 dark:bg-zinc-900/60 cursor-not-allowed",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {yearsWithData.map((year) => {
              const isSelected = selectedYear === year;
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    onSelectYear(year);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-xs font-black tracking-wider transition-colors cursor-pointer",
                    isSelected
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-200 text-foreground hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600",
                  )}
                >
                  {year}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
