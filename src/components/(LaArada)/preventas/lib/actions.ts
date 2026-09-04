"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedCajero } from "@/utils/require-authenticated-cajero";
import {
  anularDTE,
  buildXMLAnulacion,
  buildXMLFactura,
  certificarDTE,
  getEmisorConfig,
} from "@/lib/infile";
import type { ItemDTE } from "@/types/infile";
import {
  PreventaSchema,
  ActualizarComprobantePreventaSchema,
  AnularFacturaPreventaSchema,
  AnularFacturaPreventaValues,
  CertificarPreventaSchema,
  EditarCargaPreventaSchema,
  EliminarMovimientoPreventaSchema,
  EliminarPreventaClienteSchema,
  EliminarPreventaClienteValues,
  PreventaFormValues,
  AplicarPreventaSchema,
  AplicarPreventaValues,
  DevolverPreventaPorVentaSchema,
  DevolverPreventaPorVentaValues,
  ActualizarComprobantePreventaValues,
  CertificarPreventaValues,
  EditarCargaPreventaValues,
  EliminarMovimientoPreventaValues,
  ClientePreventa,
  ClienteLista,
  PreventaMovimiento,
  PreventaDte,
  PreventaDteItem,
  PreventaDetalleValues,
  ProductoPreventa,
  ReciboPreventa,
  codigoCorto,
  isConsumidorFinalNit,
  plazoAnulacionInmediata,
  slugCliente,
  toFelFechaGT,
  totalDetallesPreventa,
  ventaEstaAnulada,
} from "./zod";
import { mensajePlazoAnulacionCf } from "@/lib/fel-anulacion";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const BUCKET_COMPROBANTES = "ventas-comprobantes";

async function getUserRole(supabase: Supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return (metadata.rol || user.role || "user") as string;
}

function isSuperOrAdmin(role: string | null) {
  return role === "super" || role === "admin";
}

function estadoVentaJoin(raw: unknown): string | null {
  if (!raw) return null;
  const venta = Array.isArray(raw) ? raw[0] : raw;
  if (!venta || typeof venta !== "object") return null;
  const estado = (venta as { estado?: string | null }).estado;
  return estado ?? null;
}

function movimientoAfectaSaldo(
  tipo: string,
  ventaEstado?: string | null,
): boolean {
  if (tipo === "ingreso") return true;
  return !ventaEstaAnulada(ventaEstado);
}

async function computeSaldo(
  supabase: Supabase,
  clienteId: string,
): Promise<number> {
  const { data: movimientos } = await supabase
    .from("ven_preventa_movimientos")
    .select("tipo, monto, ven_ventas (estado)")
    .eq("cliente_id", clienteId);

  return (movimientos ?? []).reduce((acc: number, mov) => {
    const extra = mov as unknown as { ven_ventas?: unknown };
    if (!movimientoAfectaSaldo(mov.tipo, estadoVentaJoin(extra.ven_ventas))) {
      return acc;
    }
    const monto = Number(mov.monto || 0);
    return mov.tipo === "ingreso" ? acc + monto : acc - monto;
  }, 0);
}

async function recalcularSaldosResultantes(
  supabase: Supabase,
  clienteId: string,
) {
  const { data: movs, error } = await supabase
    .from("ven_preventa_movimientos")
    .select("id, tipo, monto, ven_ventas (estado)")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  let saldo = 0;
  for (const mov of movs ?? []) {
    const extra = mov as unknown as { ven_ventas?: unknown };
    const m = Number(mov.monto || 0);
    if (movimientoAfectaSaldo(mov.tipo, estadoVentaJoin(extra.ven_ventas))) {
      saldo = mov.tipo === "ingreso" ? saldo + m : saldo - m;
    }
    const { error: updErr } = await supabase
      .from("ven_preventa_movimientos")
      .update({ saldo_resultante: saldo })
      .eq("id", mov.id);
    if (updErr) throw new Error(updErr.message);
  }
}

const DTE_COLUMNS =
  "dte_uuid, dte_serie, dte_numero, dte_estado, dte_fecha_emision, dte_fecha_certificacion, dte_id_receptor, dte_nombre_receptor, dte_correo_receptor, dte_items";

type PreventaDteRow = {
  dte_uuid?: string | null;
  dte_serie?: string | null;
  dte_numero?: string | null;
  dte_estado?: string | null;
  dte_fecha_emision?: string | null;
  dte_fecha_certificacion?: string | null;
  dte_id_receptor?: string | null;
  dte_nombre_receptor?: string | null;
  dte_correo_receptor?: string | null;
  dte_items?: PreventaDteItem[] | null;
};

