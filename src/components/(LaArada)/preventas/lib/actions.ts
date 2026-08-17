"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedCajero } from "@/utils/require-authenticated-cajero";
import {
  PreventaSchema,
  ActualizarComprobantePreventaSchema,
  EditarCargaPreventaSchema,
  EliminarMovimientoPreventaSchema,
  EliminarPreventaClienteSchema,
  EliminarPreventaClienteValues,
  PreventaFormValues,
  AplicarPreventaSchema,
  AplicarPreventaValues,
  ActualizarComprobantePreventaValues,
  EditarCargaPreventaValues,
  EliminarMovimientoPreventaValues,
  ClientePreventa,
  ClienteLista,
  PreventaMovimiento,
  ReciboPreventa,
  codigoCorto,
  slugCliente,
} from "./zod";

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

async function computeSaldo(
  supabase: Supabase,
  clienteId: string,
): Promise<number> {
  const { data: movimientos } = await supabase
    .from("ven_preventa_movimientos")
    .select("tipo, monto")
    .eq("cliente_id", clienteId);

  return (movimientos ?? []).reduce((acc: number, mov) => {
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
    .select("id, tipo, monto")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  let saldo = 0;
  for (const mov of movs ?? []) {
    const m = Number(mov.monto || 0);
    saldo = mov.tipo === "ingreso" ? saldo + m : saldo - m;
    const { error: updErr } = await supabase
      .from("ven_preventa_movimientos")
      .update({ saldo_resultante: saldo })
      .eq("id", mov.id);
    if (updErr) throw new Error(updErr.message);
  }
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
    .select("cliente_id, tipo, monto, ven_clientes (nombre, nit, telefono)");

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
    const monto = Number(mov.monto || 0);
    entry.saldo += mov.tipo === "ingreso" ? monto : -monto;
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
      ven_ventas (numero_recibo)
    `,
    )
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

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
    { fecha_emision: string | null; img_comprobante_url: string | null }
  >();
  if (preventaIds.length > 0) {
    const { data: preventas } = await supabase
      .from("ven_preventas")
      .select("id, fecha_emision, img_comprobante_url")
      .in("id", preventaIds);
    (preventas ?? []).forEach((p) =>
      preventaMap.set(p.id, {
        fecha_emision: p.fecha_emision ?? null,
        img_comprobante_url: p.img_comprobante_url ?? null,
      }),
    );
  }

  return rows.map((mov) => {
    const extra = mov as unknown as {
      ven_ventas?:
        | { numero_recibo?: number | null }
        | { numero_recibo?: number | null }[]
        | null;
    };
    const ventaRaw = extra.ven_ventas;
    const venta = Array.isArray(ventaRaw)
      ? (ventaRaw[0] ?? null)
      : (ventaRaw ?? null);
    const preventa = mov.preventa_id
      ? preventaMap.get(mov.preventa_id)
      : undefined;

    return {
      id: mov.id,
      cliente_id: mov.cliente_id,
      tipo: mov.tipo,
      monto: Number(mov.monto || 0),
      saldo_resultante: Number(mov.saldo_resultante || 0),
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
      .select("img_comprobante_url")
      .eq("id", mov.preventa_id)
      .maybeSingle();

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
