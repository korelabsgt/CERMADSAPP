import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/(base)/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";

  if (role === "user") {
    redirect("/cermadsa/laarada/ventas");
  }

  return <Dashboard />;
}
