"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CreditCard } from "lucide-react";
import { useCreditos } from "./lib/hooks";
import { findClienteBySlug } from "./lib/slug";
import { VentaCredito } from "./lib/zod";
import DetalleCreditoModal from "./modals/detalle-credito-modal";
import ReciboAbonoPrint from "./components/recibo-abono-print";

export default function DetalleCreditoCliente() {
  const params = useParams<{ clienteSlug: string }>();
  const router = useRouter();
  const slug = params?.clienteSlug ?? "";
  const { clientesConCredito, creditosTotales, isLoading } = useCreditos();

  const cliente = useMemo(
    () => findClienteBySlug(slug, clientesConCredito),
    [slug, clientesConCredito],
  );

  const ventasCliente = useMemo(() => {
    if (!cliente) return [];
    return (creditosTotales as VentaCredito[]).filter(
      (v) => v.cliente_id === cliente.cliente_id,
    );
  }, [cliente, creditosTotales]);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="size-8 animate-spin text-red-500" />
        <p className="font-bold uppercase tracking-widest text-sm">
          Cargando crédito...
        </p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
        <CreditCard className="size-12 text-muted-foreground opacity-30" />
        <p className="font-bold uppercase tracking-widest text-sm text-muted-foreground">
          No se encontró el cliente
        </p>
        <button
          type="button"
          onClick={() => router.push("/cermadsa/laarada/creditos")}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-600 px-6 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-sky-700 cursor-pointer"
        >
          Volver a créditos
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto">
      <DetalleCreditoModal cliente={cliente} ventasCliente={ventasCliente} />
      <ReciboAbonoPrint />
    </div>
  );
}
