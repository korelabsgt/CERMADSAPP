"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  ShoppingCart,
  LayoutGrid,
  List,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { useVentas, useVendedores } from "./lib/hooks";
import SaleModal from "./modals/sale-modal";
import ReceiptModal from "./modals/receipt-modal";
import StatusModal from "./modals/status-modal";
import ListView from "./components/ventas-view";
import MonitorView from "./components/monitor-view";

import { useUser } from "@/components/(base)/providers/UserProvider";

export default function ListadoVentas() {
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);
  const privilegedRoles = ["super", "admin", "rrhh"];
  const isPrivileged = privilegedRoles.includes(effectiveRole);

  const [selectedVendedor, setSelectedVendedor] = useState<string>("all");

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  const [viewMode, setViewMode] = useState<"ventas" | "monitor">("ventas");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [statusVenta, setStatusVenta] = useState<any>(null);
  const [ventaToEdit, setVentaToEdit] = useState<any>(null);

  useEffect(() => {
    if (!isPrivileged && user?.id) {
      setSelectedVendedor(user.id);
    }
  }, [isPrivileged, user?.id]);

  // Lógica de visibilidad dinámica
  const queryVendedorId = viewMode === "monitor" ? "all" : selectedVendedor;

  const { data: ventas = [], isLoading } = useVentas(queryVendedorId);
  const { data: vendedores = [] } = useVendedores();

  const allowedRoles = ["ventas", "rrhh", "admin", "super"];
  const canManage = allowedRoles.includes(effectiveRole);

  useEffect(() => {
    if (user && !canManage) {
      setViewMode("monitor");
    }
  }, [user, canManage, effectiveRole]);

  const sortedOrders = [...ventas].sort(
    (a: any, b: any) =>
      new Date(b.fecha_entrega || 0).getTime() -
      new Date(a.fecha_entrega || 0).getTime(),
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "S/F";
    const adjustedString = dateString.includes("T")
      ? dateString
      : `${dateString}T12:00:00`;
    return new Date(adjustedString).toLocaleDateString("es-GT", {
      timeZone: "America/Guatemala",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:px-10 w-full space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {viewMode === "ventas" ? (
              <ShoppingCart className="size-5 md:size-6 text-orange-500" />
            ) : (
              <Truck className="size-5 md:size-6 text-blue-500" />
            )}
            {viewMode === "ventas"
              ? "Control de Ventas"
              : "Monitor de Despacho"}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2">
            {viewMode === "ventas"
              ? "Gestión de ventas y despachos."
              : "Despachos pendientes de entrega en tiempo real."}
            {realRole === "super" && effectiveRole !== "super" && (
              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                (Simulando: {effectiveRole})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {realRole === "super" && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm h-10 w-full sm:w-auto justify-center">
              <ShieldAlert className="size-4 text-yellow-600 shrink-0" />
              <span className="text-[10px] font-bold text-yellow-600 uppercase hidden sm:inline whitespace-nowrap">
                Modo Super:
              </span>
              <select
                value={effectiveRole}
                onChange={(e) => setEffectiveRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="super">SUPER (Real)</option>
                <option value="admin">Admin</option>
                <option value="ventas">Ventas</option>
                <option value="rrhh">RRHH</option>
                <option value="user">User (Sin permisos)</option>
              </select>
            </div>
          )}

          {isPrivileged && (
            <div className="flex items-center gap-2 bg-muted border px-3 py-1.5 rounded-lg shadow-sm h-10 w-full sm:w-auto justify-center min-w-[150px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase hidden sm:inline whitespace-nowrap">
                Filtro Vendedor:
              </span>
              <select
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="all">TODOS</option>
                {vendedores.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isPrivileged && effectiveRole !== "user" && (
            <div className="flex items-center gap-2 bg-muted/50 border px-3 py-1.5 rounded-lg shadow-sm h-10 w-full sm:w-auto justify-center min-w-[150px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase hidden sm:inline whitespace-nowrap">
                Vendedor:
              </span>
              <span className="text-xs font-bold text-orange-600 truncate">
                {user?.user_metadata?.name || "VENDEDOR ACTUAL"}
              </span>
            </div>
          )}

          {canManage && (
            <>
              <div className="flex bg-muted rounded-lg p-1 border h-10 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setViewMode("monitor")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "monitor"
                      ? "bg-background shadow-sm text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-4" /> Despacho
                </button>
                <button
                  onClick={() => setViewMode("ventas")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "ventas"
                      ? "bg-background shadow-sm text-orange-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="size-4" /> Ventas
                </button>
              </div>

              <button
                onClick={() => {
                  setVentaToEdit(null);
                  setIsSaleModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all cursor-pointer active:scale-95 text-xs md:text-sm h-10 w-full sm:w-auto"
              >
                <Plus className="size-4" />
                NUEVO
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === "ventas" && canManage && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <ListView
            items={sortedOrders}
            isLoading={isLoading}
            formatDate={formatDate}
            onStatusClick={setStatusVenta}
            onPrintClick={setSelectedVentaId}
            onEditClick={(venta: any) => {
              setVentaToEdit(venta);
              setIsSaleModalOpen(true);
            }}
          />
        </div>
      )}

      {viewMode === "monitor" && (
        <MonitorView
          orders={sortedOrders}
          formatDate={formatDate}
          onStatusClick={setStatusVenta}
        />
      )}

      {canManage && (
        <SaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          ventaToEdit={ventaToEdit}
          effectiveRole={effectiveRole}
          onCreated={(ventaId) => setSelectedVentaId(ventaId)}
        />
      )}

      <ReceiptModal
        isOpen={!!selectedVentaId}
        onClose={() => setSelectedVentaId(null)}
        ventaId={selectedVentaId}
      />

      <StatusModal
        isOpen={!!statusVenta}
        onClose={() => setStatusVenta(null)}
        venta={statusVenta}
      />
    </div>
  );
}
