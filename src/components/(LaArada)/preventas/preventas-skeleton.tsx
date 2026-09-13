import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, HandCoins, Search } from "lucide-react";

export function PreventasSkeleton() {
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
            <HandCoins className="size-5 text-zinc-500/50" />
            <Skeleton className="h-6 w-48 rounded-md" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>

        {/* Table Container Card */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-zinc-800 bg-white shadow-sm dark:border-zinc-700 dark:border-t-zinc-400 dark:bg-zinc-900">
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
                  <th className="px-4 py-3"><Skeleton className="h-3 w-20" /></th>
                  <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                  <th className="px-4 py-3"><Skeleton className="h-3 w-24" /></th>
                  <th className="px-4 py-3"><Skeleton className="h-3 w-28" /></th>
                  <th className="px-4 py-3 text-center"><Skeleton className="h-3 w-16 mx-auto" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-36 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-md" /></td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="size-8 rounded-lg" />
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
