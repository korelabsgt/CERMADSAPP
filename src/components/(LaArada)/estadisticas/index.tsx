"use client";

import { useEffect, useState } from "react";
import Stats from "./stats";
import { getVentas } from "@/components/(LaArada)/ventas/lib/actions";
import { EstadisticasPageSkeleton } from "./estadisticas-skeleton";

export default function Estadisticas() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const data = await getVentas();
        setVentas(data || []);
      } catch (error) {
        console.error("Error al obtener ventas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVentas();
  }, []);

  if (isLoading) {
    return <EstadisticasPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 mx-auto w-full px-4 md:px-6 pt-2 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 border-b border-border/40 pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight">
            Análisis de Operaciones
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualización detallada de ingresos y rendimiento
          </p>
        </div>
      </div>

      <Stats orders={ventas} />
    </div>
  );
}