import { Suspense } from "react";
import PreventaCliente from "@/components/(LaArada)/preventas/PreventaCliente";

export default async function PreventaClientePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <Suspense>
      <PreventaCliente slug={decodeURIComponent(slug)} />
    </Suspense>
  );
}
