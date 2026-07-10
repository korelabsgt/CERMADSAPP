import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getClients,
  createClientAction,
  updateClientAction,
  deleteClientAction,
  getClientSalesAction,
  getClientDeletionPreview,
} from "./actions";
import { ClientFormValues } from "./zod";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

interface ActionResponse {
  success?: boolean;
  error?: string;
  code?: string;
  activeCount?: number;
  annulledCount?: number;
  canDeleteDirectly?: boolean;
}

export function useClients() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClients(),
    staleTime: 1000 * 60 * 5,
});
}

export function useClientSales(clientId: string | null) {
  return useQuery({
    queryKey: ["client_sales", clientId],
    queryFn: () => (clientId ? getClientSalesAction(clientId) : []),
    enabled: !!clientId,
  });
}

const useSwalConfig = () => {
  const { theme } = useTheme();
  return {
    background: theme === "dark" ? "#18181b" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#000000",
    toast: true,
    position: "top" as const,
    showConfirmButton: false,
    timer: 2000,
    customClass: {
      popup: theme === "dark" ? "border border-border" : "",
    },
  };
};

export function useCreateClient() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: (data: ClientFormValues) => createClientAction(data),
    onSuccess: (res: ActionResponse) => {
      if (res.error) {
        Swal.fire({
          ...config,
          icon: "error",
          title: "Error",
          text: res.error,
          timer: 4000,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      Swal.fire({ ...config, icon: "success", title: "Cliente creado" });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error",
        text: error.message,
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormValues }) =>
      updateClientAction(id, data),
    onSuccess: (res: ActionResponse) => {
      if (res.error) {
        Swal.fire({
          ...config,
          icon: "error",
          title: "Error",
          text: res.error,
          timer: 4000,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      Swal.fire({ ...config, icon: "success", title: "Cliente actualizado" });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error",
        text: error.message,
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: ({
      id,
      reassignToClientId,
    }: {
      id: string;
      reassignToClientId?: string;
    }) => deleteClientAction(id, reassignToClientId),
    onSuccess: (res: ActionResponse) => {
      if (res.error) {
        Swal.fire({
          ...config,
          icon: "error",
          title: "No se pudo eliminar",
          text: res.error,
          timer: 5000,
          showConfirmButton: true,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["creditos"] });
      Swal.fire({ ...config, icon: "success", title: "Cliente eliminado" });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error",
        text: error.message,
        showConfirmButton: true,
      });
    },
  });
}

export { getClientDeletionPreview };
