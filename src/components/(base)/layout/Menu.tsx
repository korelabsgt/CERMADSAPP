"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import Swal from "sweetalert2";
import {
  X,
  Users,
  LogIn,
  LogOut,
  Home,
  Package,
  ClipboardList,
  CreditCard,
  Truck,
  ReceiptText,
  TrendingDown,
  ChevronDown,
  Trash2,
  Fingerprint,
  ScanFace,
  KeyRound,
  User as UserIcon,
  ShieldAlert,
} from "lucide-react";
import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";
import { cn } from "@/lib/utils";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import { createClient } from "@/utils/supabase/client";
import { getPendingDevicesCount } from "@/components/(LaArada)/admin/lib/actions";
import {
  readLaAradaSimulatedRole,
  writeLaAradaSimulatedRole,
} from "@/components/(LaArada)/lib/simulated-role";

const LA_ARADA_LINKS = [
  {
    href: "/cermadsa/laarada/ventas",
    label: "Ventas y Despachos",
    icon: ClipboardList,
    roles: ["super", "admin", "contabilidad", "ventas", "user"],
  },
  {
    href: "/cermadsa/laarada/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/creditos",
    label: "Créditos",
    icon: CreditCard,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/contabilidad",
    label: "Contabilidad",
    icon: ReceiptText,
    roles: ["super", "admin", "contabilidad"],
  },
  {
    href: "/cermadsa/laarada/productos",
    label: "Productos",
    icon: Package,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/gastos",
    label: "Gastos",
    icon: TrendingDown,
    roles: ["super", "admin", "ventas"],
  },
  {
    href: "/cermadsa/laarada/proveedores",
    label: "Proveedores",
    icon: Truck,
    roles: ["super", "admin", "contabilidad"],
  },
];

interface MenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

export default function Menu({ isOpen, setIsOpen, user }: MenuProps) {
  const [isPasskeysModalOpen, setIsPasskeysModalOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [isPasskeysEnabled, setIsPasskeysEnabled] = useState(false);
  const pathname = usePathname();

  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState<string>(realRole);
  const [pendingDevices, setPendingDevices] = useState(0);

  useEffect(() => {
    if (realRole === "super") {
      setEffectiveRole(readLaAradaSimulatedRole(realRole));
      return;
    }
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  const username =
    metadata.username || user?.email?.split("@")[0] || "Invitado";
  const canManage = ["super", "admin", "rrhh"].includes(effectiveRole);

useEffect(() => {
    if (canManage) {
      getPendingDevicesCount().then((c) => setPendingDevices(c ?? 0));
    }
  }, [canManage]);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("app_settings")
        .select("enable_passkeys")
        .limit(1)
        .maybeSingle();
      setIsPasskeysEnabled(data?.enable_passkeys ?? false);
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDark ? "#3b82f6" : "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    });
    
    if (result.isConfirmed) {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Forzar una recarga completa de la página saltándose la caché de Next.js
      window.location.replace("/login");
    }
  };

  const isLaAradaPath = pathname?.startsWith("/cermadsa/laarada");
  const isCermadsaPath = pathname === "/cermadsa";

  const visibleLaAradaLinks = LA_ARADA_LINKS.filter((link) =>
    link.roles.includes(effectiveRole),
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full sm:w-100 bg-background/95 backdrop-blur-2xl border-l border-border/50 transition-transform duration-500 overflow-y-auto shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-6">
          {user ? (
            <div className="flex flex-col text-sm">
              <span className="font-bold leading-tight">{username}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase leading-tight">
                {effectiveRole}
              </span>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center rounded-xl p-2.5 text-foreground hover:bg-muted/50 border border-border/50 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col min-h-[calc(100%-80px)] px-6 pb-8">
          {user ? (
            <>
              {realRole === "super" && (
                <div className="mb-6 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-xl">
                  <ShieldAlert className="size-5 text-yellow-600 shrink-0" />
                  <select
                    value={effectiveRole}
                    onChange={(e) => {
                      const role = e.target.value;
                      setEffectiveRole(role);
                      writeLaAradaSimulatedRole(role);
                    }}
                    className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer w-full"
                  >
                    <option value="super">Simular: SUPER</option>
                    <option value="admin">Simular: Admin</option>
                    <option value="contabilidad">Simular: Contabilidad</option>
                    <option value="ventas">Simular: Ventas</option>
                    <option value="user">Simular: User</option>
                  </select>
                </div>
              )}

              <div className="mb-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>Cerrar Sesión</span>
                  <LogOut className="size-4 rotate-180" />
                </button>
              </div>

              {/* ── ADMINISTRACIÓN ── */}
              {canManage && (
                <div className="mb-3 rounded-2xl border border-border/50 overflow-hidden">
                  <Link
                    href="/cermadsa/admin"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="size-4 text-amber-500" />
                      <span className="text-sm font-bold">Administración</span>
                    </div>
                    {pendingDevices > 0 && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse">
                        {pendingDevices}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* ── GRUPO: MI PERFIL ── */}
              <div className="mb-3 rounded-2xl border border-border/50 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setPerfilOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="size-4" style={{ color: "#a855f7" }} />
                    <span className="text-sm font-bold">Mi Perfil</span>
                  </div>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", perfilOpen && "rotate-180")} />
                </button>
                {/* Items */}
                <div className={cn("grid transition-all duration-300", perfilOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="border-t border-border/40 divide-y divide-border/30">
                      {/* Mi Perfil */}
                      <button
                        onClick={() => { setIsProfileOpen(true); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer text-left"
                      >
                        <UserIcon className="size-4 shrink-0" style={{ color: "#a855f7" }} />
                        <div>
                          <p className="text-sm font-semibold">Mi Perfil</p>
                          <p className="text-[10px] text-muted-foreground">Ver y editar perfil</p>
                        </div>
                      </button>
{isPasskeysEnabled && (
                        <button
                          onClick={() => { setIsPasskeysModalOpen(true); setIsOpen(false); }}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <Fingerprint className="size-4 text-muted-foreground" />
                            <ScanFace className="size-4 text-muted-foreground" />
                            <KeyRound className="size-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Ingreso Seguro</p>
                            <p className="text-[10px] text-muted-foreground">Administrar dispositivos</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="mb-8 mt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all"
              >
                <span>Iniciar Sesión</span>
                <LogIn className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      <PassKeysModal
        isOpen={isPasskeysModalOpen}
        onClose={() => setIsPasskeysModalOpen(false)}
        user={user}
      />

      <VerPerfil
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={user?.id || null}
      />
    </>
  );
}
