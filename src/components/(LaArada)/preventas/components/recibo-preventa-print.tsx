"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalCancel, ModalFooter } from "@/components/ui/general-modal";
import { getEmisorConfig } from "@/lib/infile";
import { ReciboPreventa } from "../lib/zod";
import { formatMoney } from "../lib/ui";

const RECEIPT_PAGE_W_IN = 9.5;
const RECEIPT_PAGE_H_IN = 11;
const RECEIPT_DOC_W_PX = Math.round(RECEIPT_PAGE_W_IN * 96);

const RECEIPT_PRINT_STYLES = `
  @page {
    margin: 0;
    size: ${RECEIPT_PAGE_W_IN}in ${RECEIPT_PAGE_H_IN}in;
  }
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${RECEIPT_PAGE_W_IN}in !important;
    }
    body > div {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0.1in 0 0 0 !important;
      border: none !important;
    }
  }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    width: ${RECEIPT_PAGE_W_IN}in;
    margin: 0;
    padding: 0;
    color: black;
    line-height: 1.3;
    background: white;
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { vertical-align: top; }
  p, h1, h2, h3, div { margin: 0; }
`;

export function printHtmlContent(content: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(
    `<html><head><title>${title}</title><style>${RECEIPT_PRINT_STYLES}</style></head><body>${content}</body></html>`,
  );
  doc.close();

  const images = Array.from(
    iframe.contentDocument?.images ?? [],
  ) as HTMLImageElement[];

  const cleanup = () =>
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1500);

  const doPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  };

  if (images.length > 0) {
    let loaded = 0;
    const tryPrint = () => {
      loaded++;
      if (loaded >= images.length) doPrint();
    };
    images.forEach((img) => {
      if (img.complete) tryPrint();
      else {
        img.onload = tryPrint;
        img.onerror = tryPrint;
      }
    });
  } else {
    setTimeout(doPrint, 250);
  }
}

