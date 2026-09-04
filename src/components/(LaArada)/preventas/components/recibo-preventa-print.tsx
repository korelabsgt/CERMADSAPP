"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import jsPDF from "jspdf";
import { Download, FileCheck2, Loader2, Printer, Receipt, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalCancel, ModalFooter } from "@/components/ui/general-modal";
import { getEmisorConfig } from "@/lib/infile";
import { ReciboPreventa } from "../lib/zod";
import { formatMoney } from "../lib/ui";

const RECEIPT_PAGE_W_IN = 9.5;
const RECEIPT_PAGE_H_IN = 11;
const RECEIPT_DOC_W_PX = Math.round(RECEIPT_PAGE_W_IN * 96);
const PDF_MARGIN_IN = 0.22;

const tabEase = [0.4, 0, 0.2, 1] as const;

export const printDocStyle: React.CSSProperties = {
  width: RECEIPT_DOC_W_PX,
  minWidth: RECEIPT_DOC_W_PX,
  backgroundColor: "white",
  color: "black",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "11px",
  boxSizing: "border-box",
  border: "1px solid #000",
  paddingTop: "20px",
};

function slugNombreArchivo(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fechaArchivo(iso?: string | null) {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(parsed);
  const dia = parts.find((p) => p.type === "day")?.value;
  const mes = parts.find((p) => p.type === "month")?.value;
  const anio = parts.find((p) => p.type === "year")?.value;
  if (!dia || !mes || !anio) return "";
  return `${dia}-${mes}-${anio}`;
}

function nombrePdfPreventa(
  data: ReciboPreventa,
  tipo: "factura" | "recibo",
) {
  const cliente = slugNombreArchivo(data.cliente_nombre) || "Cliente";
  const fechaIso =
    tipo === "factura"
      ? data.dte?.fecha_certificacion || data.fecha
      : data.fecha;
  const fecha = fechaArchivo(fechaIso);
  const prefijo = tipo === "factura" ? "Factura" : "Recibo";
  return fecha ? `${prefijo}_${cliente}_${fecha}` : `${prefijo}_${cliente}`;
}

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

async function inlineHttpImagesAsDataUrls(root: ParentNode) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { mode: "cors" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        img.setAttribute("src", dataUrl);
      } catch {
        return;
      }
    }),
  );
}

function waitForImages(root: ParentNode): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  ).then(() => undefined);
}

function forceSafeColors(root: ParentNode) {
  const walk = (node: Node) => {
    if (node instanceof HTMLElement) {
      node.removeAttribute("class");
      const bg = node.style.backgroundColor;
      const color = node.style.color;
      if (bg && (bg.includes("lab") || bg.includes("oklch"))) {
        node.style.backgroundColor = "#ffffff";
      }
      if (color && (color.includes("lab") || color.includes("oklch"))) {
        node.style.color = "#000000";
      }
    }
    node.childNodes.forEach(walk);
  };
  walk(root);
}

function buildReceiptHtmlDocument(content: string, title: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-99999px;top:0;width:0;height:0;border:0;visibility:hidden;";

  iframe.srcdoc = `<!DOCTYPE html><html style="background:#ffffff;color:#000000;margin:0;padding:0;"><head><meta charset="utf-8"><title>${title}</title><style>${RECEIPT_PRINT_STYLES}</style></head><body style="background:#ffffff;color:#000000;margin:0;padding:0;">${content}</body></html>`;

  document.body.appendChild(iframe);
  return iframe;
}

async function loadReceiptIframe(iframe: HTMLIFrameElement) {
  if (iframe.contentDocument?.body?.children.length) return;
  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
  });
}

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

