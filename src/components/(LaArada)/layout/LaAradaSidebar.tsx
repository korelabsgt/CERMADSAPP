"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MorphIcon } from "morphicons/react";
import {
  LayoutDashboard,
  Compass,
  Truck,
  HardHat,
  Calculator,
  FileSpreadsheet,
  Users,
  UserCheck,
  HandCoins,
  Wallet,
  CreditCard,
  BadgePercent,
  Package,
  Boxes,
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart3,
  Receipt,
  Banknote,
  Coins,
  PanelLeftClose,
  PanelLeft,
} from "lucide";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { readLaAradaSimulatedRole } from "@/components/(LaArada)/lib/simulated-role";
import { useQueryClient } from "@tanstack/react-query";
import { getPendingOrdersCount, getVentas } from "../ventas/lib/actions";
import { getStockStats, getProducts } from "../productos/lib/actions";
import { getClients } from "../clientes/lib/actions";
import { getResumenPreventas } from "../preventas/lib/actions";
import { getVentasCredito } from "../creditos/lib/actions";
import Image from "next/image";

interface NavItem {
  id: string;
  href: string;
  label: string;
  badge?: number | string | null;
  badgeColor?: string;
  baseIcon: any;
  activeIcon: any;
  allowedRoles: string[];
}

export default function LaAradaSidebar({
  activeHref: propActiveHref,
}: {
  activeHref?: string;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  const queryClient = useQueryClient();
  const [activeHref, setActiveHref] = useState(propActiveHref || pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [toggleHovered, setToggleHovered] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [stockAlerts, setStockAlerts] = useState(0);

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

  // Sync activeHref when pathname changes
  useEffect(() => {
    setActiveHref(propActiveHref || pathname);
  }, [propActiveHref, pathname]);

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
    if (effectiveRole === "user") return;

    const saved = localStorage.getItem("laarada_sidebar_collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }

    const fetchBadges = async () => {
      try {
        const [pendientes, stock] = await Promise.all([
          getPendingOrdersCount().catch(() => 0),
          getStockStats().catch(() => ({ sinStock: 0, stockBajo: 0 })),
        ]);
        setPendingOrders(pendientes || 0);
        setStockAlerts((stock?.sinStock || 0) + (stock?.stockBajo || 0));
      } catch (err) {
        console.error("Error loading sidebar counts:", err);
      }
    };
    fetchBadges();
  }, [effectiveRole]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("laarada_sidebar_collapsed", String(next));
      return next;
    });
  };

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      href: "/cermadsa/laarada",
      label: "Inicio / Resumen",
      baseIcon: LayoutDashboard,
      activeIcon: Compass,
      allowedRoles: ["super", "admin", "ventas", "tec-admin", "contabilidad", "rrhh", "user"],
    },
    {
      id: "ventas",
      href: "/cermadsa/laarada/ventas",
      label: "Ventas y Despacho",
      badge: pendingOrders > 0 ? pendingOrders : null,
      badgeColor: "bg-orange-500 text-white",
      baseIcon: Truck,
      activeIcon: HardHat,
      allowedRoles: ["super", "admin", "ventas", "user"],
    },
    {
      id: "preventas",
      href: "/cermadsa/laarada/preventas",
      label: "Preventas & Anticipos",
      baseIcon: HandCoins,
      activeIcon: Wallet,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Inventario & Stock",
      badge: stockAlerts > 0 ? stockAlerts : null,
      badgeColor: "bg-red-500 text-white",
      baseIcon: Package,
      activeIcon: Boxes,
      allowedRoles: ["super", "admin", "ventas", "tec-admin", "contabilidad"],
    },
    {
      id: "estadisticas",
      href: "/cermadsa/laarada/estadisticas",
      label: "Estadísticas & Reportes",
      baseIcon: LineChart,
      activeIcon: BarChart3,
      allowedRoles: ["super", "admin", "contabilidad", "ventas", "tec-admin"],
    },
    {
      id: "gastos",
      href: "/cermadsa/laarada/gastos",
      label: "Control de Gastos",
      baseIcon: Banknote,
      activeIcon: TrendingDown,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "contabilidad",
      href: "/cermadsa/laarada/contabilidad",
      label: "Contabilidad",
      baseIcon: Calculator,
      activeIcon: FileSpreadsheet,
      allowedRoles: ["super", "admin", "contabilidad", "tec-admin"],
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Cartera de Clientes",
      baseIcon: Users,
      activeIcon: UserCheck,
      allowedRoles: ["super", "admin", "ventas"],
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Gestión de Créditos",
      baseIcon: CreditCard,
      activeIcon: BadgePercent,
      allowedRoles: ["super", "admin", "ventas", "tec-admin", "contabilidad"],
    },
  ];

  const isItemActive = (itemHref: string) => {
    if (itemHref === "/cermadsa/laarada") {
      return activeHref === "/cermadsa/laarada";
    }
    return activeHref.startsWith(itemHref);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    if (activeHref === href && pathname === href) return;

    setActiveHref(href);
    prefetchModuleData(id);
    router.prefetch(href);

    // Smooth layoutId spring + instant route push
    setTimeout(() => {
      router.push(href);
    }, 150);
  };

  const visibleItems = navItems.filter((item) =>
    item.allowedRoles.includes(effectiveRole)
  );

  if (effectiveRole === "user") {
    return null;
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-border/40 bg-card/60 backdrop-blur-xl select-none sticky top-14 md:top-16 h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] z-30",
        collapsed ? "w-20 overflow-visible" : "w-64 overflow-hidden"
      )}
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          "flex items-center h-14 md:h-16 shrink-0 border-b border-border/30 transition-all px-4",
          collapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative size-8 shrink-0">
              <Image
                src="/logos/LaArada.png"
                alt="La Arada"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-orange-600 dark:text-orange-500 leading-tight">
                La Arada
              </span>
              <span className="text-[11px] text-muted-foreground truncate leading-tight">
                CERMAD S.A.
              </span>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer flex items-center justify-center"
          aria-label="Toggle sidebar"
        >
          <MorphIcon
            icon={
              collapsed
                ? toggleHovered
                  ? PanelLeft
                  : PanelLeftClose
                : toggleHovered
                ? PanelLeftClose
                : PanelLeft
            }
            size={18}
            className="transition-colors text-muted-foreground hover:text-foreground"
          />
        </button>
      </div>

      {/* Nav List with Internal Scrollbar */}
      <div className={cn("flex-1 py-3 px-3 space-y-1 min-h-0", collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border")}>
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between">
            <span>Módulos ({effectiveRole})</span>
          </div>
        )}

        {visibleItems.map((item) => {
          const isActive = isItemActive(item.href);
          const isHovered = hoveredId === item.id;
          const currentIcon = isHovered || isActive ? item.activeIcon : item.baseIcon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href, item.id)}
              onMouseEnter={() => {
                setHoveredId(item.id);
                prefetchModuleData(item.id);
                router.prefetch(item.href);
              }}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-150 outline-none select-none",
                isActive
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                collapsed && "justify-center px-0 py-2.5"
              )}
            >
              {/* Smooth Gliding Active Background */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 rounded-xl z-0"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                />
              )}

              {/* Smooth Gliding Active Indicator Bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBar"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-orange-500 rounded-r-full z-10 shadow-xs"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    mass: 0.8,
                  }}
                />
              )}

              {/* MorphIcon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                <MorphIcon icon={currentIcon} size={19} />
                {/* Collapsed Badge in top-right corner of icon */}
                {collapsed && item.badge !== undefined && item.badge !== null && (
                  <span
                    className={cn(
                      "absolute -top-2 -right-2.5 size-4 rounded-full flex items-center justify-center text-[9px] font-black ring-2 ring-card animate-pulse shadow-xs z-20 pointer-events-none",
                      item.badgeColor || "bg-orange-500 text-white"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label & Badges (Expanded Mode) */}
              {!collapsed && (
                <div className="relative z-10 flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate text-[13px]">{item.label}</span>
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={cn(
                        "ml-auto size-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs shrink-0 animate-pulse",
                        item.badgeColor || "bg-orange-500 text-white"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Floating Tooltip to the Right (Collapsed Mode) */}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-1.5 bg-popover/95 text-popover-foreground border border-border/80 text-xs font-semibold rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1.5 translate-x-[-4px] group-hover:translate-x-0">
                  <span>{item.label}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Sidebar Footer Pinned */}
      <div className="p-2.5 shrink-0 mt-auto border-t border-border/30 bg-card/40">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-1.5 rounded-xl bg-muted/40 border border-border/30">
            <div className="size-7 rounded-lg bg-background/80 flex items-center justify-center p-1 border border-border/40 shrink-0 shadow-2xs">
              <Image
                src="/logos/favicon.png"
                alt="CERMAD Logo"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-foreground truncate tracking-tight">
                CERMAD S.A.
              </span>
              <span className="text-[9px] text-muted-foreground">
                v1.3.5 • La Arada
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-1.5 rounded-lg bg-muted/40" title="CERMAD S.A.">
            <Image
              src="/logos/favicon.png"
              alt="CERMAD Logo"
              width={18}
              height={18}
              className="object-contain"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
