"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  getResumenPreventas,
  getClientesLista,
  getSaldoCliente,
  getMovimientosCliente,
  getClientePreventaBySlug,
  getProductosPreventa,
  crearPreventa,
  certificarPreventaExistente,
  anularFacturaPreventa,
  aplicarPreventa,
  actualizarComprobantePreventa,
  editarCargaPreventa,
  eliminarMovimientoPreventa,
  eliminarPreventaCliente,
} from "./actions";
import {
  PreventaFormValues,
  AnularFacturaPreventaValues,
  CertificarPreventaValues,
  AplicarPreventaValues,
  ActualizarComprobantePreventaValues,
  EditarCargaPreventaValues,
  EliminarMovimientoPreventaValues,
  EliminarPreventaClienteValues,
  ReciboPreventa,
} from "./zod";

export function useResumenPreventas() {
  return useQuery({
    queryKey: ["preventas", "resumen"],
    queryFn: getResumenPreventas,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

export function useClientePreventaBySlug(slug: string) {
  return useQuery({
    queryKey: ["preventas", "cliente", slug],
    queryFn: () => getClientePreventaBySlug(slug),
    enabled: !!slug,
  });
}

export function useClientesLista() {
  return useQuery({
    queryKey: ["preventas", "clientes"],
    queryFn: getClientesLista,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProductosPreventa(enabled = true) {
  return useQuery({
    queryKey: ["preventas", "productos"],
    queryFn: getProductosPreventa,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

export function useSaldoCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["preventas", "saldo", clienteId],
    queryFn: () => (clienteId ? getSaldoCliente(clienteId) : 0),
    enabled: !!clienteId,
  });
}

export function useMovimientosCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["preventas", "movimientos", clienteId],
    queryFn: () => (clienteId ? getMovimientosCliente(clienteId) : []),
    enabled: !!clienteId,
  });
}

export function useCrearPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PreventaFormValues) => crearPreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success(
        res.recibo.dte
          ? "Saldo cargado y factura certificada ante la SAT."
          : "Saldo cargado correctamente.",
      );
    },
    onError: () => toast.error("No se pudo cargar el saldo."),
  });
}

export function useCertificarPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificarPreventaValues) =>
      certificarPreventaExistente(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success("Factura certificada ante la SAT.");
    },
    onError: () => toast.error("No se pudo certificar la factura."),
  });
}

export function useAnularFacturaPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnularFacturaPreventaValues) =>
      anularFacturaPreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success(
        res.extemporanea
          ? "Solicitud enviada. La SAT puede tardar en autorizar esta anulación extemporánea."
          : "Factura anulada ante la SAT. Puede emitir una factura nueva.",
      );
    },
    onError: () => toast.error("No se pudo anular la factura."),
  });
}

export function useAplicarPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AplicarPreventaValues) => aplicarPreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
    },
    onError: () => toast.error("No se pudo aplicar la preventa."),
  });
}

export function useActualizarComprobantePreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ActualizarComprobantePreventaValues) =>
      actualizarComprobantePreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success("Comprobante guardado.");
    },
    onError: () => toast.error("No se pudo guardar el comprobante."),
  });
}

export function useEditarCargaPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EditarCargaPreventaValues) => editarCargaPreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success("Carga actualizada.");
    },
    onError: () => toast.error("No se pudo actualizar la carga."),
  });
}

export function useEliminarMovimientoPreventa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EliminarMovimientoPreventaValues) =>
      eliminarMovimientoPreventa(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success("Movimiento eliminado.");
    },
    onError: () => toast.error("No se pudo eliminar el movimiento."),
  });
}

export function useEliminarPreventaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EliminarPreventaClienteValues) =>
      eliminarPreventaCliente(data),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      toast.success("Registro de preventa eliminado.");
    },
    onError: () => toast.error("No se pudo eliminar la preventa del cliente."),
  });
}

export type { ReciboPreventa };
