import { Skeleton } from "@/components/ui/skeleton";

export function EstadisticasHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-border/40 pb-3 shrink-0">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 sm:w-72" />
        <Skeleton className="h-4 w-64 sm:w-80" />
      </div>
    </div>
  );
}

export function EstadisticasDataSkeleton({
  includeToolbar = false,
}: {
  includeToolbar?: boolean;
}) {
  return (
    <div className="w-full flex flex-col gap-3">
      {includeToolbar && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-[7.5rem] rounded-lg" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/50 overflow-hidden shrink-0">
        {/* Móvil */}
        <div className="md:hidden flex flex-col">
          <div className="px-4 py-4 border-b border-border/40 bg-muted/20 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="px-2 py-3 flex flex-col items-center gap-2">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-2 w-8" />
              </div>
            ))}
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0" />
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 px-4 py-3 flex items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-full max-w-xs" />
            </div>
          </div>
        </div>

        {/* Escritorio */}
        <div className="hidden md:grid lg:grid-cols-6 divide-x divide-border/40">
          <div className="col-span-2 px-4 py-3 flex flex-col justify-center gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-44" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>

          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="px-4 py-3 flex flex-col justify-center gap-2"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        <div className="hidden md:flex border-t border-border/40 px-5 py-4 bg-sky-500/[0.04] items-center gap-5">
          <Skeleton className="size-14 shrink-0 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
      </div>

      <div className="w-full bg-background rounded-xl p-3 md:p-4 border border-border/50 shadow-sm">
        <div className="md:hidden space-y-2">
          <div className="flex gap-3 px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2 max-h-[280px] overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-2 py-2">
                <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                <Skeleton className="h-7 flex-1 rounded-full" />
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="hidden md:block h-[calc(100vh-22rem)] min-h-[420px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function EstadisticasPageSkeleton() {
  return (
    <div className="flex flex-col gap-3 mx-auto w-full px-4 md:px-6 pt-2 pb-4">
      <EstadisticasHeaderSkeleton />
      <EstadisticasDataSkeleton includeToolbar />
    </div>
  );
}
