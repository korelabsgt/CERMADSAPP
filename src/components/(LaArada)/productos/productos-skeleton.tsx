import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Search } from "lucide-react";

export function ProductosSkeleton() {
  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground">
          <ArrowLeft className="size-5 opacity-40" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-40">
            Volver
          </span>
        </div>
        <div className="min-w-0 text-right">
          <div className="flex items-center justify-end gap-2">
            <Package className="size-5 text-amber-500/50" />
            <Skeleton className="h-6 w-44 rounded-md" />
          </div>
        </div>
      </div>

      {/* Stock Summary Bento / Accordion Skeleton */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/40 space-y-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>

        {/* Table Container Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-amber-500/40 bg-white shadow-sm dark:border-zinc-700 dark:border-t-amber-500/40 dark:bg-zinc-900">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-40 rounded-lg shrink-0" />
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
                  <th className="px-4 py-3 text-center"><Skeleton className="h-3 w-16 mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16 rounded font-mono" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-44 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-md" /></td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-1.5">
                        <Skeleton className="size-7 rounded-lg" />
                        <Skeleton className="size-7 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
