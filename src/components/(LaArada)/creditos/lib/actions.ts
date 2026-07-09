"use server";

import { createClient } from "@/utils/supabase/server";
import { PagoCreditoSchema, PagoCreditoValues } from "./zod";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedCajero } from "@/utils/require-authenticated-cajero";

async function getUserRole() {
  const supabase = await createClient();
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

export async function getVentasCredito() {
  const supabase = await createClient();
  const { data: ventas, error } = await supabase
    .from("ven_ventas")
    .select(
      `
      *,
      ven_clientes (nombre, nit, telefono),
      ven_detalle (
        id,
        cantidad,
        precio_aplicado,
        subtotal,
        inv_productos (nombre, medida)
      ),
      ven_pagos (id, monto, usuario_id, created_at, fecha_pago)
    `,
    )
    .eq("tipo_venta", "Crédito")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nombre");
  const profileMap = new Map();

  if (profiles) {
    profiles.forEach((p) => profileMap.set(p.id, p.nombre));
  }

  return ventas.map((venta) => ({
    ...venta,
    vendedor_nombre: profileMap.get(venta.usuario_id) || "Desconocido",
    ven_pagos: venta.ven_pagos?.map(
      (pago: {
        id: string;
        monto: number;
        usuario_id: string;
        created_at?: string;
        fecha_pago?: string;
      }) => ({
        ...pago,
        cajero_nombre: profileMap.get(pago.usuario_id) || "Desconocido",
      }),
    ),
  }));
}

export async function procesarPagoCredito(data: PagoCreditoValues) {
  const result = PagoCreditoSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos de pago inválidos." };
  }

  const supabase = await createClient();
  const cajero = await requireAuthenticatedCajero(supabase);

  if (!cajero.ok) {
    return { error: cajero.error };
  }

  const { data: venta, error: ventaError } = await supabase
    .from("ven_ventas")
    .select("id, tipo_venta, total, ven_pagos(monto)")
    .eq("id", result.data.venta_id)
    .single();

  if (ventaError || !venta) {
    return { error: ventaError?.message || "Venta no encontrada." };
  }

  if (venta.tipo_venta !== "Crédito") {
    return { error: "Solo se pueden registrar abonos en ventas a crédito." };
  }

  const { error: pagoError } = await supabase.from("ven_pagos").insert({
    venta_id: result.data.venta_id,
    monto: result.data.monto,
    metodo_pago: result.data.metodo_pago,
    referencia: result.data.observaciones || null,
    usuario_id: cajero.userId,
  });

  if (pagoError) {
    return { error: pagoError.message };
  }

  const totalPagado = (venta.ven_pagos ?? []).reduce(
    (acc: number, pago: { monto: number }) => acc + Number(pago.monto),
    0,
  ) + Number(result.data.monto);

  if (totalPagado >= Number(venta.total)) {
    await supabase
      .from("ven_ventas")
      .update({ estado: "Pagado" })
      .eq("id", result.data.venta_id);
  }

  revalidatePath("/cermadsa/laarada/creditos");
  revalidatePath("/cermadsa/laarada/pedidos");

  return { success: true };
}

export async function eliminarAbonoCredito(pagoId: string) {
  const role = await getUserRole();
  if (!isSuperOrAdmin(role)) {
    return { error: "No tienes permisos para eliminar abonos." };
  }

  const supabase = await createClient();

  const { data: pago, error: pagoFetchError } = await supabase
    .from("ven_pagos")
    .select("id, venta_id")
    .eq("id", pagoId)
    .single();

  if (pagoFetchError || !pago) {
    return { error: "Abono no encontrado." };
  }

  const { error: deleteError } = await supabase
    .from("ven_pagos")
    .delete()
    .eq("id", pagoId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { data: venta } = await supabase
    .from("ven_ventas")
    .select("total, estado, ven_pagos(monto)")
    .eq("id", pago.venta_id)
    .single();

  if (venta) {
    const totalPagado = (venta.ven_pagos ?? []).reduce(
      (acc: number, p: { monto: number }) => acc + Number(p.monto),
      0,
    );
    if (totalPagado < Number(venta.total) && venta.estado === "Pagado") {
      await supabase
        .from("ven_ventas")
        .update({ estado: "Entregado" })
        .eq("id", pago.venta_id);
    }
  }

  revalidatePath("/cermadsa/laarada/creditos");
  revalidatePath("/cermadsa/laarada/pedidos");
  revalidatePath("/cermadsa/laarada/clientes");

  return { success: true };
}