function mapPreventaDte(row?: PreventaDteRow | null): PreventaDte | null {
  if (!row?.dte_uuid) return null;
  const items = Array.isArray(row.dte_items) ? row.dte_items : [];
  return {
    uuid: row.dte_uuid,
    serie: row.dte_serie ?? "",
    numero: row.dte_numero ?? "",
    estado: row.dte_estado ?? "certificado",
    fecha_emision: row.dte_fecha_emision ?? row.dte_fecha_certificacion ?? null,
    fecha_certificacion: row.dte_fecha_certificacion ?? "",
    id_receptor: row.dte_id_receptor ?? "CF",
    nombre_receptor: row.dte_nombre_receptor ?? "CONSUMIDOR FINAL",
    correo_receptor: row.dte_correo_receptor ?? null,
    items,
    total: items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0),
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function preventaCertificada(row?: {
  dte_uuid?: string | null;
  dte_estado?: string | null;
} | null): boolean {
  return Boolean(row?.dte_uuid) && row?.dte_estado === "certificado";
}

function fechaEmisionGT(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds(),
  )}-06:00`;
}

function buildItemsDTE(detalles: PreventaDetalleValues[]): ItemDTE[] {
  return detalles.map((detalle, index) => {
    const total = Number(detalle.subtotal || 0);
    const gravable = Number((total / 1.12).toFixed(2));
    const iva = Number((total - gravable).toFixed(2));
    return {
      numeroLinea: index + 1,
      bienOServicio: "B",
      cantidad: detalle.cantidad,
      unidadMedida: detalle.medida?.trim() || "UNI",
      descripcion: detalle.nombre_producto,
      precioUnitario: detalle.precio_unitario,
      precio: total,
      descuento: 0,
      impuestos: [
        {
          nombreCorto: "IVA",
          codigoUnidadGravable: 1,
          montoGravable: gravable,
          montoImpuesto: iva,
        },
      ],
      total,
    };
  });
}

function mensajeErroresInfile(errores?: { mensaje_error?: string }[]): string {
  const texto = (errores ?? [])
    .map((e) => e.mensaje_error ?? "")
    .filter(Boolean)
    .map((msg) => {
      const partes = msg.split("|");
      return (partes[partes.length - 1] ?? msg)
        .trim()
        .replace(/^Error\s*-\s*/i, "");
    })
    .join(" · ");
  return texto || "La factura fue rechazada por SAT/INFILE.";
}

async function certificarFacturaPreventa(params: {
  detalles: PreventaDetalleValues[];
  granTotal: number;
  idReceptor: string;
  nombreReceptor: string;
  correoReceptor?: string;
}): Promise<{ error: string } | { dte: PreventaDte; fechaEmision: string }> {
  const { detalles, granTotal, idReceptor, nombreReceptor } = params;
  const correo = params.correoReceptor?.trim();
  const gravable = Number((granTotal / 1.12).toFixed(2));
  const montoIVA = Number((granTotal - gravable).toFixed(2));
  const fechaEmision = fechaEmisionGT();

  const xml = buildXMLFactura({
    tipo: "FACT",
    codigoMoneda: "GTQ",
    fechaHoraEmision: fechaEmision,
    emisor: getEmisorConfig(),
    receptor: {
      idReceptor,
      nombreReceptor,
      ...(correo ? { correoReceptor: correo } : {}),
      direccion: {
        direccion: "CIUDAD",
        codigoPostal: "01010",
        municipio: "GUATEMALA",
        departamento: "GUATEMALA",
        pais: "GT",
      },
    },
    fraseTipo: 1,
    fraseEscenario: 1,
    items: buildItemsDTE(detalles),
    totales: { totalIVA: montoIVA, granTotal },
  });

  let respuesta;
  try {
    respuesta = await certificarDTE(xml);
  } catch {
    return { error: "No se pudo conectar con INFILE para certificar." };
  }

  if (!respuesta.resultado || !respuesta.uuid) {
    return { error: mensajeErroresInfile(respuesta.descripcion_errores) };
  }

  const items: PreventaDteItem[] = detalles.map((detalle) => ({
    descripcion: detalle.nombre_producto,
    medida: detalle.medida?.trim() || "UNI",
    cantidad: detalle.cantidad,
    precio_unitario: detalle.precio_unitario,
    subtotal: detalle.subtotal,
  }));

  return {
    fechaEmision,
    dte: {
      uuid: respuesta.uuid,
      serie: respuesta.serie ?? "",
      numero: respuesta.numero ?? "",
      estado: "certificado",
      fecha_certificacion: respuesta.fecha ?? new Date().toISOString(),
      id_receptor: idReceptor,
      nombre_receptor: nombreReceptor,
      correo_receptor: correo || null,
      items,
      total: granTotal,
    },
  };
}

async function guardarDtePreventa(
  supabase: Supabase,
  preventaId: string,
  dte: PreventaDte,
  fechaEmision: string,
) {
  return supabase
    .from("ven_preventas")
    .update({
      dte_uuid: dte.uuid,
      dte_serie: dte.serie,
      dte_numero: dte.numero,
      dte_estado: dte.estado,
      dte_fecha_emision: fechaEmision,
      dte_fecha_certificacion: dte.fecha_certificacion,
      dte_id_receptor: dte.id_receptor,
      dte_nombre_receptor: dte.nombre_receptor,
      dte_correo_receptor: dte.correo_receptor,
      dte_items: dte.items,
    })
    .eq("id", preventaId);
}

export async function getProductosPreventa(): Promise<ProductoPreventa[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inv_productos")
    .select("id, nombre, codigo, precio_base, stock_actual, medida, activo")
    .order("nombre");
  return (data as ProductoPreventa[]) || [];
}

export async function getClientesLista(): Promise<ClienteLista[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ven_clientes")
    .select("id, nombre, nit, telefono")
    .order("nombre");
  return (data as ClienteLista[]) || [];
}

export async function getResumenPreventas(): Promise<ClientePreventa[]> {
  const supabase = await createClient();

  const { data: movimientos, error } = await supabase
    .from("ven_preventa_movimientos")
    .select(
      "cliente_id, tipo, monto, ven_ventas (estado), ven_clientes (nombre, nit, telefono)",
    );

  if (error) throw new Error(error.message);

  const map = new Map<string, ClientePreventa>();

  for (const mov of movimientos ?? []) {
    const clienteId = mov.cliente_id as string;
    const cliente = (
      mov as unknown as {
        ven_clientes?: {
          nombre?: string;
          nit?: string;
          telefono?: string;
        } | null;
      }
    ).ven_clientes;

    if (!map.has(clienteId)) {
      map.set(clienteId, {
        cliente_id: clienteId,
        nombre: cliente?.nombre || "Desconocido",
        nit: cliente?.nit || "C/F",
        telefono: cliente?.telefono || "N/A",
        saldo: 0,
        cantidadMovimientos: 0,
      });
    }

    const entry = map.get(clienteId)!;
    const extra = mov as unknown as { ven_ventas?: unknown };
    const monto = Number(mov.monto || 0);
    if (movimientoAfectaSaldo(mov.tipo, estadoVentaJoin(extra.ven_ventas))) {
      entry.saldo += mov.tipo === "ingreso" ? monto : -monto;
    }
    entry.cantidadMovimientos += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.saldo - a.saldo);
}

export async function getSaldoCliente(clienteId: string): Promise<number> {
  if (!clienteId) return 0;
  const supabase = await createClient();
  return computeSaldo(supabase, clienteId);
}

export async function getClientePreventaBySlug(
  slug: string,
): Promise<ClientePreventa | null> {
  const supabase = await createClient();
  const { data: clientes, error } = await supabase
    .from("ven_clientes")
    .select("id, nombre, nit, telefono");

  if (error) throw new Error(error.message);

  const cliente = (clientes ?? []).find((c) => slugCliente(c.nombre) === slug);
  if (!cliente) return null;

  const saldo = await computeSaldo(supabase, cliente.id);
  const { count } = await supabase
    .from("ven_preventa_movimientos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", cliente.id);

  return {
    cliente_id: cliente.id,
    nombre: cliente.nombre,
    nit: cliente.nit,
    telefono: cliente.telefono || "N/A",
    saldo,
    cantidadMovimientos: count ?? 0,
  };
}

export async function getMovimientosCliente(
  clienteId: string,
): Promise<PreventaMovimiento[]> {
  if (!clienteId) return [];
  const supabase = await createClient();

  const { data: movimientos, error } = await supabase
    .from("ven_preventa_movimientos")
    .select(
      `
      id, cliente_id, tipo, monto, saldo_resultante, metodo_pago,
      preventa_id, venta_id, usuario_id, created_at,
      ven_ventas (numero_recibo, estado)
    `,
    )
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = movimientos ?? [];

  const usuarioIds = Array.from(
    new Set(rows.map((m) => m.usuario_id).filter(Boolean)),
  ) as string[];

  const preventaIds = Array.from(
    new Set(rows.map((m) => m.preventa_id).filter(Boolean)),
  ) as string[];

  const profileMap = new Map<string, string>();
  if (usuarioIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", usuarioIds);
    (profiles ?? []).forEach((p) => profileMap.set(p.id, p.nombre));
  }

  const preventaMap = new Map<
    string,
    {
      fecha_emision: string | null;
      img_comprobante_url: string | null;
      dte: PreventaDte | null;
    }
  >();
  if (preventaIds.length > 0) {
    const { data: preventas } = await supabase
      .from("ven_preventas")
      .select(`id, fecha_emision, img_comprobante_url, ${DTE_COLUMNS}`)
      .in("id", preventaIds);
    ((preventas ?? []) as unknown as (PreventaDteRow & {
      id: string;
      fecha_emision: string | null;
      img_comprobante_url: string | null;
    })[]).forEach((p) =>
      preventaMap.set(p.id, {
        fecha_emision: p.fecha_emision ?? null,
        img_comprobante_url: p.img_comprobante_url ?? null,
        dte: mapPreventaDte(p),
      }),
    );
  }

  let saldo = 0;
  return rows.map((mov) => {
    const extra = mov as unknown as {
      ven_ventas?:
        | { numero_recibo?: number | null; estado?: string | null }
        | { numero_recibo?: number | null; estado?: string | null }[]
        | null;
    };
    const ventaRaw = extra.ven_ventas;
    const venta = Array.isArray(ventaRaw)
      ? (ventaRaw[0] ?? null)
      : (ventaRaw ?? null);
    const preventa = mov.preventa_id
      ? preventaMap.get(mov.preventa_id)
      : undefined;
    const ventaEstado = venta?.estado ?? null;
    const monto = Number(mov.monto || 0);
    if (movimientoAfectaSaldo(mov.tipo, ventaEstado)) {
      saldo = mov.tipo === "ingreso" ? saldo + monto : saldo - monto;
    }

    return {
      id: mov.id,
      cliente_id: mov.cliente_id,
      tipo: mov.tipo,
      monto,
      saldo_resultante: saldo,
      metodo_pago: mov.metodo_pago,
      preventa_id: mov.preventa_id,
      venta_id: mov.venta_id,
      usuario_id: mov.usuario_id,
      usuario_nombre: mov.usuario_id
        ? profileMap.get(mov.usuario_id) || "Desconocido"
        : "Desconocido",
      numero_comprobante: codigoCorto(mov.preventa_id || mov.id) || null,
      fecha_emision: preventa?.fecha_emision ?? null,
      img_comprobante_url: preventa?.img_comprobante_url ?? null,
      created_at: mov.created_at,
      venta_numero: venta?.numero_recibo ?? null,
      venta_estado: ventaEstado,
      dte: preventa?.dte ?? null,
    } satisfies PreventaMovimiento;
  });
}

export async function crearPreventa(
  data: PreventaFormValues,
): Promise<{ error: string } | { success: true; recibo: ReciboPreventa }> {
  const result = PreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const {
    cliente_id,
    monto,
    fecha_emision,
    metodo_pago,
    img_comprobante_url,
    facturar,
    receptor_cf,
    nit_receptor,
    nombre_receptor,
    correo_receptor,
    detalles,
  } = result.data;

  const imgComprobante =
    metodo_pago === "Transferencia" || metodo_pago === "Depósito"
      ? img_comprobante_url || null
      : null;

  const { data: cliente, error: errCliente } = await supabase
    .from("ven_clientes")
    .select("nombre, nit")
    .eq("id", cliente_id)
    .maybeSingle();

  if (errCliente || !cliente) return { error: "Cliente no encontrado" };

  const { data: preventa, error: errPreventa } = await supabase
    .from("ven_preventas")
    .insert({
      cliente_id,
      monto,
      fecha_emision,
      metodo_pago,
      img_comprobante_url: imgComprobante,
      usuario_id: cajero.userId,
    })
    .select("id")
    .single();

  if (errPreventa || !preventa) {
    return { error: errPreventa?.message || "Error al registrar la preventa" };
  }

  const saldoActual = await computeSaldo(supabase, cliente_id);
  const saldoResultante = saldoActual + monto;

  const { error: errMov } = await supabase
    .from("ven_preventa_movimientos")
    .insert({
      cliente_id,
      tipo: "ingreso",
      monto,
      saldo_resultante: saldoResultante,
      metodo_pago,
      preventa_id: preventa.id,
      usuario_id: cajero.userId,
    });

  if (errMov) {
    await supabase.from("ven_preventas").delete().eq("id", preventa.id);
    return { error: "Error al registrar el movimiento de preventa" };
  }

  let dte: PreventaDte | null = null;

  if (facturar) {
    const idReceptor = receptor_cf
      ? "CF"
      : (nit_receptor ?? "").trim().toUpperCase();
    const nombreReceptor = receptor_cf
      ? "CONSUMIDOR FINAL"
      : (nombre_receptor ?? "").trim();

    const certificacion = await certificarFacturaPreventa({
      detalles,
      granTotal: totalDetallesPreventa(detalles),
      idReceptor,
      nombreReceptor,
      correoReceptor: correo_receptor ?? undefined,
    });

    if ("error" in certificacion) {
      await supabase.from("ven_preventas").delete().eq("id", preventa.id);
      return { error: certificacion.error };
    }

    dte = certificacion.dte;

    const { error: errDte } = await guardarDtePreventa(
      supabase,
      preventa.id,
      dte,
      certificacion.fechaEmision,
    );

    if (errDte) {
      return {
        error:
          "La factura se certificó ante la SAT pero no se pudo guardar en el anticipo. Contacte al administrador.",
      };
    }
  }

  const codigo = codigoCorto(preventa.id);

  revalidatePath("/cermadsa/laarada/preventas", "layout");

  return {
    success: true,
    recibo: {
      tipo: "ingreso",
      codigo,
      cliente_nombre: cliente.nombre,
      cliente_nit: cliente.nit,
      monto,
      saldo_resultante: saldoResultante,
      metodo_pago,
      usuario_nombre: cajero.nombre,
      fecha: new Date().toISOString(),
      dte,
    },
  };
}

export async function certificarPreventaExistente(
  data: CertificarPreventaValues,
): Promise<{ error: string } | { success: true; recibo: ReciboPreventa }> {
  const result = CertificarPreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const {
    movimiento_id,
    receptor_cf,
    nit_receptor,
    nombre_receptor,
    correo_receptor,
    detalles,
  } = result.data;

  const { data: mov, error: movErr } = await supabase
    .from("ven_preventa_movimientos")
    .select(
      "id, cliente_id, tipo, monto, saldo_resultante, preventa_id, metodo_pago, created_at",
    )
    .eq("id", movimiento_id)
    .maybeSingle();

  if (movErr || !mov) return { error: "Movimiento no encontrado" };
  if (mov.tipo !== "ingreso" || !mov.preventa_id) {
    return { error: "Solo se pueden certificar cargas de saldo" };
  }

  const { data: preventa, error: errPreventa } = await supabase
    .from("ven_preventas")
    .select(`id, monto, fecha_emision, ${DTE_COLUMNS}`)
    .eq("id", mov.preventa_id)
    .maybeSingle();

  if (errPreventa || !preventa) return { error: "Anticipo no encontrado" };
  if (preventaCertificada(preventa)) {
    return {
      error:
        "Este anticipo ya tiene factura electrónica certificada y no puede volver a certificarse.",
    };
  }

  const montoPreventa = Number(preventa.monto || 0);
  if (Math.abs(totalDetallesPreventa(detalles) - montoPreventa) > 0.01) {
    return {
      error: "El total de productos debe coincidir con el monto del anticipo.",
    };
  }

  const { data: cliente, error: errCliente } = await supabase
    .from("ven_clientes")
    .select("nombre, nit")
    .eq("id", mov.cliente_id)
    .maybeSingle();

  if (errCliente || !cliente) return { error: "Cliente no encontrado" };

  const idReceptor = receptor_cf
    ? "CF"
    : (nit_receptor ?? "").trim().toUpperCase();
  const nombreReceptor = receptor_cf
    ? "CONSUMIDOR FINAL"
    : (nombre_receptor ?? "").trim();

  const certificacion = await certificarFacturaPreventa({
    detalles,
    granTotal: montoPreventa,
    idReceptor,
    nombreReceptor,
    correoReceptor: correo_receptor ?? undefined,
  });

  if ("error" in certificacion) return { error: certificacion.error };

  const { error: errDte } = await guardarDtePreventa(
    supabase,
    preventa.id,
    certificacion.dte,
    certificacion.fechaEmision,
  );

  if (errDte) {
    return {
      error:
        "La factura se certificó ante la SAT pero no se pudo guardar en el anticipo. Contacte al administrador.",
    };
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");

  return {
    success: true,
    recibo: {
      tipo: "ingreso",
      codigo: codigoCorto(preventa.id),
      cliente_nombre: cliente.nombre,
      cliente_nit: cliente.nit,
      monto: montoPreventa,
      saldo_resultante: Number(mov.saldo_resultante || 0),
      metodo_pago: mov.metodo_pago,
      usuario_nombre: cajero.nombre,
      fecha: mov.created_at,
      dte: certificacion.dte,
    },
  };
}

export async function aplicarPreventa(
  data: AplicarPreventaValues,
): Promise<{ error: string } | { success: true; recibo: ReciboPreventa }> {
  const result = AplicarPreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos de aplicación inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { cliente_id, venta_id, monto } = result.data;

  const saldoActual = await computeSaldo(supabase, cliente_id);
  if (monto > saldoActual + 0.001) {
    return {
      error: `El monto supera el saldo disponible (Q${saldoActual.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      )}).`,
    };
  }

  const { data: cliente } = await supabase
    .from("ven_clientes")
    .select("nombre, nit")
    .eq("id", cliente_id)
    .maybeSingle();

  const saldoResultante = saldoActual - monto;

  const { error: errMov } = await supabase
    .from("ven_preventa_movimientos")
    .insert({
      cliente_id,
      tipo: "consumo",
      monto,
      saldo_resultante: saldoResultante,
      venta_id,
      usuario_id: cajero.userId,
    });

  if (errMov) return { error: "Error al aplicar la preventa" };

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  revalidatePath("/cermadsa/laarada/ventas");

  return {
    success: true,
    recibo: {
      tipo: "consumo",
      codigo: codigoCorto(venta_id),
      cliente_nombre: cliente?.nombre || "Desconocido",
      cliente_nit: cliente?.nit || "C/F",
      monto,
      saldo_resultante: saldoResultante,
      venta_codigo: codigoCorto(venta_id),
      usuario_nombre: cajero.nombre,
      fecha: new Date().toISOString(),
    },
  };
}

export async function devolverPreventaPorVenta(
  data: DevolverPreventaPorVentaValues,
): Promise<{ error: string } | { success: true; montoDevuelto: number }> {
  const result = DevolverPreventaPorVentaSchema.safeParse(data);
  if (!result.success) return { error: "Venta inválida" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { venta_id } = result.data;

  const { data: consumos, error } = await supabase
    .from("ven_preventa_movimientos")
    .select("id, cliente_id, monto")
    .eq("venta_id", venta_id)
    .eq("tipo", "consumo");

  if (error) return { error: "No se pudo consultar el saldo de preventa" };
  if (!consumos?.length) return { success: true, montoDevuelto: 0 };

  const montoDevuelto = consumos.reduce(
    (acc, mov) => acc + Number(mov.monto || 0),
    0,
  );
  const clienteIds = Array.from(new Set(consumos.map((mov) => mov.cliente_id)));

  try {
    for (const clienteId of clienteIds) {
      await recalcularSaldosResultantes(supabase, clienteId);
    }
  } catch {
    return { error: "No se pudo recalcular el saldo de preventa" };
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  revalidatePath("/cermadsa/laarada/ventas");
  return { success: true, montoDevuelto };
}

export async function getComprobanteSignedUrl(path: string): Promise<{
  error?: string;
  url?: string;
}> {
  const raw = path?.trim();
  if (!raw) return { error: "Sin path" };
  if (/^https?:\/\//i.test(raw)) return { url: raw };

  const objectPath = raw
    .replace(/^\/+/, "")
    .replace(/^ventas-comprobantes\//, "");

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { data, error } = await supabase.storage
    .from("ventas-comprobantes")
    .createSignedUrl(objectPath, 3600);

  if (error || !data?.signedUrl) {
    return { error: "No se pudo firmar la constancia" };
  }

  return { url: data.signedUrl };
}

export async function actualizarComprobantePreventa(
  data: ActualizarComprobantePreventaValues,
) {
  const result = ActualizarComprobantePreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { preventa_id, img_comprobante_url } = result.data;

  const { error } = await supabase
    .from("ven_preventas")
    .update({ img_comprobante_url })
    .eq("id", preventa_id);

  if (error) return { error: "No se pudo actualizar el comprobante" };

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  return { success: true };
}

export async function editarCargaPreventa(data: EditarCargaPreventaValues) {
  const result = EditarCargaPreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const {
    movimiento_id,
    monto,
    fecha_emision,
    metodo_pago,
  } = result.data;

  const { data: mov, error: movErr } = await supabase
    .from("ven_preventa_movimientos")
    .select("id, cliente_id, tipo, preventa_id")
    .eq("id", movimiento_id)
    .maybeSingle();

  if (movErr || !mov) return { error: "Movimiento no encontrado" };
  if (mov.tipo !== "ingreso" || !mov.preventa_id) {
    return { error: "Solo se pueden editar cargas de saldo" };
  }

  const { data: preventaActual } = await supabase
    .from("ven_preventas")
    .select("dte_uuid, dte_estado")
    .eq("id", mov.preventa_id)
    .maybeSingle();

  if (preventaCertificada(preventaActual)) {
    return {
      error:
        "Este anticipo ya tiene factura electrónica certificada y no puede editarse.",
    };
  }

  const updatePreventa: {
    monto: number;
    fecha_emision: string;
    metodo_pago: string;
    img_comprobante_url?: null;
  } = {
    monto,
    fecha_emision,
    metodo_pago,
  };

  if (metodo_pago === "Efectivo") {
    updatePreventa.img_comprobante_url = null;
  }

  const { error: preventaErr } = await supabase
    .from("ven_preventas")
    .update(updatePreventa)
    .eq("id", mov.preventa_id);

  if (preventaErr) return { error: "No se pudo actualizar la carga" };

  const { error: movUpdErr } = await supabase
    .from("ven_preventa_movimientos")
    .update({ monto, metodo_pago })
    .eq("id", movimiento_id);

  if (movUpdErr) return { error: "No se pudo actualizar el movimiento" };

  try {
    await recalcularSaldosResultantes(supabase, mov.cliente_id);
  } catch {
    return { error: "No se pudo recalcular el saldo" };
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  return { success: true };
}

export async function eliminarMovimientoPreventa(
  data: EliminarMovimientoPreventaValues,
) {
  const result = EliminarMovimientoPreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const role = await getUserRole(supabase);
  if (!isSuperOrAdmin(role)) {
    return {
      error: "Solo usuarios super o admin pueden eliminar movimientos.",
    };
  }

  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { movimiento_id } = result.data;

  const { data: mov, error: movErr } = await supabase
    .from("ven_preventa_movimientos")
    .select("id, cliente_id, tipo, preventa_id")
    .eq("id", movimiento_id)
    .maybeSingle();

  if (movErr || !mov) return { error: "Movimiento no encontrado" };

  if (mov.tipo === "ingreso" && mov.preventa_id) {
    const { data: preventa } = await supabase
      .from("ven_preventas")
      .select("img_comprobante_url, dte_uuid, dte_estado")
      .eq("id", mov.preventa_id)
      .maybeSingle();

    if (preventaCertificada(preventa)) {
      return {
        error:
          "No se puede eliminar un anticipo con factura certificada. Anule la factura primero.",
      };
    }

    const imgPath = preventa?.img_comprobante_url?.trim();
    if (imgPath) {
      await supabase.storage.from(BUCKET_COMPROBANTES).remove([imgPath]);
    }

    await supabase.from("ven_preventas").delete().eq("id", mov.preventa_id);
  }

  const { error: delErr } = await supabase
    .from("ven_preventa_movimientos")
    .delete()
    .eq("id", movimiento_id);

  if (delErr) return { error: "No se pudo eliminar el movimiento" };

  try {
    await recalcularSaldosResultantes(supabase, mov.cliente_id);
  } catch {
    return { error: "No se pudo recalcular el saldo" };
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  revalidatePath("/cermadsa/laarada/ventas");
  return { success: true };
}

export async function anularFacturaPreventa(
  data: AnularFacturaPreventaValues,
): Promise<
  { error: string } | { success: true; extemporanea: boolean }
> {
  const result = AnularFacturaPreventaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { movimiento_id, motivo } = result.data;

  const { data: mov, error: movErr } = await supabase
    .from("ven_preventa_movimientos")
    .select("id, cliente_id, tipo, preventa_id")
    .eq("id", movimiento_id)
    .maybeSingle();

  if (movErr || !mov) return { error: "Movimiento no encontrado" };
  if (mov.tipo !== "ingreso" || !mov.preventa_id) {
    return { error: "Solo se pueden anular facturas de anticipos" };
  }

  const { data: preventa, error: errPreventa } = await supabase
    .from("ven_preventas")
    .select(`id, ${DTE_COLUMNS}`)
    .eq("id", mov.preventa_id)
    .maybeSingle();

  if (errPreventa || !preventa) return { error: "Anticipo no encontrado" };
  if (!preventaCertificada(preventa) || !preventa.dte_uuid) {
    return {
      error: "Este anticipo no tiene una factura certificada para anular.",
    };
  }

  const fechaEmisionRaw =
    preventa.dte_fecha_emision ?? preventa.dte_fecha_certificacion ?? "";
  if (!fechaEmisionRaw) {
    return { error: "No se encontró la fecha de emisión de la factura." };
  }

  const idReceptor = preventa.dte_id_receptor ?? "CF";
  const esCF = isConsumidorFinalNit(idReceptor);
  const plazo = plazoAnulacionInmediata(fechaEmisionRaw);
  if (esCF && !plazo.permitido) {
    return { error: mensajePlazoAnulacionCf(plazo) };
  }

  const xml = buildXMLAnulacion({
    nitEmisor: getEmisorConfig().nitEmisor,
    idReceptor,
    uuidAAnular: preventa.dte_uuid,
    fechaEmisionDocumento: toFelFechaGT(fechaEmisionRaw),
    fechaHoraAnulacion: toFelFechaGT(new Date()),
    motivoAnulacion: escapeXml(motivo),
  });

  let respuesta;
  try {
    respuesta = await anularDTE(xml);
  } catch {
    return { error: "No se pudo conectar con INFILE para anular." };
  }

  if (!respuesta.resultado) {
    return { error: mensajeErroresInfile(respuesta.descripcion_errores) };
  }

  const { error: updErr } = await supabase
    .from("ven_preventas")
    .update({ dte_estado: "anulado" })
    .eq("id", mov.preventa_id);

  if (updErr) {
    return {
      error:
        "La SAT anuló la factura pero no se pudo actualizar el registro.",
    };
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  return { success: true, extemporanea: false };
}

export async function eliminarPreventaCliente(
  data: EliminarPreventaClienteValues,
) {
  const result = EliminarPreventaClienteSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const role = await getUserRole(supabase);
  if (!isSuperOrAdmin(role)) {
    return {
      error:
        "Solo usuarios super o admin pueden eliminar preventas del cliente.",
    };
  }

  const cajero = await requireAuthenticatedCajero(supabase);
  if (!cajero.ok) return { error: cajero.error };

  const { cliente_id } = result.data;

  const { data: cliente, error: errCliente } = await supabase
    .from("ven_clientes")
    .select("nombre")
    .eq("id", cliente_id)
    .maybeSingle();

  if (errCliente || !cliente) return { error: "Cliente no encontrado" };

  const { count: movCount, error: countErr } = await supabase
    .from("ven_preventa_movimientos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", cliente_id);

  if (countErr) return { error: "No se pudo verificar los movimientos" };
  if ((movCount ?? 0) > 0) {
    return {
      error:
        "No se puede eliminar: el cliente tiene movimientos en preventas. Elimine cada movimiento desde el detalle primero.",
    };
  }

  const { data: preventas } = await supabase
    .from("ven_preventas")
    .select("id, img_comprobante_url")
    .eq("cliente_id", cliente_id);

  const imgPaths = (preventas ?? [])
    .map((p) => p.img_comprobante_url?.trim())
    .filter((p): p is string => !!p);

  const { error: delPreventasErr } = await supabase
    .from("ven_preventas")
    .delete()
    .eq("cliente_id", cliente_id);

  if (delPreventasErr) {
    return { error: "No se pudieron eliminar los anticipos" };
  }

  if (imgPaths.length > 0) {
    await supabase.storage.from(BUCKET_COMPROBANTES).remove(imgPaths);
  }

  revalidatePath("/cermadsa/laarada/preventas", "layout");
  revalidatePath("/cermadsa/laarada/ventas");

  return {
    success: true,
    clienteNombre: cliente.nombre,
  };
}
