"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, FileDown } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  useClientePreventaBySlug,
  useMovimientosCliente,
} from "./lib/hooks";
import {
  PreventaMovimiento,
  ReciboPreventa,
  codigoCorto,
  formatReciboMovimientoLabel,
  formatReciboVentaLabel,
  preventaEstaFacturada,
  razonMovimientoLabel,
} from "./lib/zod";
import CargarSaldo from "./forms/CargarSaldo";
import CertificarFactura from "./forms/CertificarFactura";
import AnularFactura from "./forms/AnularFactura";
import ComprobanteAnticipo from "./forms/ComprobanteAnticipo";
import EliminarConsumo from "./forms/EliminarConsumo";
import ReciboPreventaPrint from "./components/recibo-preventa-print";
import ReciboVentaSimulado, {
  ReciboVentaSimuladoData,
} from "./components/recibo-venta-simulado";
import MovimientosTable from "./components/movimientos-table";
import TablePagination, { useTablePagination } from "./components/table-pagination";
import ReceiptModal from "@/components/(LaArada)/ventas/modals/receipt-modal";
import {
  cargarSaldoBtn,
  formatFechaHora,
  formatMoney,
  pdfBtnClass,
  simularToggleOff,
  tableShell,
} from "./lib/ui";
import { exportMovimientosPreventaPdf } from "./lib/export-movimientos-pdf";
import {
  canUsePreventasSimular,
  readLaAradaSimulatedRole,
} from "@/components/(LaArada)/lib/simulated-role";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIMULAR_KEY = "preventas-simular";
const SIMULADO_MOVIMIENTOS_COUNT = 10;

function sortMovimientosDesc(items: PreventaMovimiento[]): PreventaMovimiento[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function buildSimuladoIngreso(
  clienteId: string,
  saldoActual: number,
): PreventaMovimiento {
  return {
    id: "simulado-ingreso",
    cliente_id: clienteId,
    tipo: "ingreso",
    monto: 500,
    saldo_resultante: Math.max(saldoActual, 500),
    metodo_pago: "Transferencia",
    preventa_id: "simulado-ingreso",
    venta_id: null,
    usuario_nombre: "Ejemplo",
    created_at: new Date().toISOString(),
    simulado: true,
  };
}

function buildSimuladosConsumos(
  clienteId: string,
  saldoInicial: number,
): PreventaMovimiento[] {
  const montos = [250, 180, 320, 150, 400, 275, 190, 210, 350, 125];
  let saldo = saldoInicial;

  return Array.from({ length: SIMULADO_MOVIMIENTOS_COUNT }, (_, i) => {
    const monto = montos[i] ?? 250;
    saldo = Math.max(0, saldo - monto);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - (SIMULADO_MOVIMIENTOS_COUNT - i));

    return {
      id: `simulado-consumo-${i}`,
      cliente_id: clienteId,
      tipo: "consumo",
      monto,
      saldo_resultante: saldo,
      metodo_pago: null,
      preventa_id: null,
      venta_id: `simulado-venta-${i}`,
      usuario_nombre: "Ejemplo",
      created_at: fecha.toISOString(),
      venta_numero: i + 1,
      simulado: true,
    };
  });
}

