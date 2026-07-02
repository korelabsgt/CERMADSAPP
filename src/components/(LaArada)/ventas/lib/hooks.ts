import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getVentas, createVenta, getCatalogos, updateVenta, updateVentaPago, getVendedores } from "./actions";
import { VentaFormValues, PagoVentaValues } from "./zod";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export function useVentas(vendedorId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let timeoutId: NodeJS.Timeout;

    const invalidate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ventas", vendedorId] });
      }, 500);
    };

    const channel = supabase
      .channel(`realtime-ventas-${vendedorId || 'all'}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ven_ventas" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ven_detalle" },
        invalidate,
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient, vendedorId]);

  return useQuery({
    queryKey: ["ventas", vendedorId],
    queryFn: () => getVentas(vendedorId),
    placeholderData: keepPreviousData,
  });
}

export function useVendedores() {
  return useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedores,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCatalogos() {
  return useQuery({
    queryKey: ["catalogos"],
    queryFn: getCatalogos,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VentaFormValues) => createVenta(data),
    onSuccess: (res) => {
      if (res?.error) {
        Swal.fire({ icon: "error", title: "Error", text: res.error });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
        queryClient.invalidateQueries({ queryKey: ["catalogos"] });
        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Venta creada correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    },
  });
}

export function useUpdateVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VentaFormValues }) =>
      updateVenta(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        Swal.fire({ icon: "error", title: "Error", text: res.error });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Venta actualizada correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    },
  });
}

export function useUpdateVentaPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PagoVentaValues }) =>
      updateVentaPago(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        toast.error(res.error, { theme: "colored", autoClose: 3000 });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
        toast.success("Forma de pago actualizada", {
          theme: "colored",
          autoClose: 2000,
        });
      }
    },
  });
}
