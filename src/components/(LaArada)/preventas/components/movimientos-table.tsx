"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PreventaMovimiento,
  formatReciboMovimientoLabel,
  razonMovimientoLabel,
} from "../lib/zod";
import {
  creditosTableClass,
  creditosTableScroll,
  creditosTableWrap,
  creditosTbodyClass,
  creditosTheadClass,
  formatFechaHora,
  formatMoney,
} from "../lib/ui";

const stickyReciboThClass =
  "sticky left-0 z-20 w-[7rem] min-w-[7rem] max-w-[7rem] bg-zinc-50 px-2 py-3 text-[10px] leading-snug shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-800";

const stickyReciboTdClass =
  "sticky left-0 z-10 w-[7rem] min-w-[7rem] max-w-[7rem] bg-white px-2 py-3 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800";

const colRecibosThClass =
  "w-[5.5rem] min-w-[5.5rem] px-3 py-3 text-center whitespace-nowrap";
const colRecibosTdClass = "w-[5.5rem] min-w-[5.5rem] px-3 py-3 text-center";

const colEditarThClass =
  "w-[5rem] min-w-[5rem] px-3 py-3 text-center whitespace-nowrap";
const colEditarTdClass = "w-[5rem] min-w-[5rem] px-3 py-3 text-center";

const comprobanteThClass =
  "w-[6.5rem] min-w-[6.5rem] px-3 py-3 text-center whitespace-nowrap";
const comprobanteTdClass = "w-[6.5rem] min-w-[6.5rem] px-3 py-3 text-center";

const rowClass =
  "group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800";

const celdaTextoClass = "text-xs md:text-sm font-bold whitespace-nowrap";

const celdaLinkClass =
  "text-xs md:text-sm font-bold whitespace-nowrap text-sky-600 hover:text-sky-700 cursor-pointer dark:text-sky-400 dark:hover:text-sky-300";

const celdaLinkVerdeClass =
  "text-xs md:text-sm font-bold whitespace-nowrap text-emerald-600 hover:text-emerald-700 cursor-pointer dark:text-emerald-400 dark:hover:text-emerald-300";

const iconBtnLinkClass =
  "inline-flex size-9 items-center justify-center cursor-pointer text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300";

const iconBtnDeleteClass =
  "inline-flex size-9 items-center justify-center cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";

function ComprobanteCell({
  mov,
  onComprobanteAnticipo,
  onVerVenta,
}: {
  mov: PreventaMovimiento;
  onComprobanteAnticipo: (mov: PreventaMovimiento) => void;
  onVerVenta: () => void;
}) {
  if (mov.tipo === "consumo") {
    return (
      <button type="button" onClick={onVerVenta} className={celdaLinkClass}>
        Ver
      </button>
    );
  }

  if (mov.simulado) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  const tieneComprobante = Boolean(mov.img_comprobante_url?.trim());

  return (
    <button
      type="button"
      onClick={() => onComprobanteAnticipo(mov)}
      className={celdaLinkVerdeClass}
    >
      {tieneComprobante ? "Ver" : "Subir"}
    </button>
  );
}

function RecibosCell({ onVerRecibo }: { onVerRecibo: () => void }) {
  return (
    <button type="button" onClick={onVerRecibo} className={celdaLinkClass}>
      Ver
    </button>
  );
}

function EditarCell({
  mov,
  canEliminar,
  onEditarCarga,
  onEliminarMovimiento,
}: {
  mov: PreventaMovimiento;
  canEliminar: boolean;
  onEditarCarga: (mov: PreventaMovimiento) => void;
  onEliminarMovimiento: (mov: PreventaMovimiento) => void;
}) {
  if (mov.simulado) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  if (mov.tipo === "ingreso") {
    return (
      <div className="inline-flex items-center justify-center gap-0.5">
        <button
          type="button"
          onClick={() => onEditarCarga(mov)}
          className={iconBtnLinkClass}
          aria-label="Editar anticipo"
          title="Editar"
        >
          <Pencil className="size-4" />
        </button>
        {canEliminar && (
          <button
            type="button"
            onClick={() => onEliminarMovimiento(mov)}
            className={iconBtnDeleteClass}
            aria-label="Eliminar anticipo"
            title="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    );
  }

  if (!canEliminar) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onEliminarMovimiento(mov)}
      className={iconBtnDeleteClass}
      aria-label="Eliminar consumo"
      title="Eliminar"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

interface MovimientosTableProps {
  movimientos: PreventaMovimiento[];
  canEliminar?: boolean;
  onVerReciboVenta: (ventaId: string, simulado?: boolean) => void;
  onReimprimirPreventa: (mov: PreventaMovimiento) => void;
  onComprobanteAnticipo: (mov: PreventaMovimiento) => void;
  onEditarCarga: (mov: PreventaMovimiento) => void;
  onEliminarMovimiento: (mov: PreventaMovimiento) => void;
}

export default function MovimientosTable({
  movimientos,
  canEliminar = false,
  onVerReciboVenta,
  onReimprimirPreventa,
  onComprobanteAnticipo,
  onEditarCarga,
  onEliminarMovimiento,
}: MovimientosTableProps) {
  const abrirRecibo = (mov: PreventaMovimiento) => {
    if (mov.tipo === "ingreso") onReimprimirPreventa(mov);
    else onVerReciboVenta(mov.venta_id ?? "", mov.simulado);
  };

  return (
    <div className="px-4 pb-4">
      <div className={creditosTableWrap}>
        <div className={creditosTableScroll}>
          <table className={cn(creditosTableClass, "min-w-[44rem]")}>
            <thead className={cn(creditosTheadClass, "dark:bg-zinc-800")}>
              <tr>
                <th className={stickyReciboThClass}>Recibo</th>
                <th className="px-4 py-3">Razón</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right">Monto disponible</th>
                <th className="px-4 py-3">Fecha</th>
                <th className={comprobanteThClass}>Comprobante</th>
                <th className={colRecibosThClass}>Recibos</th>
                <th className={colEditarThClass}>Editar</th>
              </tr>
            </thead>
            <tbody className={creditosTbodyClass}>
              {movimientos.map((mov) => {
                const esIngreso = mov.tipo === "ingreso";
                const recibo = formatReciboMovimientoLabel(mov);

                return (
                  <tr key={mov.id} className={rowClass}>
                    <td className={stickyReciboTdClass}>
                      <span className="font-mono text-xs font-bold md:text-sm">
                        #{recibo}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {razonMovimientoLabel(mov)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap",
                        esIngreso
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {esIngreso ? "+" : "-"}Q{formatMoney(mov.monto)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      Q{formatMoney(mov.saldo_resultante)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold">
                        {formatFechaHora(mov.created_at)}
                      </span>
                      <span className="block text-xs">
                        <span className="font-bold text-foreground dark:text-white">
                          Por:
                        </span>
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          {mov.usuario_nombre}
                        </span>
                      </span>
                    </td>
                    <td className={comprobanteTdClass}>
                      <ComprobanteCell
                        mov={mov}
                        onComprobanteAnticipo={onComprobanteAnticipo}
                        onVerVenta={() =>
                          onVerReciboVenta(mov.venta_id ?? "", mov.simulado)
                        }
                      />
                    </td>
                    <td className={colRecibosTdClass}>
                      <RecibosCell onVerRecibo={() => abrirRecibo(mov)} />
                    </td>
                    <td className={colEditarTdClass}>
                      <EditarCell
                        mov={mov}
                        canEliminar={canEliminar}
                        onEditarCarga={onEditarCarga}
                        onEliminarMovimiento={onEliminarMovimiento}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