export default function PreventaCliente({ slug }: { slug: string }) {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);
  const canSimularMovimientos = canUsePreventasSimular(realRole, effectiveRole);
  const canEliminarMovimientos =
    realRole === "admin" ||
    (realRole === "super" && effectiveRole === "super");

  useEffect(() => {
    if (realRole === "super") {
      setEffectiveRole(readLaAradaSimulatedRole(realRole));
      return;
    }
    setEffectiveRole(realRole);
  }, [realRole]);

  useEffect(() => {
    const syncRole = () => {
      if (realRole === "super") {
        setEffectiveRole(readLaAradaSimulatedRole(realRole));
      }
    };
    window.addEventListener("laarada-simulated-role-change", syncRole);
    window.addEventListener("focus", syncRole);
    return () => {
      window.removeEventListener("laarada-simulated-role-change", syncRole);
      window.removeEventListener("focus", syncRole);
    };
  }, [realRole]);

  const { data: cliente, isLoading, isError } = useClientePreventaBySlug(slug);
  const { data: movimientos = [], isLoading: loadingMov } =
    useMovimientosCliente(cliente?.cliente_id ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMov, setEditMov] = useState<PreventaMovimiento | null>(null);
  const [certificarMov, setCertificarMov] =
    useState<PreventaMovimiento | null>(null);
  const [anularMov, setAnularMov] = useState<PreventaMovimiento | null>(null);
  const [eliminarMov, setEliminarMov] = useState<PreventaMovimiento | null>(null);
  const [comprobanteMov, setComprobanteMov] = useState<PreventaMovimiento | null>(
    null,
  );
  const [ventaReciboId, setVentaReciboId] = useState<string | null>(null);
  const [ventaSimulada, setVentaSimulada] =
    useState<ReciboVentaSimuladoData | null>(null);
  const [simular, setSimular] = useState(false);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  useEffect(() => {
    if (!canSimularMovimientos) {
      setSimular(false);
      return;
    }
    setSimular(sessionStorage.getItem(SIMULAR_KEY) === "1");
  }, [canSimularMovimientos]);

  const ingresos = useMemo(
    () => movimientos.filter((m) => m.tipo === "ingreso"),
    [movimientos],
  );

  const consumos = useMemo(
    () => movimientos.filter((m) => m.tipo === "consumo"),
    [movimientos],
  );

  const saldoActual = useMemo(() => {
    if (!cliente) return 0;
    if (movimientos.length === 0) return cliente.saldo;
    return movimientos[0].saldo_resultante;
  }, [movimientos, cliente]);

  const tablaMovimientos = useMemo(() => {
    if (!cliente) return [];

    const ingresosVista =
      ingresos.length > 0
        ? ingresos
        : simular
          ? [buildSimuladoIngreso(cliente.cliente_id, saldoActual)]
          : [];

    const consumosVista =
      consumos.length > 0
        ? consumos
        : simular
          ? buildSimuladosConsumos(cliente.cliente_id, saldoActual)
          : [];

    return sortMovimientosDesc([...ingresosVista, ...consumosVista]);
  }, [cliente, ingresos, consumos, simular, saldoActual]);

  const {
    pageSize: movPageSize,
    setPageSize: setMovPageSize,
    currentPage: movCurrentPage,
    setCurrentPage: setMovCurrentPage,
    pageItems: movimientosPagina,
  } = useTablePagination(tablaMovimientos);

  const handleExportarMovimientos = async () => {
    if (!cliente) return;
    if (tablaMovimientos.length === 0) {
      toast.warn("No hay movimientos para exportar.");
      return;
    }

    setExportandoPdf(true);
    try {
      const rows = tablaMovimientos.map((mov) => {
        const esIngreso = mov.tipo === "ingreso";
        const reciboLabel = `#${formatReciboMovimientoLabel(mov)}`;
        return {
          recibo: reciboLabel,
          fecha: formatFechaHora(mov.created_at),
          tipo: razonMovimientoLabel(mov),
          codVenta:
            mov.tipo === "consumo"
              ? `#${formatReciboVentaLabel(mov)}`
              : "—",
          monto: `${esIngreso ? "+" : "-"}Q${formatMoney(mov.monto)}`,
          disponible: `Q${formatMoney(mov.saldo_resultante)}`,
        };
      });

      const totalMonto = tablaMovimientos.reduce((sum, mov) => {
        const m = Number(mov.monto || 0);
        return mov.tipo === "ingreso" ? sum + m : sum - m;
      }, 0);

      const saldoPdf =
        tablaMovimientos.length > 0
          ? tablaMovimientos[tablaMovimientos.length - 1].saldo_resultante
          : saldoActual;

      const result = await exportMovimientosPreventaPdf(
        cliente.nombre,
        cliente.nit,
        `Q${formatMoney(saldoPdf)}`,
        rows,
        {
          monto: `${totalMonto >= 0 ? "+" : "-"}Q${formatMoney(Math.abs(totalMonto))}`,
          disponible: `Q${formatMoney(saldoPdf)}`,
        },
      );

      toast.success(
        result === "shared"
          ? "Elige WhatsApp y envía solo el PDF."
          : "PDF descargado correctamente.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setExportandoPdf(false);
    }
  };

  const toggleSimular = () => {
    setSimular((prev) => {
      const next = !prev;
      sessionStorage.setItem(SIMULAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  const reimprimir = (mov: PreventaMovimiento) => {
    if (!cliente) return;
    const recibo: ReciboPreventa = {
      tipo: mov.tipo,
      codigo: codigoCorto(mov.preventa_id || mov.venta_id || mov.id),
      cliente_nombre: cliente.nombre,
      cliente_nit: cliente.nit,
      monto: mov.monto,
      saldo_resultante: mov.saldo_resultante,
      metodo_pago: mov.metodo_pago,
      venta_codigo: mov.venta_id ? codigoCorto(mov.venta_id) : null,
      usuario_nombre: mov.usuario_nombre,
      fecha: mov.created_at,
      dte: mov.dte ?? null,
    };
    window.dispatchEvent(
      new CustomEvent<ReciboPreventa>("imprimir-preventa", { detail: recibo }),
    );
  };

  const abrirCargarSaldo = () => {
    setEditMov(null);
    setModalOpen(true);
  };

  const abrirEditarCarga = (mov: PreventaMovimiento) => {
    if (mov.simulado) return;
    if (preventaEstaFacturada(mov)) {
      toast.warn(
        "Este anticipo ya tiene factura electrónica certificada y no puede editarse.",
      );
      return;
    }
    setEditMov(mov);
    setModalOpen(true);
  };

  const abrirCertificarFactura = (mov: PreventaMovimiento) => {
    if (mov.simulado || mov.tipo !== "ingreso") return;
    if (preventaEstaFacturada(mov)) {
      toast.warn(
        "Este anticipo ya tiene factura electrónica certificada.",
      );
      return;
    }
    setCertificarMov(mov);
  };

  const abrirAnularFactura = (mov: PreventaMovimiento) => {
    if (mov.simulado || mov.tipo !== "ingreso") return;
    if (!preventaEstaFacturada(mov)) return;
    setAnularMov(mov);
  };

  const abrirEliminarMovimiento = (mov: PreventaMovimiento) => {
    if (mov.simulado || !canEliminarMovimientos) return;
    if (preventaEstaFacturada(mov)) {
      toast.warn(
        "No se puede eliminar un anticipo con factura certificada. Anule la factura primero.",
      );
      return;
    }
    setEliminarMov(mov);
  };

  const cerrarCargarSaldo = () => {
    setModalOpen(false);
    setEditMov(null);
  };

  const abrirComprobanteAnticipo = (mov: PreventaMovimiento) => {
    if (mov.simulado) return;
    setComprobanteMov(mov);
  };

  const cerrarComprobanteAnticipo = () => setComprobanteMov(null);

  const comprobanteMovVivo = useMemo(() => {
    if (!comprobanteMov) return null;
    return movimientos.find((m) => m.id === comprobanteMov.id) ?? comprobanteMov;
  }, [comprobanteMov, movimientos]);

  const verReciboVenta = (ventaId: string, simulado?: boolean) => {
    if (!cliente) return;
    if (simulado || !UUID_RE.test(ventaId)) {
      const mov = tablaMovimientos.find((m) => m.venta_id === ventaId);
      setVentaSimulada({
        codigo: formatReciboVentaLabel(mov ?? { simulado: true, venta_numero: 1 }),
        cliente_nombre: cliente.nombre,
        cliente_nit: cliente.nit,
        monto: mov?.monto ?? 250,
        usuario_nombre: mov?.usuario_nombre,
        fecha: mov?.created_at ?? new Date().toISOString(),
      });
      return;
    }
    setVentaReciboId(ventaId);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Cargando cliente...
        </p>
      </div>
    );
  }

  if (isError || !cliente) {
    return (
      <div className="mx-auto w-full space-y-4 p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada/preventas")}
          className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </button>
        <p className="text-sm font-bold uppercase text-muted-foreground">
          Cliente no encontrado
        </p>
      </div>
    );
  }

  const sinMovimientos = tablaMovimientos.length === 0;

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada/preventas")}
          className="group inline-flex shrink-0 items-center gap-2 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </button>
        <div className="min-w-0 text-right">
          <h1 className="truncate text-base font-black uppercase tracking-tight text-foreground md:text-xl">
            {cliente.nombre}
          </h1>
          <p className="text-xs text-muted-foreground">
            NIT: {cliente.nit}
            {cliente.telefono && cliente.telefono !== "N/A"
              ? ` · ${cliente.telefono}`
              : ""}
          </p>
        </div>
      </div>

      <div className={tableShell}>
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 dark:border-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-300">
              Saldo disponible
            </p>
            <p className="text-3xl font-black tabular-nums text-foreground">
              Q{formatMoney(saldoActual)}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            {canSimularMovimientos && (
              <button
                type="button"
                role="switch"
                aria-checked={simular}
                onClick={toggleSimular}
                className={cn(simular ? cargarSaldoBtn : simularToggleOff, "w-full sm:w-auto")}
              >
                <span
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full",
                    simular ? "bg-sky-600 dark:bg-sky-400" : "bg-zinc-400 dark:bg-zinc-500",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-3 rounded-full bg-white transition-transform",
                      simular ? "translate-x-3.5" : "translate-x-0.5",
                    )}
                  />
                </span>
                Simular
              </button>
            )}
            <button
              type="button"
              onClick={abrirCargarSaldo}
              className={cn(cargarSaldoBtn, "w-full sm:w-auto")}
            >
              <Plus className="size-4" />
              Cargar Preventa
            </button>
          </div>
        </div>

        {loadingMov ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-zinc-500" />
            Cargando movimientos...
          </div>
        ) : sinMovimientos ? (
          <div className="py-10 text-center text-sm font-bold uppercase text-muted-foreground">
            Sin movimientos
          </div>
        ) : (
          <>
            {tablaMovimientos.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-4 px-4 py-4">
                  <p className="text-sm font-black uppercase tracking-widest text-foreground md:text-base">
                    Movimientos
                  </p>
                  <button
                    type="button"
                    onClick={handleExportarMovimientos}
                    disabled={exportandoPdf}
                    className={pdfBtnClass}
                  >
                    {exportandoPdf ? (
                      <Loader2 className="size-4 shrink-0 animate-spin text-red-600 dark:text-red-400" />
                    ) : (
                      <FileDown className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    PDF
                  </button>
                </div>
                <MovimientosTable
                  movimientos={movimientosPagina}
                  canEliminar={canEliminarMovimientos}
                  onVerReciboVenta={verReciboVenta}
                  onReimprimirPreventa={reimprimir}
                  onComprobanteAnticipo={abrirComprobanteAnticipo}
                  onEditarCarga={abrirEditarCarga}
                  onCertificarFactura={abrirCertificarFactura}
                  onAnularFactura={abrirAnularFactura}
                  onEliminarMovimiento={abrirEliminarMovimiento}
                />
                <TablePagination
                  totalItems={tablaMovimientos.length}
                  pageSize={movPageSize}
                  currentPage={movCurrentPage}
                  onPageSizeChange={setMovPageSize}
                  onPageChange={setMovCurrentPage}
                />
              </>
            )}
          </>
        )}
      </div>

      <CargarSaldo
        isOpen={modalOpen}
        onClose={cerrarCargarSaldo}
        editMov={editMov}
        preselectedCliente={{
          id: cliente.cliente_id,
          nombre: cliente.nombre,
        }}
      />
      <CertificarFactura
        isOpen={!!certificarMov}
        onClose={() => setCertificarMov(null)}
        mov={certificarMov}
        cliente={{
          id: cliente.cliente_id,
          nombre: cliente.nombre,
          nit: cliente.nit,
        }}
      />
      <AnularFactura
        isOpen={!!anularMov}
        onClose={() => setAnularMov(null)}
        mov={anularMov}
      />
      <EliminarConsumo
        isOpen={!!eliminarMov}
        onClose={() => setEliminarMov(null)}
        mov={eliminarMov}
      />
      <ComprobanteAnticipo
        isOpen={!!comprobanteMovVivo}
        onClose={cerrarComprobanteAnticipo}
        mov={comprobanteMovVivo}
      />
      <ReciboPreventaPrint />

      {ventaSimulada && (
        <ReciboVentaSimulado
          data={ventaSimulada}
          onClose={() => setVentaSimulada(null)}
        />
      )}

      <ReceiptModal
        isOpen={!!ventaReciboId}
        onClose={() => setVentaReciboId(null)}
        ventaId={ventaReciboId}
        isReadonly
      />
    </div>
  );
}
