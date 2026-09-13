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
        <div className="flex px-4 md:px-5 py-4 bg-sky-500/[0.04] items-center gap-4">
          <Skeleton className="size-12 md:size-14 shrink-0 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-36 sm:w-44" />
            <Skeleton className="h-7 w-28 sm:w-36" />
            <Skeleton className="h-3.5 w-full max-w-sm" />
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
      <EstadisticasDataSkeleton includeToolbar />
    </div>
  );
}
