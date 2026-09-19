"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ArrowUpRight,
  Truck,
  HardHat,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { MorphIcon } from "morphicons/react";
import {
  LayoutDashboard,
  Compass,
  Truck as LucideTruck,
  HardHat as LucideHardHat,
  Calculator as LucideCalc,
  FileSpreadsheet,
  Users as LucideUsers,
  UserCheck,
  HandCoins,
  Wallet as LucideWallet,
  CreditCard as LucideCard,
  BadgePercent,
  Package as LucidePkg,
  Boxes,
  TrendingUp as LucideTrending,
  TrendingDown as LucideTrendingDown,
  LineChart as LucideLineChart,
  BarChart3 as LucideBarChart,
  BarChart2 as LucideBarChart2,
  Banknote as LucideBanknote,
  Coins as LucideCoins,
} from "lucide";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { getStockStats, getProducts } from "./productos/lib/actions";
import { getPendingOrdersCount, getVentas } from "./ventas/lib/actions";
import { getClients } from "./clientes/lib/actions";
import { getResumenPreventas } from "./preventas/lib/actions";
import { getVentasCredito } from "./creditos/lib/actions";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { readLaAradaSimulatedRole } from "@/components/(LaArada)/lib/simulated-role";
import { TypingAnimation } from "@/components/ui/typing-animation";

const WELCOME_PHRASES = [
  "La Arada crece contigo. Administra tu jornada con claridad y rapidez.",
  "Hoy es un buen día para hacer las cosas bien, paso a paso.",
  "La disciplina de hoy construye los resultados de mañana.",
  "Empieza con energía: pequeños avances suman grandes logros.",
  "Tu enfoque de esta mañana define el ritmo de todo el día.",
  "Hazlo con intención. Cada acción cuenta más de lo que parece.",
  "La constancia vence a la prisa. Avanza con calma y decisión.",
  "Tienes el control de tu día. Prioriza lo importante primero.",
  "Un día organizado es un día ganado. Tú marcas el ritmo.",
  "La excelencia no es un acto, es un hábito diario.",
  "Construyendo juntos el futuro, con trabajo y visión clara.",
  "Cada jornada es una oportunidad para superar lo de ayer.",
  "Respira, enfócate y avanza. Lo demás se alinea contigo.",
];

