"use client";

import Stats from "./stats";
import { useVentas } from "@/components/(LaArada)/ventas/lib/hooks";
import { useGastos } from "@/components/(LaArada)/gastos/lib/hooks";
import { EstadisticasPageSkeleton } from "./estadisticas-skeleton";

export default function Estadisticas() {
  const { data: ventas = [], isLoading } = useVentas("all");
  const { data: gastos = [] } = useGastos();

  if (isLoading && (!ventas || ventas.length === 0)) {
    return <EstadisticasPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 mx-auto w-full px-4 md:px-6 pt-2 pb-4">
      <Stats orders={ventas} gastos={gastos} />
    </div>
  );
}