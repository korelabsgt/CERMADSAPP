import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type MovimientoPreventaRow = {
  recibo: string;
  fecha: string;
  tipo: string;
  codVenta: string;
  monto: string;
  disponible: string;
};

export type MovimientoPreventaTotales = {
  monto: string;
  disponible: string;
};

const LA_ARADA_LOGO = "/logos/LaArada.png";
const LA_ARADA_ORANGE: [number, number, number] = [234, 88, 12];
const LA_ARADA_ORANGE_LIGHT: [number, number, number] = [255, 247, 237];
const LA_ARADA_ORANGE_BORDER: [number, number, number] = [254, 215, 170];
const LA_ARADA_SLOGAN = "Construyendo Junto a ti el futuro.";
const MUTED: [number, number, number] = [113, 113, 122];
const INK: [number, number, number] = [24, 24, 27];
const SKY: [number, number, number] = [2, 132, 199];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function buildFilename(clienteNombre: string) {
  const slug = clienteNombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const fecha = new Date()
    .toLocaleDateString("es-GT", { timeZone: "America/Guatemala" })
    .replace(/\//g, "-");
  return `movimientos-preventa-${slug || "cliente"}-${fecha}.pdf`;
}

function formatFechaReporte(date = new Date()) {
  const guatemala = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const dia = DIAS_SEMANA[guatemala.getDay()];
  const numero = String(guatemala.getDate()).padStart(2, "0");
  const mes = String(guatemala.getMonth() + 1).padStart(2, "0");
  const anio = String(guatemala.getFullYear()).slice(-2);
  return `${dia} ${numero}/${mes}/${anio}`;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareOrDownloadPdf(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (isMobileDevice() && typeof navigator.share === "function") {
    const canShareFile =
      typeof navigator.canShare !== "function" ||
      navigator.canShare({ files: [file] });

    if (canShareFile) {
      try {
        await navigator.share({ files: [file] });
        return "shared" as const;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }
      }
    }
  }

  downloadPdfBlob(blob, filename);
  return "downloaded" as const;
}

let logoPdfCache: string | null = null;

function removeDarkBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 40 && g < 40 && b < 40) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

async function loadLogoForPdf(maxPx = 144) {
  if (logoPdfCache) return logoPdfCache;

  const response = await fetch(LA_ARADA_LOGO);
  if (!response.ok) throw new Error("No se pudo cargar el logo de La Arada.");

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(maxPx / bitmap.width, maxPx / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar el logo.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  removeDarkBackground(ctx, width, height);
  bitmap.close();

  logoPdfCache = canvas.toDataURL("image/png");
  return logoPdfCache;
}

function drawBrandHeader(doc: jsPDF, logoDataUrl: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageWidth - margin;

  doc.addImage(logoDataUrl, "PNG", margin, 10, 18, 18);

  doc.setTextColor(...LA_ARADA_ORANGE);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("La Arada", 36, 17);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(LA_ARADA_SLOGAN, 36, 23);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...MUTED);
  doc.text("GENERADO", right, 12, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...LA_ARADA_ORANGE);
  doc.text(formatFechaReporte(), right, 18, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text("Movimientos preventa", right, 25, { align: "right" });

  doc.setDrawColor(...LA_ARADA_ORANGE);
  doc.setLineWidth(0.35);
  doc.line(margin, 31, right, 31);
}

function drawDocumentMeta(
  doc: jsPDF,
  clienteNombre: string,
  clienteNit: string,
  saldoDisponible: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageWidth - margin;
  const cardY = 38;
  const cardH = 24;
  const cardW = pageWidth - margin * 2;

  doc.setFillColor(...LA_ARADA_ORANGE_LIGHT);
  doc.setDrawColor(...LA_ARADA_ORANGE_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, cardY, cardW, cardH, 2.5, 2.5, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LA_ARADA_ORANGE);
  doc.text("CLIENTE", margin + 4, cardY + 5.5);
  doc.text("NIT", margin + 4, cardY + 14.5);
  doc.text("SALDO DISPONIBLE", right - 4, cardY + 5.5, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  const clienteLineas = doc.splitTextToSize(clienteNombre, cardW * 0.62);
  doc.text(clienteLineas[0] ?? clienteNombre, margin + 4, cardY + 11);

  doc.setFontSize(10);
  doc.text(clienteNit, margin + 4, cardY + 20);

  doc.setFontSize(12);
  doc.setTextColor(...SKY);
  doc.text(saldoDisponible, right - 4, cardY + 14.5, { align: "right" });

  return cardY + cardH + 5;
}

function getTableColumnStyles(pageWidth: number) {
  const tableWidth = pageWidth - 28;
  return {
    0: { cellWidth: tableWidth * 0.14, fontStyle: "bold" as const },
    1: { cellWidth: tableWidth * 0.18, fontStyle: "bold" as const },
    2: { cellWidth: tableWidth * 0.11 },
    3: { cellWidth: tableWidth * 0.12, fontStyle: "bold" as const },
    4: {
      halign: "right" as const,
      cellWidth: tableWidth * 0.17,
      fontStyle: "bold" as const,
    },
    5: {
      halign: "right" as const,
      cellWidth: tableWidth * 0.18,
      fontStyle: "bold" as const,
    },
  };
}

export async function exportMovimientosPreventaPdf(
  clienteNombre: string,
  clienteNit: string,
  saldoDisponible: string,
  rows: MovimientoPreventaRow[],
  totales: MovimientoPreventaTotales,
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "legal",
    compress: true,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoDataUrl = await loadLogoForPdf();

  drawBrandHeader(doc, logoDataUrl);
  const tableStartY = drawDocumentMeta(
    doc,
    clienteNombre,
    clienteNit,
    saldoDisponible,
  );

  const borderColor: [number, number, number] = [228, 228, 231];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14 },
    theme: "grid",
    head: [
      [
        "Recibo / Comprobante",
        "Fecha",
        "Tipo / Comprobante",
        "Cod. Venta",
        "Monto",
        "Monto disponible",
      ],
    ],
    body: rows.map((row) => [
      row.recibo,
      row.fecha,
      row.tipo,
      row.codVenta,
      row.monto,
      row.disponible,
    ]),
    foot: [["Totales", "", "", "", totales.monto, totales.disponible]],
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      fillColor: [255, 255, 255],
      textColor: INK,
      lineWidth: 0.25,
      lineColor: borderColor,
    },
    headStyles: {
      fillColor: [250, 250, 250],
      textColor: MUTED,
      fontStyle: "bold",
      lineWidth: 0.25,
      lineColor: borderColor,
    },
    footStyles: {
      fillColor: [250, 250, 250],
      textColor: INK,
      fontStyle: "bold",
      lineWidth: 0.25,
      lineColor: borderColor,
    },
    columnStyles: getTableColumnStyles(pageWidth),
    didParseCell(data) {
      data.cell.styles.lineWidth = 0.25;
      data.cell.styles.lineColor = borderColor;

      if (data.section === "body" && data.column.index === 0) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 3) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 5) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "foot" && data.column.index === 4) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "foot" && data.column.index === 5) {
        data.cell.styles.textColor = INK;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  const pdfBlob = doc.output("blob");
  return shareOrDownloadPdf(pdfBlob, buildFilename(clienteNombre));
}
