"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { readLaAradaSimulatedRole } from "@/components/(LaArada)/lib/simulated-role";

export function Dashboard() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  useEffect(() => {
    if (realRole === "super") {
      setEffectiveRole(readLaAradaSimulatedRole(realRole));
      const syncRole = () => setEffectiveRole(readLaAradaSimulatedRole(realRole));
      window.addEventListener("laarada-simulated-role-change", syncRole);
      return () => window.removeEventListener("laarada-simulated-role-change", syncRole);
    } else {
      setEffectiveRole(realRole);
    }
  }, [realRole]);

  useEffect(() => {
    if (effectiveRole === "user") {
      router.replace("/cermadsa/laarada/ventas");
    }
  }, [effectiveRole, router]);

  const laAradaHref = effectiveRole === "user" ? "/cermadsa/laarada/ventas" : "/cermadsa/laarada";

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleNavigation = (id: string) => {
    if (activeId) return;
    setActiveId(id);
  };

  if (effectiveRole === "user") {
    return null;
  }

  return (
    <div className="flex-1 w-full px-4 lg:px-12 space-y-10 mx-auto pb-10 pt-2">

      {/* BANNER CORPORATIVO CERMAD S.A. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full rounded-3xl border border-red-500/20 bg-card p-6 md:p-8 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between"
      >
        <div className="relative z-10 flex flex-col gap-2 mt-2 md:mt-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              CERMAD S.A.
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium max-w-xl pr-12 md:pr-0">
            Centro de Operaciones Empresariales. Selecciona la unidad de negocio para comenzar.
          </p>
        </div>

        {/* ELEMENTO VISUAL A LA DERECHA */}
        <div className="absolute top-6 right-6 md:static flex items-center justify-center z-10 scale-[0.6] md:scale-100 origin-top-right md:pr-4">
          <div className="relative flex items-center gap-2">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-3 h-12 rounded-full bg-red-600/80 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            />
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-3 h-16 rounded-full bg-red-500/60"
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-3 h-20 rounded-full bg-red-400/80 shadow-[0_0_15px_rgba(248,113,113,0.5)]"
            />
          </div>
        </div>

        {/* DECORACIÓN DE FONDO */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-red-500/5 to-transparent pointer-events-none" />
      </motion.div>

      <div className="w-full space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80 pl-2">Unidades de Negocio</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <motion.div
            layoutId="la-arada"
            onClick={() => handleNavigation("la-arada")}
            whileHover={{ scale: 1.02, y: -5 }}
            animate={
              activeId === "la-arada"
                ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 1.5, ease: "easeInOut" },
                  }
                : { scale: 1, y: 0 }
            }
            className={cn(
              "group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-500/20 flex bg-transparent shadow-sm cursor-pointer h-32 sm:h-40 transition-colors md:col-span-2",
              "hover:bg-orange-500/5",
            )}
          >
            <Link href={laAradaHref} className="w-full h-full flex items-center p-5 sm:p-6 md:p-8 outline-none text-left">
              <div className="relative z-10 shrink-0 mr-4 sm:mr-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 p-2 sm:p-3 bg-white rounded-xl sm:rounded-2xl border border-orange-500/20 group-hover:scale-110 transition-transform duration-500 shadow-sm flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <Image
                      src="/logos/LaArada.png"
                      alt="Logo La Arada"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2 relative z-10 flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight transition-colors text-orange-600 dark:text-orange-500 leading-none">
                  La Arada
                </h3>
                <p className="text-sm sm:text-base text-orange-600 dark:text-orange-500 font-medium italic mt-1 sm:mt-2">
                  Construyendo Junto a ti el futuro.
                </p>
              </div>

              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-orange-500/5 to-transparent pointer-events-none" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
