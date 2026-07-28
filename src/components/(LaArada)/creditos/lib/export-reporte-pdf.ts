import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReporteCreditoRow = {
  fecha: string;
  venta: string;
  comprobante: string;
  deuda: string;
  abonos: string;
  saldo: string;
};

export type ReporteCreditoTotales = {
  deuda: string;
  abonos: string;
  saldo: string;
};

const LA_ARADA_LOGO = "/logos/LaArada.png";
const LA_ARADA_ORANGE: [number, number, number] = [234, 88, 12];
const LA_ARADA_ORANGE_LIGHT: [number, number, number] = [255, 247, 237];
const LA_ARADA_ORANGE_BORDER: [number, number, number] = [254, 215, 170];
const LA_ARADA_SLOGAN = "Construyendo Junto a ti el futuro.";
const MUTED: [number, number, number] = [113, 113, 122];
const INK: [number, number, number] = [24, 24, 27];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function buildReporteFilename(clienteNombre: string) {
  const slug = clienteNombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const fecha = new Date()
    .toLocaleDateString("es-GT", { timeZone: "America/Guatemala" })
    .replace(/\//g, "-");
  return `reporte-${slug || "cliente"}-${fecha}.pdf`;
}

function formatFechaReporte(date = new Date()) {
  const guatemala = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const dia = DIAS_SEMANA[guatemala.getDay()];
  const numero = guatemala.getDate();
  const mes = MESES_CORTOS[guatemala.getMonth()];
  const anio = String(guatemala.getFullYear()).slice(-2);
  return `${dia} ${numero}/${mes}/${anio}`;
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
  doc.text("Cuenta por cobrar", right, 25, { align: "right" });

  doc.setDrawColor(...LA_ARADA_ORANGE);
  doc.setLineWidth(0.35);
  doc.line(margin, 31, right, 31);
}

function drawDocumentMeta(
  doc: jsPDF,
  clienteNombre: string,
  clienteNit: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageWidth - margin;
  const cardY = 38;
  const cardH = 18;
  const cardW = pageWidth - margin * 2;

  doc.setFillColor(...LA_ARADA_ORANGE_LIGHT);
  doc.setDrawColor(...LA_ARADA_ORANGE_BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, cardY, cardW, cardH, 2.5, 2.5, "FD");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...LA_ARADA_ORANGE);
  doc.text("CLIENTE", margin + 4, cardY + 5.5);
  doc.text("NIT", right - 4, cardY + 5.5, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  const clienteLineas = doc.splitTextToSize(clienteNombre, cardW * 0.62);
  doc.text(clienteLineas[0] ?? clienteNombre, margin + 4, cardY + 12);

  doc.setFontSize(10);
  doc.text(clienteNit, right - 4, cardY + 12, { align: "right" });

  return cardY + cardH + 5;
}

function getTableColumnStyles(pageWidth: number) {
  const tableWidth = pageWidth - 28;
  return {
    0: { cellWidth: tableWidth * 0.13 },
    1: { cellWidth: tableWidth * 0.1 },
    2: { cellWidth: tableWidth * 0.36 },
    3: { halign: "right" as const, cellWidth: tableWidth * 0.135 },
    4: { halign: "right" as const, cellWidth: tableWidth * 0.135 },
    5: { halign: "right" as const, cellWidth: tableWidth * 0.14 },
  };
}

export async function exportReportePdf(
  clienteNombre: string,
  clienteNit: string,
  rows: ReporteCreditoRow[],
  totales: ReporteCreditoTotales,
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
  const tableStartY = drawDocumentMeta(doc, clienteNombre, clienteNit);

  const borderColor: [number, number, number] = [228, 228, 231];
  const felText: [number, number, number] = [2, 132, 199];
  const reciboText: [number, number, number] = [180, 83, 9];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14 },
    theme: "grid",
    head: [["Fecha", "Venta", "Comprobante", "Deuda", "Abonado", "Saldo"]],
    body: rows.map((row) => [
      row.fecha,
      row.venta,
      row.comprobante,
      row.deuda,
      row.abonos,
      row.saldo,
    ]),
    foot: [["Totales", "", "", totales.deuda, totales.abonos, totales.saldo]],
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
      textColor: [113, 113, 122],
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

      if (data.section === "body" && data.column.index === 1) {
        data.cell.styles.textColor = LA_ARADA_ORANGE;
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 2) {
        const label = String(data.cell.raw ?? "");
        if (label.startsWith("FEL:")) {
          data.cell.styles.textColor = felText;
          data.cell.styles.fontStyle = "bold";
        } else if (label.startsWith("Recibo:")) {
          data.cell.styles.textColor = reciboText;
          data.cell.styles.fontStyle = "bold";
        }
      }

      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.textColor = [5, 150, 105];
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "body" && data.column.index === 5) {
        data.cell.styles.textColor = [239, 68, 68];
        data.cell.styles.fontStyle = "bold";
      }

      if (data.section === "foot" && data.column.index === 4) {
        data.cell.styles.textColor = [5, 150, 105];
      }

      if (data.section === "foot" && data.column.index === 5) {
        data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  const pdfBlob = doc.output("blob");
  downloadPdfBlob(pdfBlob, buildReporteFilename(clienteNombre));
}
