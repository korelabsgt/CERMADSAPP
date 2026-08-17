"use client";

import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ReciboPreventaPrint from "./components/recibo-preventa-print";
import CargarSaldo from "./forms/CargarSaldo";
import { useEliminarPreventaCliente, useResumenPreventas } from "./lib/hooks";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  cargarSaldoBtn,
  creditosNavBtn,
  creditosRowClass,
  creditosTableClass,
  creditosTableScroll,
  creditosTableWrap,
  creditosTbodyClass,
  creditosTheadClass,
  formatMoney,
  phonePill,
  searchInput,
  tableShell,
} from "./lib/ui";
import { ClientePreventa, slugCliente } from "./lib/zod";

export default function Preventas() {
  const router = useRouter();
  const user = useUser();
  const { data: resumen = [], isLoading } = useResumenPreventas();
  const eliminarPreventaCliente = useEliminarPreventaCliente();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const metadata = user?.user_metadata || {};
  const realRole = (metadata.rol || user?.role || "user") as string;
  const canEliminarPreventa =
    realRole === "admin" || realRole === "super";

  const filtrados = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (resumen as ClientePreventa[]).filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) || c.nit.includes(searchTerm),
    );
  }, [resumen, searchTerm]);

  const irCliente = (cliente: ClientePreventa) => {
    router.push(
      `/cermadsa/laarada/preventas/${encodeURIComponent(slugCliente(cliente.nombre))}`,
    );
  };

  const confirmarEliminarPreventa = async (cliente: ClientePreventa) => {
    if (cliente.cantidadMovimientos > 0) {
      toast.warn(
        "No se puede eliminar: el cliente tiene movimientos. Elimine cada uno desde el detalle primero.",
        { autoClose: 5000 },
      );
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Eliminar registro de preventa?",
      html: `Se borrarán anticipos huérfanos de <strong>${cliente.nombre}</strong> (sin movimientos en kardex). El cliente en ventas no se elimina.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      customClass: {
        popup: "!rounded-2xl border border-border dark:border-zinc-700",
        confirmButton:
          "inline-flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900 border-0 shadow-none cursor-pointer",
        cancelButton:
          "inline-flex h-10 items-center justify-center rounded-xl px-5 text-xs font-bold bg-sky-100 text-azul-trifinio hover:bg-sky-200 dark:bg-sky-950 dark:text-azul-trifinio dark:hover:bg-sky-900 border-0 shadow-none cursor-pointer",
        actions: "flex w-full flex-wrap justify-center gap-2",
      },
      background: isDark ? "#18181b" : "#f4f4f5",
      color: isDark ? "#fafafa" : "#18181b",
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "10001";
      },
    });

    if (!result.isConfirmed) return;

    await eliminarPreventaCliente.mutateAsync({
      cliente_id: cliente.cliente_id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Cargando preventas...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada")}
          className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </button>
        <div className="min-w-0 text-right">
          <h1 className="text-base md:text-xl font-black uppercase tracking-tight text-foreground">
            Preventas
          </h1>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">
          <span className="text-foreground">Total: </span>
          <span className="text-zinc-600 dark:text-zinc-300">
            {filtrados.length}
          </span>
        </p>

        <div className={tableShell}>
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente o NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchInput}
              />
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={cargarSaldoBtn}
            >
              <Plus className="size-4" />
              Cargar Preventa
            </button>
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
              <Wallet className="size-8 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm font-bold uppercase">
                Sin saldos registrados
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className={creditosTableWrap}>
                <div className={creditosTableScroll}>
                  <table className={creditosTableClass}>
                    <thead className={creditosTheadClass}>
                      <tr>
                        <th className="sticky left-0 z-20 w-12 bg-zinc-50 px-2 py-3 text-center shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800/60">
                          No.
                        </th>
                        <th className="sticky left-12 z-20 w-[9rem] max-w-[9rem] bg-zinc-50 px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800/60 lg:w-[20rem] lg:max-w-[20rem] lg:px-4 xl:w-[26rem] xl:max-w-[26rem]">
                          Nombre
                        </th>
                        <th className="px-4 py-3">NIT</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3 text-right">Saldo</th>
                        <th className="px-4 py-3 text-center">Movs.</th>
                        <th
                          className={cn(
                            "px-2 py-3 text-right",
                            canEliminarPreventa ? "w-24" : "w-14",
                          )}
                        />
                      </tr>
                    </thead>
                    <tbody className={creditosTbodyClass}>
                      {filtrados.map((cliente, index) => (
                        <tr
                          key={cliente.cliente_id}
                          onClick={() => irCliente(cliente)}
                          className={creditosRowClass}
                        >
                          <td className="sticky left-0 z-10 w-12 bg-white px-2 py-2.5 text-center tabular-nums shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-900 lg:py-3">
                            {index + 1}
                          </td>
                          <td className="sticky left-12 z-10 w-[9rem] max-w-[9rem] bg-white px-2 py-2.5 text-[11px] font-bold uppercase leading-snug text-foreground shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-900 lg:w-[20rem] lg:max-w-[20rem] lg:px-4 lg:py-3 lg:text-sm xl:w-[26rem] xl:max-w-[26rem]">
                            <span className="line-clamp-2">{cliente.nombre}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-orange-500 whitespace-nowrap dark:text-orange-400">
                            {cliente.nit}
                          </td>
                          <td className="px-4 py-3">
                            {cliente.telefono && cliente.telefono !== "N/A" ? (
                              <span
                                className={cn(
                                  phonePill,
                                  "max-w-full truncate",
                                )}
                              >
                                <Phone className="size-3.5 shrink-0" />
                                <span className="truncate">
                                  {cliente.telefono}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                            Q{formatMoney(cliente.saldo)}
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums whitespace-nowrap">
                            <span className="inline-flex rounded-md border border-sky-200 bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400">
                              {cliente.cantidadMovimientos}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {canEliminarPreventa && (
                                <button
                                  type="button"
                                  disabled={
                                    eliminarPreventaCliente.isPending ||
                                    cliente.cantidadMovimientos > 0
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void confirmarEliminarPreventa(cliente);
                                  }}
                                  className={cn(
                                    "inline-flex size-9 items-center justify-center rounded-lg cursor-pointer disabled:cursor-not-allowed",
                                    cliente.cantidadMovimientos > 0
                                      ? "text-muted-foreground opacity-40"
                                      : "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/60",
                                    eliminarPreventaCliente.isPending &&
                                      "opacity-50",
                                  )}
                                  aria-label="Eliminar preventa del cliente"
                                  title={
                                    cliente.cantidadMovimientos > 0
                                      ? "Tiene movimientos — elimine desde el detalle"
                                      : "Eliminar registro sin movimientos"
                                  }
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  irCliente(cliente);
                                }}
                                className={creditosNavBtn}
                                aria-label="Entrar"
                              >
                                <ChevronRight className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CargarSaldo
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedCliente={null}
      />
      <ReciboPreventaPrint />
    </div>
  );
}
