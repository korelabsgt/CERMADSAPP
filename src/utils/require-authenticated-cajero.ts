import type { SupabaseClient } from "@supabase/supabase-js";

type CajeroResult =
  | { ok: true; userId: string; nombre: string }
  | { ok: false; error: string };

export async function requireAuthenticatedCajero(
  supabase: SupabaseClient,
): Promise<CajeroResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "No se encontró una sesión de usuario activa." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nombre")
    .eq("id", user.id)
    .maybeSingle();

  const nombre = profile?.nombre?.trim();
  if (!nombre) {
    return {
      ok: false,
      error:
        "Tu usuario no tiene un perfil registrado. No se puede registrar el cobro.",
    };
  }

  return { ok: true, userId: user.id, nombre };
}
