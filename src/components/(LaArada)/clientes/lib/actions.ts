"use server";

import { createClient } from "@/utils/supabase/server";
import { ClientSchema, ClientFormValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createClientAction(data: ClientFormValues) {
  const result = ClientSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("ven_clientes")
    .select("nit")
    .eq("nit", result.data.nit)
    .maybeSingle();

  if (existing && result.data.nit.toLowerCase() !== "c/f") {
    return { error: "El NIT ya está registrado." };
  }

  const { error } = await supabase.from("ven_clientes").insert(result.data);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}

export async function updateClientAction(id: string, data: ClientFormValues) {
  const result = ClientSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("ven_clientes")
    .select("id, nit")
    .eq("nit", result.data.nit)
    .neq("id", id)
    .maybeSingle();

  if (existing && result.data.nit.toLowerCase() !== "c/f") {
    return { error: "El NIT ya está registrado por otro cliente." };
  }

  const { error } = await supabase
    .from("ven_clientes")
    .update(result.data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No se encontró una sesión de usuario activa." };
  }

  const metadata = user.user_metadata || {};
  const role = (metadata.rol || user.role || "user") as string;
  if (role !== "super" && role !== "admin") {
    return { error: "No tienes permisos para eliminar clientes." };
  }

  const { error } = await supabase.from("ven_clientes").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}

export async function getClientSalesAction(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_ventas")
    .select("*, ven_detalle(*, inv_productos(nombre))")
    .eq("cliente_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
