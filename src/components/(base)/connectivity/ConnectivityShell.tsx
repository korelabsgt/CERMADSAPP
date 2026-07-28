"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Database, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useConnectivity,
  type ConnectivityStatus,
} from "@/components/(base)/connectivity/lib/hooks";

type StatusConfig = {
  message: string;
  sublabel?: string;
  icon: typeof WifiOff;
  bar: string;
  ring: string;
  dot: string;
  iconColor: string;
};

const STATUS_CONFIG: Record<
  Exclude<ConnectivityStatus, "online">,
  StatusConfig
> = {
  offline: {
    message: "Sin acceso a internet",
    sublabel: "Comprueba tu red e inténtalo de nuevo",
    icon: WifiOff,
    bar: "border-red-500/25 bg-red-500/8 dark:bg-red-500/12",
    ring: "shadow-[inset_0_0_0_2px_rgba(239,68,68,0.45)]",
    dot: "bg-red-500",
    iconColor: "text-red-500",
  },
  unstable: {
    message: "Conexión inestable",
    sublabel: "La red responde con lentitud",
    icon: Activity,
    bar: "border-amber-500/25 bg-amber-500/8 dark:bg-amber-500/12",
    ring: "shadow-[inset_0_0_0_2px_rgba(245,158,11,0.4)]",
    dot: "bg-amber-500",
    iconColor: "text-amber-500",
  },
  "db-disconnected": {
    message: "Sin conexión a la base de datos",
    sublabel: "Intentando reconectar...",
    icon: Database,
    bar: "border-amber-500/25 bg-amber-500/8 dark:bg-amber-500/12",
    ring: "shadow-[inset_0_0_0_2px_rgba(245,158,11,0.4)]",
    dot: "bg-amber-500",
    iconColor: "text-amber-500",
  },
};

const bannerEase = [0.4, 0, 0.2, 1] as const;

export function ConnectivityShell({ children }: { children: React.ReactNode }) {
  const status = useConnectivity();
  const isAlert = status !== "online";
  const config = isAlert ? STATUS_CONFIG[status] : null;
  const Icon = config?.icon;

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ease-out",
        isAlert && "pt-11",
      )}
    >
      <AnimatePresence initial={false}>
        {config && Icon ? (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: bannerEase }}
            className={cn(
              "fixed inset-x-0 top-0 z-10001 border-b backdrop-blur-xl",
              "pt-[env(safe-area-inset-top)]",
              config.bar,
            )}
          >
            <div className="mx-auto flex h-11 max-w-3xl items-center justify-center gap-2.5 px-4">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full bg-background/60",
                  config.iconColor,
                )}
              >
                <Icon className="size-3.5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 text-center sm:text-left">
                <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
                  {config.message}
                </p>
                {config.sublabel ? (
                  <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
                    {config.sublabel}
                  </p>
                ) : null}
              </div>
              <span className="relative flex size-2 shrink-0">
                <span
                  className={cn(
                    "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                    config.dot,
                  )}
                />
                <span
                  className={cn("relative inline-flex size-2 rounded-full", config.dot)}
                />
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {config ? (
          <motion.div
            key={`ring-${status}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: bannerEase }}
            aria-hidden
            className={cn(
              "pointer-events-none fixed inset-0 z-10000 transition-shadow duration-300",
              config.ring,
            )}
          />
        ) : null}
      </AnimatePresence>

      {children}
    </div>
  );
}
