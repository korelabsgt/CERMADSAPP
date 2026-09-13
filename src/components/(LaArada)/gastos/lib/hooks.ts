"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  getGastos,
  getGastosCategorias,
  createGasto,
  createGastoCategoria,
  updateGasto,
  deleteGasto,
} from "./actions";
import { GastoFormValues } from "./zod";
import { toast } from "react-toastify";

export function useGastos() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let timeoutId: NodeJS.Timeout;

    const invalidate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
      }, 500);
    };

    const channel = supabase
      .channel("realtime-arada-gastos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arada_gastos" },
        invalidate,
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["gastos"],
    queryFn: getGastos,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

export function useGastosCategorias() {
  return useQuery({
    queryKey: ["gastos-categorias"],
    queryFn: getGastosCategorias,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateGastoCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoria: string) => createGastoCategoria(categoria),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Categoría añadida exitosamente");
        queryClient.invalidateQueries({ queryKey: ["gastos-categorias"] });
      }
    },
    onError: (err: any) => {
      toast.error(`Error inesperado: ${err.message}`);
    },
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GastoFormValues) => createGasto(data),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success("Gasto registrado exitosamente");
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
      }
    },
    onError: (err: any) => {
      toast.error(`Error inesperado: ${err.message}`);
    },
  });
}

export function useUpdateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GastoFormValues }) =>
      updateGasto(id, data),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success("Gasto actualizado exitosamente");
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
      }
    },
    onError: (err: any) => {
      toast.error(`Error inesperado: ${err.message}`);
    },
  });
}

export function useDeleteGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGasto(id),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success("Gasto eliminado");
        queryClient.invalidateQueries({ queryKey: ["gastos"] });
      }
    },
    onError: (err: any) => {
      toast.error(`Error inesperado: ${err.message}`);
    },
  });
}
