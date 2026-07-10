"use server";

import { createClient } from "@/utils/supabase/server";
import { ClientSchema, ClientFormValues } from "./zod";
import { revalidatePath } from "next/cache";

function isVentaAnulada(estado?: string | null) {
  return (
    String(estado || "")
      .trim()
      .toLowerCase() === "anulado"
  );
}

async function requireDeletePermission() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "No se encontró una sesión de usuario activa." };
  }

  const metadata = user.user_metadata || {};
  const role = (metadata.rol || user.role || "user") as string;
  if (role !== "super" && role !== "admin") {
    return { supabase, error: "No tienes permisos para eliminar clientes." };
  }

  return { supabase };
}

function mapDeleteClientError(message: string) {
  if (message.includes("ven_ventas_cliente_id_fkey")) {
    return "No se puede eliminar el cliente porque aún tiene ventas vinculadas.";
  }
  if (message.includes("null value") && message.includes("cliente_id")) {
    return "No se pudieron desvincular las ventas anuladas. La base de datos requiere un cliente en cada venta.";
  }
  return message;
}

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

export async function getClientDeletionPreview(clientId: string) {
  const auth = await requireDeletePermission();
  if (auth.error) return { error: auth.error };

  const { data: ventas, error } = await auth.supabase!
    .from("ven_ventas")
    .select("id, estado")
    .eq("cliente_id", clientId);

  if (error) return { error: error.message };

  const ventasList = ventas ?? [];
  const activas = ventasList.filter((v) => !isVentaAnulada(v.estado));
  const anuladas = ventasList.filter((v) => isVentaAnulada(v.estado));

  return {
    success: true,
    activeCount: activas.length,
    annulledCount: anuladas.length,
    canDeleteDirectly: activas.length === 0,
  };
}

export async function deleteClientAction(
  id: string,
  reassignToClientId?: string,
) {
  const auth = await requireDeletePermission();
  if (auth.error) return { error: auth.error };

  const supabase = auth.supabase!;

  const { data: ventas, error: ventasError } = await supabase
    .from("ven_ventas")
    .select("id, estado")
    .eq("cliente_id", id);

  if (ventasError) {
    return { error: mapDeleteClientError(ventasError.message) };
  }

  const ventasList = ventas ?? [];
  const activas = ventasList.filter((v) => !isVentaAnulada(v.estado));
  const anuladas = ventasList.filter((v) => isVentaAnulada(v.estado));

  if (activas.length > 0) {
    if (!reassignToClientId) {
      return {
        error: `Este cliente tiene ${activas.length} venta(s) activa(s). Debes reasignarlas a otro cliente antes de eliminarlo.`,
        code: "HAS_ACTIVE_SALES",
        activeCount: activas.length,
        annulledCount: anuladas.length,
      };
    }

    if (reassignToClientId === id) {
      return { error: "No puedes reasignar las ventas al mismo cliente." };
    }

    const { data: targetClient } = await supabase
      .from("ven_clientes")
      .select("id")
      .eq("id", reassignToClientId)
      .maybeSingle();

    if (!targetClient) {
      return { error: "El cliente destino para reasignar no existe." };
    }

    const { error: reassignError } = await supabase
      .from("ven_ventas")
      .update({ cliente_id: reassignToClientId })
      .in(
        "id",
        activas.map((v) => v.id),
      );

    if (reassignError) {
      return { error: mapDeleteClientError(reassignError.message) };
    }
  }

  if (anuladas.length > 0) {
    const { error: unlinkError } = await supabase
      .from("ven_ventas")
      .update({ cliente_id: null })
      .in(
        "id",
        anuladas.map((v) => v.id),
      );

    if (unlinkError) {
      return { error: mapDeleteClientError(unlinkError.message) };
    }
  }

  const { error: deleteError } = await supabase
    .from("ven_clientes")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: mapDeleteClientError(deleteError.message) };
  }

  revalidatePath("/cermadsa/laarada/clientes");
  revalidatePath("/cermadsa/laarada/pedidos");
  revalidatePath("/cermadsa/laarada/creditos");
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