export function ScaledDocument({ children }: { children: React.ReactNode }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [scaledHeight, setScaledHeight] = React.useState<number | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const outer = wrapRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const available = outer.clientWidth;
      const s = available > 0 ? Math.min(1, available / RECEIPT_DOC_W_PX) : 1;
      setScale(s);
      setScaledHeight(inner.scrollHeight * s);
    };

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height: scaledHeight ?? "auto",
        overflow: "hidden",
      }}
    >
      <div
        ref={innerRef}
        style={{
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          width: RECEIPT_DOC_W_PX,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ReciboPrintFrame({
  title,
  printContainerId,
  printTitle,
  onClose,
  children,
}: {
  title: string;
  printContainerId: string;
  printTitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handlePrint = () => {
    const content = document.getElementById(printContainerId)?.innerHTML;
    if (!content) return;
    printHtmlContent(content, printTitle);
  };

  const node = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/60 backdrop-blur-sm text-foreground sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-none bg-zinc-100 shadow-2xl dark:bg-zinc-900 sm:h-auto sm:max-h-[95vh] sm:max-w-3xl sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <h2 className="text-base font-bold uppercase tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-zinc-200 cursor-pointer dark:hover:bg-zinc-700"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-4">
          <ScaledDocument>
            <div
              id={printContainerId}
              style={{
                width: RECEIPT_DOC_W_PX,
                minWidth: RECEIPT_DOC_W_PX,
                backgroundColor: "white",
                color: "black",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "11px",
                boxSizing: "border-box",
                border: "1px solid #000",
                paddingTop: "20px",
              }}
            >
              {children}
            </div>
          </ScaledDocument>
        </div>
        <ModalFooter className="border-t border-zinc-200 dark:border-zinc-700">
          <ModalCancel onClick={onClose} />
          <button
            type="button"
            onClick={handlePrint}
            className={cn(
              "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-sky-600 bg-sky-100 px-6 text-sm font-bold text-sky-600 transition-colors hover:bg-sky-200 active:scale-95 cursor-pointer sm:flex-none dark:border-sky-400 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900",
            )}
          >
            <Printer className="size-4 shrink-0" />
            Imprimir
          </button>
        </ModalFooter>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(node, document.body);
}

function ReciboHeader({ titulo, codigo, fecha }: { titulo: string; codigo: string; fecha: string }) {
  const emisor = getEmisorConfig();
  const fechaObj = new Date(fecha);
  const fechaTxt = Number.isNaN(fechaObj.getTime())
    ? fecha
    : `${fechaObj.toLocaleDateString("es-GT")}, ${fechaObj.toLocaleTimeString("es-GT")}`;

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        borderBottom: "2px solid #000",
      }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "10px 16px", verticalAlign: "middle", width: "55%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <img
                src="/logos/LaArada.png"
                alt="Logo"
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                  filter: "brightness(0)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "18px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                    color: "#000",
                  }}
                >
                  {emisor.nombreComercial}
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    fontStyle: "italic",
                    marginTop: "2px",
                    color: "#444",
                  }}
                >
                  Construyendo Junto a ti el Futuro
                </div>
              </div>
            </div>
            <div style={{ fontSize: "8px", color: "#333" }}>
              {emisor.direccion.direccion}, {emisor.direccion.municipio},{" "}
              {emisor.direccion.departamento} | TEL: {emisor.telefono}
            </div>
            <div style={{ fontSize: "10px", color: "#333" }}>
              {emisor.nombreEmisor} | NIT: {emisor.nitEmisor}
            </div>
          </td>
          <td
            style={{
              padding: "10px 16px",
              verticalAlign: "middle",
              textAlign: "right",
              width: "45%",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: "18px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#000",
              }}
            >
              {titulo}
            </div>
            <div style={{ fontSize: "11px", marginTop: "8px" }}>
              <strong>Cod. Recibo:</strong> {codigo}
            </div>
            <div style={{ fontSize: "10px", marginTop: "3px" }}>
              <strong>Fecha:</strong> {fechaTxt}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ReciboPreventaTicket({ data }: { data: ReciboPreventa }) {
  const esIngreso = data.tipo === "ingreso";
  const saldoAnterior = esIngreso
    ? data.saldo_resultante - data.monto
    : data.saldo_resultante + data.monto;

  return (
    <>
      <ReciboHeader
        titulo={esIngreso ? "RECIBO DE ANTICIPO" : "RECIBO DE APLICACIÓN"}
        codigo={data.codigo}
        fecha={data.fecha}
      />
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderBottom: "1px solid #000",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "9px 20px", width: "55%", verticalAlign: "top" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "55px", color: "#444" }}>
                  Cliente:
                </span>
                <span>{data.cliente_nombre}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "55px", color: "#444" }}>
                  NIT:
                </span>
                <span>{data.cliente_nit}</span>
              </div>
            </td>
            <td style={{ padding: "9px 20px", width: "45%", verticalAlign: "top" }}>
              {data.metodo_pago && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>
                    Método:
                  </span>
                  <span>{data.metodo_pago}</span>
                </div>
              )}
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>
                  Atendió:
                </span>
                <span>{data.usuario_nombre || "—"}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th
              style={{
                padding: "7px 20px",
                textAlign: "left",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Descripción
            </th>
            <th
              style={{
                padding: "7px 20px 7px 8px",
                textAlign: "right",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                width: "140px",
              }}
            >
              Monto
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
            <td style={{ padding: "8px 20px" }}>
              {esIngreso ? "Anticipo / carga de saldo" : "Aplicación de preventa"}
              {!esIngreso && data.venta_codigo ? ` · Venta #${data.venta_codigo}` : ""}
            </td>
            <td style={{ padding: "8px 20px 8px 8px", textAlign: "right", fontWeight: 700 }}>
              Q{formatMoney(data.monto)}
            </td>
          </tr>
        </tbody>
      </table>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderTop: "2px solid #000",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "20px", textAlign: "center", verticalAlign: "middle" }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "14px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {esIngreso ? "¡Gracias por su anticipo!" : "¡Gracias por su compra!"}
              </div>
            </td>
            <td style={{ padding: "12px 20px", verticalAlign: "middle", width: "250px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ paddingTop: "5px", fontWeight: 700, fontSize: "11px" }}>
                      SALDO ANTERIOR:
                    </td>
                    <td
                      style={{
                        paddingTop: "5px",
                        fontWeight: 700,
                        fontSize: "13px",
                        textAlign: "right",
                      }}
                    >
                      Q{formatMoney(saldoAnterior)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "5px", fontWeight: 700, fontSize: "12px" }}>
                      {esIngreso ? "ANTICIPO:" : "APLICADO:"}
                    </td>
                    <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "16px", textAlign: "right" }}>
                      Q{formatMoney(data.monto)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "8px", fontWeight: 900, fontSize: "14px" }}>
                      SALDO:
                    </td>
                    <td
                      style={{
                        paddingTop: "8px",
                        fontWeight: 900,
                        fontSize: "18px",
                        textAlign: "right",
                      }}
                    >
                      Q{formatMoney(data.saldo_resultante)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function ReciboPreventaPreview({
  data,
  onClose,
}: {
  data: ReciboPreventa;
  onClose: () => void;
}) {
  const esIngreso = data.tipo === "ingreso";
  return (
    <ReciboPrintFrame
      title={esIngreso ? "Recibo de anticipo" : "Recibo de aplicación"}
      printContainerId="print-container-preventa"
      printTitle="Recibo_Preventa"
      onClose={onClose}
    >
      <ReciboPreventaTicket data={data} />
    </ReciboPrintFrame>
  );
}

export default function ReciboPreventaPrint() {
  const [recibo, setRecibo] = useState<ReciboPreventa | null>(null);

  useEffect(() => {
    const handlePrint = (e: Event) => {
      const detail = (e as CustomEvent<ReciboPreventa>).detail;
      if (!detail) return;
      setRecibo(detail);
    };

    window.addEventListener("imprimir-preventa", handlePrint);
    return () => window.removeEventListener("imprimir-preventa", handlePrint);
  }, []);

  if (!recibo) return null;

  return (
    <ReciboPreventaPreview data={recibo} onClose={() => setRecibo(null)} />
  );
}
