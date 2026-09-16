"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Stats from "./stats";
import { useVentas } from "@/components/(LaArada)/ventas/lib/hooks";
import { useGastos } from "@/components/(LaArada)/gastos/lib/hooks";
import { EstadisticasPageSkeleton } from "./estadisticas-skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { readLaAradaSimulatedRole } from "@/components/(LaArada)/lib/simulated-role";

const ALLOWED_ROLES = ["super", "admin"];

export default function Estadisticas() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = (metadata.rol || user?.role || "user") as string;
  const [effectiveRole, setEffectiveRole] = useState(() =>
    readLaAradaSimulatedRole(realRole),
  );

  useEffect(() => {
    setEffectiveRole(readLaAradaSimulatedRole(realRole));
    const syncRole = () => setEffectiveRole(readLaAradaSimulatedRole(realRole));
    window.addEventListener("laarada-simulated-role-change", syncRole);
    return () => window.removeEventListener("laarada-simulated-role-change", syncRole);
  }, [realRole]);

  const hasAccess = ALLOWED_ROLES.includes(effectiveRole);

  useEffect(() => {
    if (!hasAccess) {
      router.replace("/cermadsa/laarada");
    }
  }, [hasAccess, router]);

  const { data: ventas = [], isLoading } = useVentas("all");
  const { data: gastos = [] } = useGastos();

  if (!hasAccess) {
    return null;
  }

  if (isLoading && (!ventas || ventas.length === 0)) {
    return <EstadisticasPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 mx-auto w-full px-4 md:px-6 pt-2 pb-4">
      <Stats orders={ventas} gastos={gastos} />
    </div>
  );
}