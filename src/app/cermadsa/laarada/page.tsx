import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardLaArada from "@/components/(LaArada)/dashboard";

export default async function LaAradaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";

  if (role === "user") {
    redirect("/cermadsa/laarada/ventas");
  }

  return (
    <Suspense>
      <DashboardLaArada />
    </Suspense>
  );
}
