import { Suspense } from "react";
import DetalleCreditoCliente from "@/components/(LaArada)/creditos/DetalleCreditoCliente";

export default function CreditoClientePage() {
  return (
    <Suspense>
      <DetalleCreditoCliente />
    </Suspense>
  );
}
