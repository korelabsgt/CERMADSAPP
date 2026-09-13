import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calculator, Search } from "lucide-react";

export function ContabilidadSkeleton() {
  return (
    <div className="p-4 md:p-6 w-full lg:max-w-[95%] mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-col gap-1">
          <div className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground w-fit mb-0.5">
            <ArrowLeft className="size-4.5 opacity-40" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40">
              Volver
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="size-5 md:size-6 text-emerald-500/50" />
            <Skeleton className="h-7 w-52 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-72 rounded-md mt-1" />
        </div>

        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2"
          >
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Table Container Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-emerald-600/40 bg-white shadow-sm dark:border-zinc-700 dark:border-t-emerald-500/40 dark:bg-zinc-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-32 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-32" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-20" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-20" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3 text-center"><Skeleton className="h-3 w-14 mx-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-28 rounded" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-40 rounded" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-md" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-md" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="px-4 py-3.5 text-center">
                    <Skeleton className="size-8 rounded-lg mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