export async function downloadHtmlContentAsPdf(content: string, title: string) {
  const iframe = buildReceiptHtmlDocument(content, title);
  await loadReceiptIframe(iframe);

  const doc = iframe.contentDocument;
  if (!doc?.body) {
    if (iframe.parentNode) document.body.removeChild(iframe);
    return;
  }

  doc.documentElement.style.background = "#ffffff";
  doc.body.style.background = "#ffffff";
  doc.body.style.color = "#000000";
  doc.body.style.boxSizing = "border-box";
  doc.body.style.padding = "12px 16px";
  forceSafeColors(doc.body);

  await inlineHttpImagesAsDataUrls(doc.body);
  await waitForImages(doc.body);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const win = iframe.contentWindow;
  if (!win) {
    if (iframe.parentNode) document.body.removeChild(iframe);
    return;
  }

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(doc.body, {
    backgroundColor: "#ffffff",
    scale: 2,
    width: RECEIPT_DOC_W_PX,
    windowWidth: RECEIPT_DOC_W_PX,
    useCORS: true,
    allowTaint: true,
  });

  if (iframe.parentNode) document.body.removeChild(iframe);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: [RECEIPT_PAGE_W_IN, RECEIPT_PAGE_H_IN],
  });

  const pageW = RECEIPT_PAGE_W_IN;
  const pageH = RECEIPT_PAGE_H_IN;
  const contentW = pageW - PDF_MARGIN_IN * 2;
  const contentH = pageH - PDF_MARGIN_IN * 2;
  const imgW = contentW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.98);

  if (imgH <= contentH) {
    pdf.addImage(imgData, "JPEG", PDF_MARGIN_IN, PDF_MARGIN_IN, imgW, imgH);
  } else {
    let position = PDF_MARGIN_IN;
    let heightLeft = imgH;
    pdf.addImage(imgData, "JPEG", PDF_MARGIN_IN, position, imgW, imgH);
    heightLeft -= contentH;
    while (heightLeft > 0) {
      position -= contentH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", PDF_MARGIN_IN, position, imgW, imgH);
      heightLeft -= contentH;
    }
  }

  pdf.save(`${title}.pdf`);
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
  headerExtra,
  children,
}: {
  title: string;
  printContainerId: string;
  printTitle: string;
  onClose: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [descargando, setDescargando] = useState(false);

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

  const handleDownload = async () => {
    if (descargando) return;
    setDescargando(true);
    try {
      const esperaQr = printTitle.startsWith("Factura");
      if (esperaQr) {
        const started = Date.now();
        while (Date.now() - started < 2500) {
          const img = document
            .getElementById(printContainerId)
            ?.querySelector('img[alt="QR SAT"]');
          if (img instanceof HTMLImageElement && img.src.startsWith("data:")) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      }
      const content = document.getElementById(printContainerId)?.innerHTML;
      if (!content) return;
      await downloadHtmlContentAsPdf(content, printTitle);
    } finally {
      setDescargando(false);
    }
  };

  const actionBtnClass =
    "inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-sky-600 bg-sky-100 px-4 text-sm font-bold text-sky-600 transition-colors hover:bg-sky-200 active:scale-95 cursor-pointer sm:flex-none sm:px-5 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-400 dark:hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50";

  const node = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/60 backdrop-blur-sm text-foreground sm:items-center sm:justify-center sm:p-4">
      <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-none bg-zinc-100 shadow-2xl dark:bg-zinc-900 sm:h-auto sm:max-h-[95vh] sm:max-w-3xl sm:rounded-xl">
        <div className="flex shrink-0 flex-col border-b border-zinc-200 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h2 className="text-base font-bold uppercase tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-zinc-300 cursor-pointer dark:hover:bg-zinc-700"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </div>
          {headerExtra}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-4">
          <ScaledDocument>{children}</ScaledDocument>
        </div>
        <ModalFooter className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex w-full items-center justify-between gap-2">
            <ModalCancel onClick={onClose} />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
              <button
                type="button"
                onClick={handleDownload}
                disabled={descargando}
                className={actionBtnClass}
              >
                {descargando ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : (
                  <Download className="size-4 shrink-0" />
                )}
                {descargando ? "Generando..." : "Descargar PDF"}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className={actionBtnClass}
              >
                <Printer className="size-4 shrink-0" />
                Imprimir
              </button>
            </div>
          </div>
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
              {data.dte
                ? ` · Factura ${data.dte.serie}-${data.dte.numero}`
                : ""}
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

export function FacturaPreventaTicket({ data }: { data: ReciboPreventa }) {
  const dte = data.dte;
  const satUrl = dte
    ? `https://report.feel.com.gt/ingfac/verificar?numero_autorizacion=${dte.uuid}`
    : "";
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    if (!satUrl) return;
    let cancelado = false;
    void import("qrcode").then(({ default: QRCode }) =>
      QRCode.toDataURL(satUrl, {
        width: 180,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#FFFFFF" },
      }),
    ).then((url) => {
      if (!cancelado) setQrSrc(url);
    });
    return () => {
      cancelado = true;
    };
  }, [satUrl]);

  if (!dte) return null;

  const emisor = getEmisorConfig();
  const total = dte.total || data.monto;
  const gravable = Number((total / 1.12).toFixed(2));
  const iva = Number((total - gravable).toFixed(2));
  const fechaCert = dte.fecha_certificacion
    ? new Date(dte.fecha_certificacion).toLocaleString("es-GT")
    : "-";

  const labelStyle = {
    fontWeight: 700,
    fontSize: "10px",
    minWidth: "62px",
    color: "#444",
  } as const;

  const thStyle = {
    padding: "7px 8px",
    fontWeight: 700,
    fontSize: "10px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  } as const;

  return (
    <>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderBottom: "2px solid #000",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                padding: "10px 16px",
                verticalAlign: "middle",
                width: "55%",
              }}
            >
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
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#000",
                }}
              >
                FACTURA ELECTRÓNICA
              </div>
              <div
                style={{
                  fontSize: "8px",
                  marginTop: "3px",
                  color: "#555",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Documento Tributario Electrónico
              </div>
              <div style={{ fontSize: "10px", marginTop: "6px" }}>
                <strong>Serie:</strong> {dte.serie} &nbsp;&nbsp;{" "}
                <strong>No.:</strong> {dte.numero}
              </div>
              <div style={{ fontSize: "9px", marginTop: "2px" }}>
                <strong>Fecha de certificación:</strong> {fechaCert}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

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
                <span style={labelStyle}>Cliente:</span>
                <span>{dte.nombre_receptor}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={labelStyle}>NIT:</span>
                <span>{dte.id_receptor}</span>
              </div>
            </td>
            <td style={{ padding: "9px 20px", width: "45%", verticalAlign: "top" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                <span style={labelStyle}>Atendió:</span>
                <span>{data.usuario_nombre || "—"}</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={labelStyle}>Cod. Anticipo:</span>
                <span>{data.codigo}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #000" }}>
            <th
              style={{
                ...thStyle,
                padding: "7px 20px",
                textAlign: "left",
                width: "60px",
              }}
            >
              Cant
            </th>
            <th style={{ ...thStyle, textAlign: "left" }}>Descripción</th>
            <th style={{ ...thStyle, textAlign: "right", width: "110px" }}>
              P. Unit./IVA
            </th>
            <th
              style={{
                ...thStyle,
                padding: "7px 20px 7px 8px",
                textAlign: "right",
                width: "90px",
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {dte.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e5e5e5" }}>
              <td style={{ padding: "5px 20px" }}>
                {item.cantidad} {item.medida}
              </td>
              <td style={{ padding: "5px 8px" }}>{item.descripcion}</td>
              <td style={{ padding: "5px 8px", textAlign: "right" }}>
                Q{formatMoney(item.precio_unitario)}
              </td>
              <td
                style={{
                  padding: "5px 20px 5px 8px",
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                Q{formatMoney(item.subtotal)}
              </td>
            </tr>
          ))}
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
            <td style={{ padding: "12px 20px", verticalAlign: "top" }}>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "2px",
                  color: "#555",
                }}
              >
                Número de Autorización:
              </div>
              <div
                style={{
                  fontSize: "8px",
                  wordBreak: "break-all",
                  color: "#222",
                }}
              >
                {dte.uuid}
              </div>
              <div style={{ fontSize: "8px", marginTop: "4px", color: "#777" }}>
                INFILE, S.A. / NIT: 1252133-7
              </div>
              <div
                style={{
                  fontSize: "8px",
                  marginTop: "6px",
                  color: "#222",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Mercadería pendiente de despacho — saldo a favor del cliente
              </div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "12px",
                  textAlign: "center",
                  marginTop: "10px",
                  letterSpacing: "0.06em",
                }}
              >
                ¡GRACIAS POR SU COMPRA!
              </div>
            </td>
            <td
              style={{
                padding: "12px 16px",
                verticalAlign: "top",
                width: "185px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ paddingBottom: "3px", color: "#555" }}>
                      Base Gravable:
                    </td>
                    <td style={{ paddingBottom: "3px", textAlign: "right" }}>
                      Q{formatMoney(gravable)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingBottom: "3px", color: "#555" }}>
                      IVA (12%):
                    </td>
                    <td style={{ paddingBottom: "3px", textAlign: "right" }}>
                      Q{formatMoney(iva)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1px solid #000" }}>
                    <td
                      style={{
                        paddingTop: "5px",
                        fontWeight: 900,
                        fontSize: "13px",
                      }}
                    >
                      TOTAL:
                    </td>
                    <td
                      style={{
                        paddingTop: "5px",
                        fontWeight: 900,
                        fontSize: "15px",
                        textAlign: "right",
                      }}
                    >
                      Q{formatMoney(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td
              style={{
                padding: "12px 14px",
                verticalAlign: "top",
                textAlign: "center",
                width: "110px",
              }}
            >
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR SAT"
                  style={{
                    width: "90px",
                    height: "90px",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    margin: "0 auto",
                    background: "#f4f4f5",
                  }}
                />
              )}
              <div style={{ fontSize: "7px", color: "#888", marginTop: "3px" }}>
                Verificar en SAT
              </div>
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
  const tieneFactura = !!data.dte;
  const [tab, setTab] = useState<"recibo" | "factura">(
    tieneFactura ? "factura" : "recibo",
  );

  const enFactura = tieneFactura && tab === "factura";
  const reducedMotion = useReducedMotion();

  const tabBtn = (activo: boolean) =>
    cn(
      "relative -mb-px flex items-center gap-2 rounded-t-lg border px-4 py-2 text-sm font-bold transition-colors cursor-pointer",
      activo
        ? "border-zinc-200 border-b-zinc-100 bg-zinc-100 text-foreground dark:border-zinc-700 dark:border-b-zinc-900 dark:bg-zinc-900"
        : "border-transparent bg-zinc-300/70 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700/80 dark:text-zinc-300 dark:hover:bg-zinc-700",
    );

  return (
    <ReciboPrintFrame
      title={
        enFactura
          ? "Factura electrónica"
          : esIngreso
            ? "Recibo de anticipo"
            : "Recibo de aplicación"
      }
      printContainerId={
        enFactura ? "print-container-factura-preventa" : "print-container-preventa"
      }
      printTitle={
        nombrePdfPreventa(data, enFactura ? "factura" : "recibo")
      }
      onClose={onClose}
      headerExtra={
        tieneFactura ? (
          <div className="flex items-end gap-1 px-3">
            <button
              type="button"
              onClick={() => setTab("factura")}
              className={tabBtn(tab === "factura")}
            >
              <FileCheck2 className="size-4" /> Factura Electrónica
            </button>
            <button
              type="button"
              onClick={() => setTab("recibo")}
              className={tabBtn(tab === "recibo")}
            >
              <Receipt className="size-4" /> Recibo
            </button>
          </div>
        ) : null
      }
    >
      {tieneFactura ? (
        <div className="grid overflow-hidden">
          <motion.div
            id="print-container-factura-preventa"
            style={printDocStyle}
            className={cn(
              "col-start-1 row-start-1",
              enFactura ? "z-10" : "pointer-events-none z-0",
            )}
            initial={false}
            animate={{
              opacity: enFactura ? 1 : 0,
              x: reducedMotion ? 0 : enFactura ? 0 : -10,
            }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: tabEase }}
            aria-hidden={!enFactura}
          >
            <FacturaPreventaTicket data={data} />
          </motion.div>
          <motion.div
            id="print-container-preventa"
            style={printDocStyle}
            className={cn(
              "col-start-1 row-start-1",
              enFactura ? "pointer-events-none z-0" : "z-10",
            )}
            initial={false}
            animate={{
              opacity: enFactura ? 0 : 1,
              x: reducedMotion ? 0 : enFactura ? 10 : 0,
            }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: tabEase }}
            aria-hidden={enFactura}
          >
            <ReciboPreventaTicket data={data} />
          </motion.div>
        </div>
      ) : (
        <div id="print-container-preventa" style={printDocStyle}>
          <ReciboPreventaTicket data={data} />
        </div>
      )}
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
