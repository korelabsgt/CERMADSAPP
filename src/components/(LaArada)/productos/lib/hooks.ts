import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./actions";
import { ProductFormValues } from "./zod";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

interface ActionResponse {
  success?: boolean;
  error?: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ["productos"],
    queryFn: () => getProducts(),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
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

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: (data: ProductFormValues) => createProduct(data),
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
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      Swal.fire({ ...config, icon: "success", title: "Producto creado" });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error de conexión",
        text: error.message,
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormValues }) =>
      updateProduct(id, data),
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
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      Swal.fire({ ...config, icon: "success", title: "Producto actualizado" });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error de conexión",
        text: error.message,
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (res: ActionResponse) => {
      if (res.error) {
        Swal.fire({
          ...config,
          icon: "error",
          title: "Error",
          text: res.error,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      Swal.fire({ ...config, icon: "success", title: "Producto eliminado" });
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
