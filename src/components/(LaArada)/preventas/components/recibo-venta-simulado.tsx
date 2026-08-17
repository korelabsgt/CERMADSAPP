"use client";

import { getEmisorConfig } from "@/lib/infile";
import { formatMoney } from "../lib/ui";
import { ReciboPrintFrame } from "./recibo-preventa-print";

export interface ReciboVentaSimuladoData {
  codigo: string;
  cliente_nombre: string;
  cliente_nit: string;
  monto: number;
  usuario_nombre?: string;
  fecha: string;
}

export default function ReciboVentaSimulado({
  data,
  onClose,
}: {
  data: ReciboVentaSimuladoData;
  onClose: () => void;
}) {
  const emisor = getEmisorConfig();
  const fechaObj = new Date(data.fecha);
  const fechaTxt = Number.isNaN(fechaObj.getTime())
    ? data.fecha
    : `${fechaObj.toLocaleDateString("es-GT")}, ${fechaObj.toLocaleTimeString("es-GT")}`;

  return (
    <ReciboPrintFrame
      title="Recibo de venta"
      printContainerId="print-container-venta-simulado"
      printTitle="Recibo_Venta"
      onClose={onClose}
    >
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
                RECIBO DE VENTA
              </div>
              <div style={{ fontSize: "11px", marginTop: "8px" }}>
                <strong>Cod. Venta:</strong> {data.codigo}
              </div>
              <div style={{ fontSize: "10px", marginTop: "3px" }}>
                <strong>Fecha:</strong> {fechaTxt}
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
              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>
                  Vendedor:
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
                width: "60px",
              }}
            >
              Cant
            </th>
            <th
              style={{
                padding: "7px 8px",
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
                padding: "7px 8px",
                textAlign: "right",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                width: "110px",
              }}
            >
              P. Unitario
            </th>
            <th
              style={{
                padding: "7px 20px 7px 8px",
                textAlign: "right",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                width: "90px",
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e5e5e5" }}>
            <td style={{ padding: "5px 20px" }}>1</td>
            <td style={{ padding: "5px 8px" }}>Aplicación de preventa (ejemplo)</td>
            <td style={{ padding: "5px 8px", textAlign: "right" }}>
              Q{formatMoney(data.monto)}
            </td>
            <td
              style={{
                padding: "5px 20px 5px 8px",
                textAlign: "right",
                fontWeight: 700,
              }}
            >
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
                ¡Gracias por su compra!
              </div>
            </td>
            <td style={{ padding: "12px 20px", verticalAlign: "middle", width: "250px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "16px" }}>
                      TOTAL:
                    </td>
                    <td
                      style={{
                        paddingTop: "5px",
                        fontWeight: 900,
                        fontSize: "20px",
                        textAlign: "right",
                      }}
                    >
                      Q{formatMoney(data.monto)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </ReciboPrintFrame>
  );
}
