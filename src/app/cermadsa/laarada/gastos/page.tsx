import { Suspense } from "react";
import Gastos from "@/components/(LaArada)/gastos";

export default function GastosPage() {
  return (
    <Suspense>
      <Gastos />
    </Suspense>
  );
}
