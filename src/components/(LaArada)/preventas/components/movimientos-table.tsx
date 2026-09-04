"use client";

import { Ban, FileCheck2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PreventaMovimiento,
  formatReciboMovimientoLabel,
  preventaConsumoAnulado,
  preventaEstaFacturada,
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

const colDocumentoThClass =
  "w-[5.5rem] min-w-[5.5rem] px-3 py-3 text-center whitespace-nowrap";
const colDocumentoTdClass = "w-[5.5rem] min-w-[5.5rem] px-3 py-3 text-center";

const colAccionesThClass =
  "w-[3.5rem] min-w-[3.5rem] px-2 py-3 text-center whitespace-nowrap";
const colAccionesTdClass = "w-[3.5rem] min-w-[3.5rem] px-2 py-3 text-center";

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

function DocumentoCell({
  mov,
  onVerRecibo,
}: {
  mov: PreventaMovimiento;
  onVerRecibo: () => void;
}) {
  if (mov.tipo === "ingreso" && mov.simulado) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  if (mov.tipo === "ingreso" && preventaEstaFacturada(mov)) {
    return (
      <button
        type="button"
        onClick={onVerRecibo}
        className={celdaLinkClass}
        title={`Factura ${mov.dte?.serie}-${mov.dte?.numero}`}
      >
        FEL
      </button>
    );
  }

  return (
    <button type="button" onClick={onVerRecibo} className={celdaLinkClass}>
      Ver
    </button>
  );
}

function AccionesCell({
  mov,
  canEliminar,
  onEditarCarga,
  onCertificarFactura,
  onAnularFactura,
  onEliminarMovimiento,
}: {
  mov: PreventaMovimiento;
  canEliminar: boolean;
  onEditarCarga: (mov: PreventaMovimiento) => void;
  onCertificarFactura: (mov: PreventaMovimiento) => void;
  onAnularFactura: (mov: PreventaMovimiento) => void;
  onEliminarMovimiento: (mov: PreventaMovimiento) => void;
}) {
  if (mov.simulado) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  const esIngreso = mov.tipo === "ingreso";
  const facturado = preventaEstaFacturada(mov);
  const puedeEditar = esIngreso && !facturado;
  const puedeCertificar = esIngreso && !facturado;
  const puedeAnular = esIngreso && facturado;
  const puedeEliminar = canEliminar && !facturado && !preventaConsumoAnulado(mov);

  if (!puedeEditar && !puedeCertificar && !puedeAnular && !puedeEliminar) {
    return <span className={cn(celdaTextoClass, "text-muted-foreground")}>—</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200 cursor-pointer dark:text-zinc-300 dark:hover:bg-zinc-700"
          aria-label="Opciones del movimiento"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {puedeEditar && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onEditarCarga(mov)}
          >
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
        )}
        {puedeCertificar && (
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onCertificarFactura(mov)}
          >
            <FileCheck2 className="size-4" />
            Certificar FEL
          </DropdownMenuItem>
        )}
        {puedeAnular && (
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onSelect={() => onAnularFactura(mov)}
          >
            <Ban className="size-4" />
            Anular factura
          </DropdownMenuItem>
        )}
        {puedeEliminar && (
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onSelect={() => onEliminarMovimiento(mov)}
          >
            <Trash2 className="size-4" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MovimientosTableProps {
  movimientos: PreventaMovimiento[];
  canEliminar?: boolean;
  onVerReciboVenta: (ventaId: string, simulado?: boolean) => void;
  onReimprimirPreventa: (mov: PreventaMovimiento) => void;
  onComprobanteAnticipo: (mov: PreventaMovimiento) => void;
  onEditarCarga: (mov: PreventaMovimiento) => void;
  onCertificarFactura: (mov: PreventaMovimiento) => void;
  onAnularFactura: (mov: PreventaMovimiento) => void;
  onEliminarMovimiento: (mov: PreventaMovimiento) => void;
}

export default function MovimientosTable({
  movimientos,
  canEliminar = false,
  onVerReciboVenta,
  onReimprimirPreventa,
  onComprobanteAnticipo,
  onEditarCarga,
  onCertificarFactura,
  onAnularFactura,
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
                <th className={colDocumentoThClass}>Documento</th>
                <th className={colAccionesThClass} />
              </tr>
            </thead>
            <tbody className={creditosTbodyClass}>
              {movimientos.map((mov) => {
                const esIngreso = mov.tipo === "ingreso";
                const consumoAnulado = preventaConsumoAnulado(mov);
                const recibo = formatReciboMovimientoLabel(mov);

                return (
                  <tr
                    key={mov.id}
                    className={cn(
                      rowClass,
                      consumoAnulado && "opacity-70",
                    )}
                  >
                    <td className={stickyReciboTdClass}>
                      <span className="font-mono text-xs font-bold md:text-sm">
                        #{recibo}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {razonMovimientoLabel(mov)}
                        {preventaEstaFacturada(mov) && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-azul-trifinio dark:bg-sky-950 dark:text-sky-400"
                            title={`Factura ${mov.dte?.serie}-${mov.dte?.numero}`}
                          >
                            <FileCheck2 className="size-3" />
                            FEL
                          </span>
                        )}
                        {consumoAnulado && (
                          <span className="inline-flex items-center rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:bg-red-950 dark:text-red-400">
                            Anulado
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap",
                        consumoAnulado
                          ? "text-muted-foreground line-through"
                          : esIngreso
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
                    <td className={colDocumentoTdClass}>
                      <DocumentoCell
                        mov={mov}
                        onVerRecibo={() => abrirRecibo(mov)}
                      />
                    </td>
                    <td className={colAccionesTdClass}>
                      <AccionesCell
                        mov={mov}
                        canEliminar={canEliminar}
                        onEditarCarga={onEditarCarga}
                        onCertificarFactura={onCertificarFactura}
                        onAnularFactura={onAnularFactura}
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
