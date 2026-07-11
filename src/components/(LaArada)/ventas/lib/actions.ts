"use server";

import { createClient } from "@/utils/supabase/server";
import { VentaSchema, VentaFormValues, PagoVentaSchema, PagoVentaValues } from "./zod";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedCajero } from "@/utils/require-authenticated-cajero";

const BUCKET_COMPROBANTES = "ventas-comprobantes";

async function removeComprobanteIfReplaced(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pathAnterior: string | null | undefined,
  pathNuevo: string | null | undefined,
) {
  if (pathAnterior && pathAnterior !== pathNuevo) {
    await supabase.storage.from(BUCKET_COMPROBANTES).remove([pathAnterior]);
  }
}

async function getUserRole(supabase: Awaited<ReturnType<typeof createClient>>) {
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

export async function getCatalogos() {
  const supabase = await createClient();
  const [clientes, productos] = await Promise.all([
    supabase.from("ven_clientes").select("id, nombre, nit").order("nombre"),
    supabase
      .from("inv_productos")
      .select("id, nombre, codigo, precio_base, stock_actual, medida")
      .order("nombre"),
  ]);

  return {
    clientes: clientes.data || [],
    productos: productos.data || [],
  };
}

export async function getVentas(vendedorId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("ven_ventas")
    .select(
      `
      *,
      ven_clientes (nombre, nit),
      dte_documentos (id, estado, uuid_infile, serie, numero, id_receptor, nombre_receptor, gran_total, fecha_certificacion),
      ven_detalle (
        id,
        producto_id,
        cantidad,
        precio_aplicado,
        subtotal,
        inv_productos (nombre, medida)
      )
    `,
    );

  if (vendedorId && vendedorId !== "all") {
    query = query.eq("usuario_id", vendedorId);
  }

  const { data: ventas, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const usuarioIds = Array.from(
    new Set(ventas.map((v) => v.usuario_id).filter(Boolean)),
  ) as string[];

  if (usuarioIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nombre")
      .in("id", usuarioIds);

    if (profiles) {
      return ventas.map((venta) => {
        const profile = profiles.find((p) => p.id === venta.usuario_id);
        return {
          ...venta,
          vendedor: { nombre: profile?.nombre || null },
        };
      });
    }
  }

  return ventas;
}

export async function getVendedores() {
  const supabase = await createClient();
  
  // Obtenemos los IDs de usuarios únicos de la tabla ven_ventas
  const { data: uniqueUserIds } = await supabase
    .from("ven_ventas")
    .select("usuario_id");

  const ids = Array.from(new Set(uniqueUserIds?.map(u => u.usuario_id).filter(Boolean)));
  
  if (!ids.length) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, nombre")
    .in("id", ids)
    .order("nombre");

  if (error) return [];
  return profiles || [];
}

export async function createVenta(data: VentaFormValues) {
  const result = VentaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { detalles, ...cabecera } = result.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada" };

  const esContado = cabecera.tipo_venta === "Contado";
  const metodoPago = esContado ? cabecera.metodo_pago || "Efectivo" : null;

  let cajeroId: string | null = null;
  if (esContado) {
    const cajero = await requireAuthenticatedCajero(supabase);
    if (!cajero.ok) {
      return { error: cajero.error };
    }
    cajeroId = cajero.userId;
  }

  const { data: venta, error: errVenta } = await supabase
    .from("ven_ventas")
    .insert({
      cliente_id: cabecera.cliente_id,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      total: cabecera.total,
      fecha_entrega: cabecera.fecha_entrega || new Date().toISOString(),
      observaciones: cabecera.observaciones,
      usuario_id: user.id,
      estado: "Pendiente",
      metodo_pago: metodoPago,
      numero_boleta:
        esContado && metodoPago === "Transferencia"
          ? cabecera.numero_boleta || null
          : null,
      banco:
        esContado && metodoPago === "Transferencia"
          ? cabecera.banco || null
          : null,
      fecha_transferencia:
        esContado && metodoPago === "Transferencia" && cabecera.fecha_transferencia
          ? cabecera.fecha_transferencia
          : null,
      img_comprobante_url:
        esContado && metodoPago === "Transferencia"
          ? cabecera.img_comprobante_url || null
          : null,
    })
    .select()
    .single();

  if (errVenta || !venta)
    return { error: errVenta?.message || "Error al crear cabecera" };

  const detallesFinal = detalles.map((d) => ({
    venta_id: venta.id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_aplicado: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  const { error: errDetalle } = await supabase
    .from("ven_detalle")
    .insert(detallesFinal);

  if (errDetalle) return { error: "Error al guardar productos" };

  for (const item of detalles) {
    const { data: prodData } = await supabase
      .from("inv_productos")
      .select("stock_actual")
      .eq("id", item.producto_id)
      .single();

    if (prodData) {
      const nuevoStock = prodData.stock_actual - item.cantidad;

      const { error: errStock } = await supabase
        .from("inv_productos")
        .update({ stock_actual: nuevoStock })
        .eq("id", item.producto_id);

      if (errStock)
        console.error(
          `Error descontando stock del producto ${item.producto_id}`,
        );
    }
  }

  if (esContado && cajeroId) {
    const { error: errPago } = await supabase.from("ven_pagos").insert({
      venta_id: venta.id,
      monto: cabecera.total,
      metodo_pago: metodoPago || "Efectivo",
      usuario_id: cajeroId,
    });

    if (errPago) {
      return { error: "Error al registrar el pago automático." };
    }
  }

  revalidatePath("/cermadsa/laarada/pedidos");
  return { success: true, ventaId: venta.id };
}

export async function updateVenta(id: string, data: VentaFormValues) {
  const result = VentaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { detalles, ...cabecera } = result.data;

  const esContado = cabecera.tipo_venta === "Contado";
  const metodoPago = esContado ? cabecera.metodo_pago || "Efectivo" : null;
  const nuevoComprobante =
    esContado && metodoPago === "Transferencia"
      ? cabecera.img_comprobante_url || null
      : null;

  const { data: ventaActual } = await supabase
    .from("ven_ventas")
    .select("img_comprobante_url")
    .eq("id", id)
    .maybeSingle();

  await removeComprobanteIfReplaced(
    supabase,
    ventaActual?.img_comprobante_url,
    nuevoComprobante,
  );

  const { error: errVenta } = await supabase
    .from("ven_ventas")
    .update({
      cliente_id: cabecera.cliente_id,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      observaciones: cabecera.observaciones,
      total: cabecera.total,
      fecha_entrega: cabecera.fecha_entrega || new Date().toISOString(),
      metodo_pago: metodoPago,
      numero_boleta:
        esContado && metodoPago === "Transferencia"
          ? cabecera.numero_boleta || null
          : null,
      banco:
        esContado && metodoPago === "Transferencia"
          ? cabecera.banco || null
          : null,
      fecha_transferencia:
        esContado && metodoPago === "Transferencia" && cabecera.fecha_transferencia
          ? cabecera.fecha_transferencia
          : null,
      img_comprobante_url: nuevoComprobante,
    })
    .eq("id", id);

  if (errVenta) return { error: errVenta.message };

  await supabase.from("ven_detalle").delete().eq("venta_id", id);

  const detallesFinal = detalles.map((d) => ({
    venta_id: id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_aplicado: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  const { error: errDetalle } = await supabase
    .from("ven_detalle")
    .insert(detallesFinal);

  if (errDetalle) return { error: "Error al actualizar productos" };

  if (esContado) {
    const cajero = await requireAuthenticatedCajero(supabase);
    if (!cajero.ok) {
      return { error: cajero.error };
    }

    const { data: pagoExistente } = await supabase
      .from("ven_pagos")
      .select("id")
      .eq("venta_id", id)
      .limit(1)
      .maybeSingle();

    if (pagoExistente) {
      await supabase
        .from("ven_pagos")
        .update({
          metodo_pago: metodoPago || "Efectivo",
          monto: cabecera.total,
          usuario_id: cajero.userId,
        })
        .eq("id", pagoExistente.id);
    } else {
      await supabase.from("ven_pagos").insert({
        venta_id: id,
        monto: cabecera.total,
        metodo_pago: metodoPago || "Efectivo",
        usuario_id: cajero.userId,
      });
    }
  } else {
    await supabase.from("ven_pagos").delete().eq("venta_id", id);
  }

  revalidatePath("/cermadsa/laarada/pedidos");
  revalidatePath("/cermadsa/laarada/creditos");
  return { success: true };
}

export async function updateVentaTipoVenta(id: string) {
  const supabase = await createClient();
  const role = await getUserRole(supabase);

  if (!isSuperOrAdmin(role)) {
    return { error: "No tienes permiso para cambiar el tipo de venta." };
  }

  const { data: venta, error: errVenta } = await supabase
    .from("ven_ventas")
    .select("tipo_venta, img_comprobante_url")
    .eq("id", id)
    .maybeSingle();

  if (errVenta || !venta) {
    return { error: errVenta?.message || "Venta no encontrada" };
  }

  if (venta.tipo_venta === "Crédito") {
    return { success: true };
  }

  if (venta.tipo_venta !== "Contado") {
    return { error: "Solo se permite cambiar de Contado a Crédito." };
  }

  await removeComprobanteIfReplaced(supabase, venta.img_comprobante_url, null);
  await supabase.from("ven_pagos").delete().eq("venta_id", id);

  const { error: errUpdate } = await supabase
    .from("ven_ventas")
    .update({
      tipo_venta: "Crédito",
      metodo_pago: null,
      numero_boleta: null,
      banco: null,
      fecha_transferencia: null,
      img_comprobante_url: null,
    })
    .eq("id", id);

  if (errUpdate) return { error: errUpdate.message };

  revalidatePath("/cermadsa/laarada/pedidos");
  revalidatePath("/cermadsa/laarada/ventas");
  revalidatePath("/cermadsa/laarada/creditos");
  return { success: true };
}

export async function updateVentaPago(id: string, data: PagoVentaValues) {
  const result = PagoVentaSchema.safeParse(data);
  if (!result.success) return { error: "Datos de pago inválidos" };

  const supabase = await createClient();
  const { metodo_pago, numero_boleta, banco, fecha_transferencia, img_comprobante_url } =
    result.data;

  const esTransferencia = metodo_pago === "Transferencia";
  const nuevoComprobante = esTransferencia ? img_comprobante_url || null : null;

  const { data: ventaActual } = await supabase
    .from("ven_ventas")
    .select("img_comprobante_url")
    .eq("id", id)
    .maybeSingle();

  await removeComprobanteIfReplaced(
    supabase,
    ventaActual?.img_comprobante_url,
    nuevoComprobante,
  );

  const { data: venta, error: errVenta } = await supabase
    .from("ven_ventas")
    .update({
      metodo_pago,
      numero_boleta: esTransferencia ? numero_boleta || null : null,
      banco: esTransferencia ? banco || null : null,
      fecha_transferencia:
        esTransferencia && fecha_transferencia ? fecha_transferencia : null,
      img_comprobante_url: nuevoComprobante,
    })
    .eq("id", id)
    .select("id, total, tipo_venta")
    .single();

  if (errVenta || !venta) return { error: errVenta?.message || "Error al actualizar pago" };

  if (venta.tipo_venta === "Contado") {
    const cajero = await requireAuthenticatedCajero(supabase);
    if (!cajero.ok) {
      return { error: cajero.error };
    }

    const { data: pagoExistente } = await supabase
      .from("ven_pagos")
      .select("id")
      .eq("venta_id", id)
      .limit(1)
      .maybeSingle();

    if (pagoExistente) {
      await supabase
        .from("ven_pagos")
        .update({ metodo_pago, usuario_id: cajero.userId })
        .eq("id", pagoExistente.id);
    } else {
      await supabase.from("ven_pagos").insert({
        venta_id: id,
        monto: venta.total,
        metodo_pago,
        usuario_id: cajero.userId,
      });
    }
  }

  revalidatePath("/cermadsa/laarada/pedidos");
  revalidatePath("/cermadsa/laarada/ventas");
  return { success: true };
}

export async function getVentaById(id: string) {
  const supabase = await createClient();

  const { data: venta, error } = await supabase
    .from("ven_ventas")
    .select(
      `
      *,
      ven_clientes (*),
      ven_detalle (
        *,
        inv_productos (nombre, codigo, medida)
      ),
      dte_documentos (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !venta) return null;

  // Traer el nombre del vendedor manualmente si existe un usuario_id
  if (venta.usuario_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre")
      .eq("id", venta.usuario_id)
      .single();

    if (profile) {
      return {
        ...venta,
        vendedor: { nombre: profile.nombre },
      };
    }
  }

  return venta;
}

export async function updateEstadoVenta(
  id: string,
  estado: string,
  observaciones: string,
) {
  const supabase = await createClient();

  if (estado.toLowerCase().trim() === "anulado") {
    const { data: detalles } = await supabase
      .from("ven_detalle")
      .select("producto_id, cantidad")
      .eq("venta_id", id);

    if (detalles) {
      for (const item of detalles) {
        const { data: prodData } = await supabase
          .from("inv_productos")
          .select("stock_actual")
          .eq("id", item.producto_id)
          .single();

        if (prodData) {
          const nuevoStock = prodData.stock_actual + item.cantidad;

          await supabase
            .from("inv_productos")
            .update({ stock_actual: nuevoStock })
            .eq("id", item.producto_id);
        }
      }
    }
  }

  const { error } = await supabase
    .from("ven_ventas")
    .update({ estado, observaciones })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cermadsa/laarada/pedidos");
  return { success: true };
}

export async function getPendingOrdersCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ven_ventas")
    .select("*", { count: "exact", head: true })
    .ilike("estado", "Pendiente");

  if (error) return 0;
  return count || 0;
}
