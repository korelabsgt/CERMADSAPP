import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ShoppingCart, Search } from "lucide-react";

export function VentasSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:px-10 w-full space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground w-fit mb-0.5">
            <ArrowLeft className="size-4.5 opacity-40" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">
              Volver
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 md:size-6 text-orange-500/50" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-64 rounded-md mt-1" />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Sales List Skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-start md:items-center gap-3.5">
              <Skeleton className="size-11 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-52 rounded" />
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
              <div className="text-left md:text-right space-y-1">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
