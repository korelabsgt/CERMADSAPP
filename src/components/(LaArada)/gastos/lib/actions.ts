"use server";

import { createClient } from "@/utils/supabase/server";
import { GastoSchema, GastoFormValues, GastoItem, GastoCategoriaItem, GastoMovimiento } from "./zod";
import { formatFechaHora, formatNombreCorto } from "./ui";
import { revalidatePath } from "next/cache";

export async function getGastos(): Promise<GastoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("arada_gastos")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    console.warn("Advertencia al obtener gastos (la tabla puede estar pendiente de crearse en Supabase):", error.message);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    cantidad: Number(item.cantidad || 0),
    movimientos: Array.isArray(item.movimientos) ? item.movimientos : [],
  }));
}

export async function getGastosCategorias(): Promise<GastoCategoriaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("arada_gastos_categoria")
    .select("*")
    .order("categoria", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías de gastos:", error.message);
    return [];
  }

  return data || [];
}

export async function createGastoCategoria(categoria: string) {
  const trimmed = (categoria || "").trim();
  if (!trimmed) {
    return { error: "El nombre de la categoría es requerido." };
  }

  const supabase = await createClient();

  // Verificar si ya existe en Supabase (insensible a mayúsculas/minúsculas)
  const { data: existing } = await supabase
    .from("arada_gastos_categoria")
    .select("categoria")
    .ilike("categoria", trimmed)
    .maybeSingle();

  if (existing) {
    return { error: `La categoría "${trimmed}" ya existe.` };
  }

  const { data, error } = await supabase
    .from("arada_gastos_categoria")
    .insert({ categoria: trimmed })
    .select()
    .single();

  if (error) {
    console.error("Error al crear categoría de gasto:", error.message);
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/gastos");
  return { data };
}

export async function createGasto(raw: GastoFormValues) {
  const parsed = GastoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión de usuario activa." };
  }

  const meta = user.user_metadata || {};
  const rawUserName =
    meta.name || meta.nombre || meta.username || user.email?.split("@")[0] || "Usuario";
  const userName = formatNombreCorto(rawUserName);

  const fechaIso = data.fecha.includes("T")
    ? new Date(data.fecha).toISOString()
    : new Date(`${data.fecha}T12:00:00`).toISOString();

  const initialMovement: GastoMovimiento = {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    usuario: userName,
    accion: "Creación",
    detalle: `Creado por ${userName}: Monto Q${data.cantidad.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}, Categoría "${data.categoria}", Concepto "${data.nombre.trim()}"${
      data.descripcion ? `, Descripción: "${data.descripcion.trim()}"` : ""
    }, Fecha: ${formatFechaHora(fechaIso)}`,
  };

  const { error } = await supabase.from("arada_gastos").insert({
    nombre: data.nombre.trim(),
    cantidad: data.cantidad,
    categoria: data.categoria.trim(),
    descripcion: data.descripcion?.trim() || null,
    fecha: fechaIso,
    created_by: userName,
    movimientos: [initialMovement],
  });

  if (error) {
    console.error("Error al crear gasto:", error.message);
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/gastos");
  return { success: true };
}

export async function updateGasto(id: string, raw: GastoFormValues) {
  const parsed = GastoSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No hay sesión de usuario activa." };
  }

  const meta = user.user_metadata || {};
  const rawUserName =
    meta.name || meta.nombre || meta.username || user.email?.split("@")[0] || "Usuario";
  const userName = formatNombreCorto(rawUserName);

  // Obtener movimientos y valores anteriores existentes
  const { data: currentGasto, error: fetchErr } = await supabase
    .from("arada_gastos")
    .select("movimientos, cantidad, categoria, nombre, descripcion, fecha")
    .eq("id", id)
    .single();

  if (fetchErr || !currentGasto) {
    return { error: "No se encontró el gasto a actualizar." };
  }

  const existingMovs = Array.isArray(currentGasto.movimientos)
    ? currentGasto.movimientos
    : [];

  const fechaIso = data.fecha.includes("T")
    ? new Date(data.fecha).toISOString()
    : new Date(`${data.fecha}T12:00:00`).toISOString();

  // Comparar campos para registrar lo que tenía antes y lo nuevo que se editó
  const cambios: string[] = [];

  const prevNombre = (currentGasto.nombre || "").trim();
  const newNombre = data.nombre.trim();
  if (prevNombre !== newNombre) {
    cambios.push(`Concepto: antes "${prevNombre}" ➔ ahora "${newNombre}"`);
  }

  const prevCantidad = Number(currentGasto.cantidad || 0);
  const newCantidad = Number(data.cantidad || 0);
  if (prevCantidad !== newCantidad) {
    cambios.push(
      `Monto: antes Q${prevCantidad.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })} ➔ ahora Q${newCantidad.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`
    );
  }

  const prevCategoria = (currentGasto.categoria || "").trim();
  const newCategoria = data.categoria.trim();
  if (prevCategoria !== newCategoria) {
    cambios.push(`Categoría: antes "${prevCategoria}" ➔ ahora "${newCategoria}"`);
  }

  const prevDesc = (currentGasto.descripcion || "").trim();
  const newDesc = (data.descripcion || "").trim();
  if (prevDesc !== newDesc) {
    cambios.push(
      `Descripción: antes "${prevDesc || "Vacía"}" ➔ ahora "${newDesc || "Vacía"}"`
    );
  }

  const prevFechaIso = currentGasto.fecha ? new Date(currentGasto.fecha).toISOString() : "";
  if (prevFechaIso && fechaIso && prevFechaIso !== fechaIso) {
    cambios.push(
      `Fecha: antes "${formatFechaHora(prevFechaIso)}" ➔ ahora "${formatFechaHora(fechaIso)}"`
    );
  }

  const detalleTexto =
    cambios.length > 0
      ? `Editado por ${userName}: ${cambios.join(" | ")}`
      : `Editado por ${userName}: Sin modificaciones en los campos principales.`;

  const updateMovement: GastoMovimiento = {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
    usuario: userName,
    accion: "Edición",
    detalle: detalleTexto,
  };

  const { error } = await supabase
    .from("arada_gastos")
    .update({
      nombre: data.nombre.trim(),
      cantidad: data.cantidad,
      categoria: data.categoria.trim(),
      descripcion: data.descripcion?.trim() || null,
      fecha: fechaIso,
      movimientos: [updateMovement, ...existingMovs],
    })
    .eq("id", id);

  if (error) {
    console.error("Error al actualizar gasto:", error.message);
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/gastos");
  return { success: true };
}

export async function deleteGasto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("arada_gastos").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar gasto:", error.message);
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/gastos");
  return { success: true };
}