export function DashboardSkeleton() {
  return (
    <div className="flex-1 w-full px-4 lg:px-8 pt-4 pb-2 space-y-3.5 md:space-y-4 max-w-7xl mx-auto flex flex-col justify-start animate-in fade-in duration-200">
      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 md:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-12 md:size-13 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-md" />
          </div>
        </div>
        <div className="hidden sm:block space-y-1 text-right">
          <Skeleton className="h-4 w-32 rounded-md ml-auto" />
          <Skeleton className="h-3 w-48 rounded-md ml-auto" />
        </div>
      </div>

      {/* 8 Module cards Bento grid matching actual layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3.5 shrink-0">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-3.5 md:p-4.5 shadow-xs flex items-center gap-3.5"
          >
            <Skeleton className="size-12 md:size-13 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-48 rounded-md" />
            </div>
            <Skeleton className="size-7 md:size-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLaArada() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (effectiveRole === "user") {
      router.replace("/cermadsa/laarada/ventas");
    }
  }, [effectiveRole, router]);

  const [stats, setStats] = useState({
    pendientes: 0,
    sinStock: 0,
    stockBajo: 0,
  });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const welcomePhrase = useMemo(
    () => WELCOME_PHRASES[Math.floor(Math.random() * WELCOME_PHRASES.length)],
    [],
  );

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

  // Carga ligera en background para los badges (pendientes y alertas de stock)
  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const [pendientes, stock] = await Promise.all([
          getPendingOrdersCount(),
          getStockStats(),
        ]);
        if (isMounted) {
          setStats({
            pendientes: pendientes || 0,
            sinStock: stock?.sinStock || 0,
            stockBajo: stock?.stockBajo || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Precarga suave en background de módulos frecuentes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        queryClient.prefetchQuery({
          queryKey: ["productos"],
          queryFn: () => getProducts(),
          staleTime: 1000 * 60 * 5,
        });
        queryClient.prefetchQuery({
          queryKey: ["clientes"],
          queryFn: () => getClients(),
          staleTime: 1000 * 60 * 5,
        });
      } catch {
        // safe fallback
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [queryClient]);

  const prefetchModuleData = (id: string) => {
    try {
      if (id === "ventas" || id === "contabilidad" || id === "estadisticas") {
        queryClient.prefetchQuery({
          queryKey: ["ventas", "all"],
          queryFn: () => getVentas(),
          staleTime: 1000 * 60 * 5,
        });
      } else if (id === "clientes") {
        queryClient.prefetchQuery({
          queryKey: ["clientes"],
          queryFn: () => getClients(),
          staleTime: 1000 * 60 * 5,
        });
      } else if (id === "preventas") {
        queryClient.prefetchQuery({
          queryKey: ["preventas", "resumen"],
          queryFn: () => getResumenPreventas(),
          staleTime: 1000 * 60 * 5,
        });
      } else if (id === "creditos") {
        queryClient.prefetchQuery({
          queryKey: ["creditos"],
          queryFn: () => getVentasCredito(),
          staleTime: 1000 * 60 * 5,
        });
      } else if (id === "productos") {
        queryClient.prefetchQuery({
          queryKey: ["productos"],
          queryFn: () => getProducts(),
          staleTime: 1000 * 60 * 5,
        });
      }
    } catch {
      // safe fallback
    }
  };

  const menuItems = [
    {
      id: "ventas",
      href: "/cermadsa/laarada/ventas",
      label: "Ventas y Despachos",
      desc: "Despacho de material, fletes y pedidos.",
      iconKey: "kphyjsqb",
      morphBase: LucideTruck,
      morphActive: LucideHardHat,
      accentColor: "from-orange-500/15 via-orange-500/5 to-transparent",
      borderColor: "border-orange-500/30 hover:border-orange-500/60",
      iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      badge: stats.pendientes > 0 ? stats.pendientes : null,
      badgeColor: "bg-orange-500 text-white animate-pulse",
      allowedRoles: ["super", "admin", "ventas", "user"],
    },
    {
      id: "preventas",
      href: "/cermadsa/laarada/preventas",
      label: "Preventas",
      desc: "Saldo a favor, depósitos y anticipos.",
      iconKey: "rhmhivzj",
      morphBase: HandCoins,
      morphActive: LucideWallet,
      accentColor: "from-sky-500/15 via-sky-500/5 to-transparent",
      borderColor: "border-sky-500/30 hover:border-sky-500/60",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      badge: null,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Productos e Inventario",
      desc: "Catálogo de materiales y existencias.",
      iconKey: "gbzbfgyf",
      morphBase: LucidePkg,
      morphActive: Boxes,
      accentColor: "from-amber-500/15 via-amber-500/5 to-transparent",
      borderColor: "border-amber-500/30 hover:border-amber-500/60",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      badge:
        stats.sinStock > 0
          ? `${stats.sinStock} sin stock`
          : stats.stockBajo > 0
            ? `${stats.stockBajo} stock bajo`
            : null,
      badgeColor: stats.sinStock > 0 ? "bg-red-500 text-white animate-pulse" : "bg-amber-500 text-white",
      allowedRoles: ["super", "admin", "ventas", "tec-admin", "contabilidad"],
    },
    {
      id: "estadisticas",
      href: "/cermadsa/laarada/estadisticas",
      label: "Estadísticas",
      desc: "Análisis de ventas, gráficas y reportes.",
      iconKey: "estadisticas",
      morphBase: LucideLineChart,
      morphActive: LucideBarChart,
      accentColor: "from-purple-500/15 via-purple-500/5 to-transparent",
      borderColor: "border-purple-500/30 hover:border-purple-500/60",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      badge: null,
      allowedRoles: ["super", "admin"],
    },
    {
      id: "gastos",
      href: "/cermadsa/laarada/gastos",
      label: "Gastos",
      desc: "Control y registro de egresos y gastos.",
      iconKey: "gastos",
      morphBase: LucideBanknote,
      morphActive: LucideTrendingDown,
      accentColor: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      badge: null,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "contabilidad",
      href: "/cermadsa/laarada/contabilidad",
      label: "Contabilidad",
      desc: "Gestión financiera, cortes y reportes.",
      iconKey: "hrxrggwa",
      morphBase: LucideCalc,
      morphActive: FileSpreadsheet,
      accentColor: "from-indigo-500/15 via-indigo-500/5 to-transparent",
      borderColor: "border-indigo-500/30 hover:border-indigo-500/60",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      badge: null,
      allowedRoles: ["super", "admin", "contabilidad", "tec-admin"],
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Clientes",
      desc: "Directorio de clientes y cuentas.",
      iconKey: "xkrgmuxd",
      morphBase: LucideUsers,
      morphActive: UserCheck,
      accentColor: "from-blue-500/15 via-blue-500/5 to-transparent",
      borderColor: "border-blue-500/30 hover:border-blue-500/60",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      badge: null,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Créditos",
      desc: "Control de cobros y vencimientos.",
      iconKey: "qrhmobcu",
      morphBase: LucideCard,
      morphActive: BadgePercent,
      accentColor: "from-rose-500/15 via-rose-500/5 to-transparent",
      borderColor: "border-rose-500/30 hover:border-rose-500/60",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      badge: null,
      allowedRoles: ["super", "admin", "ventas", "tec-admin", "contabilidad"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(effectiveRole)
  );

  if (effectiveRole === "user") {
    return null;
  }

  return (
    <div className="flex-1 w-full px-4 lg:px-8 pt-4 pb-2 space-y-3.5 md:space-y-4 max-w-7xl mx-auto flex flex-col justify-start">
      {/* HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-linear-to-r from-orange-500/10 via-card to-card p-4 md:p-5 shadow-xs backdrop-blur-md shrink-0"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Lado izquierdo: Identidad & Slogan */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative size-12 md:size-13 shrink-0 rounded-xl bg-background/80 p-1.5 shadow-2xs border border-orange-500/20">
              <Image
                src="/logos/LaArada.png"
                alt="Logo La Arada"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500 leading-tight">
                La Arada
              </h1>
              <p className="text-xs md:text-sm font-medium italic text-orange-600 dark:text-orange-500 leading-tight mt-0.5">
                Construyendo Junto a ti el futuro.
              </p>
            </div>
          </div>

          {/* Lado derecho: Saludo & Frase motivacional */}
          <div className="flex flex-col items-start md:items-end min-w-0">
            <p className="text-xs md:text-sm font-bold text-foreground leading-tight">
              ¡Hola de nuevo, <span className="text-orange-600 dark:text-orange-500">{metadata.nombre?.split(" ")[0] || "Usuario"}</span>!
            </p>
            <p className="text-xs text-muted-foreground italic truncate max-w-sm md:max-w-xl leading-tight mt-0.5">
              <TypingAnimation duration={28}>{welcomePhrase}</TypingAnimation>
            </p>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-8 -top-8 size-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      </motion.div>

      {/* MODULE CARDS GRID */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-3.5 shrink-0"
      >
        {visibleMenuItems.map((item) => {
          const isHovered = hoveredCard === item.id;
          const currentMorph = isHovered ? item.morphActive : item.morphBase;

          return (
            <motion.div
              key={item.id}
              id={`card-${item.id}`}
              onMouseEnter={() => {
                setHoveredCard(item.id);
                prefetchModuleData(item.id);
              }}
              onMouseLeave={() => setHoveredCard(null)}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card/90 transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer",
                item.borderColor
              )}
            >
              <Link
                href={item.href}
                onMouseEnter={() => setHoveredCard(item.id)}
                className="flex items-center gap-3.5 p-3.5 md:p-4.5 outline-none h-full relative z-10"
              >
                {/* Badge in top-right corner (Circular with pulsating number) */}
                {item.badge !== undefined && item.badge !== null && (
                  <div
                    className={cn(
                      "absolute top-2 right-2.5 size-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs ring-2 ring-card z-20 animate-pulse pointer-events-none",
                      item.badgeColor || "bg-orange-500 text-white"
                    )}
                  >
                    {item.badge}
                  </div>
                )}

                {/* Animated Icon / MorphIcon Box */}
                <div
                  className={cn(
                    "relative size-12 md:size-13 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs",
                    item.iconBg
                  )}
                >
                  <MorphIcon icon={currentMorph} size={25} />
                </div>

                {/* Content Info */}
                <div className="flex flex-col min-w-0 flex-1 pr-4">
                  <h2 className="text-base md:text-lg font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {item.label}
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-1 leading-tight mt-0.5">
                    {item.desc}
                  </p>
                </div>

                {/* Arrow Action */}
                <div className="size-6.5 md:size-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-orange-500/15 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 self-center mt-2">
                  <ChevronRight className="size-3.5 md:size-4" />
                </div>
              </Link>

              {/* Gradient glow overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  item.accentColor
                )}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
