"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  useClients,
  useDeleteClient,
  getClientDeletionPreview,
} from "./lib/hooks";
import ClientModal from "./modals/client-modal";
import ClientSalesModal from "./modals/client-sales-modal";
import ClientRowActions from "./components/client-row-actions";
import { ClientesSkeleton } from "./clientes-skeleton";
import { useUser } from "@/components/(base)/providers/UserProvider";
import TablePagination, { PageSizeOption } from "@/components/(LaArada)/lib/pagination";
import {
  showConfirm,
  showReassignClientDialog,
  showAlert,
} from "@/lib/notifications";
import {
  getAnnulledSalesUnlinkMessage,
  getActiveSalesNoCandidatesError,
} from "@/utils/client-delete-messages";

export default function ListadoClientes() {
  const { data: clientes = [], isLoading } = useClients();
  const deleteMutation = useDeleteClient();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const userRole = (metadata.rol || user?.role || "user") as string;
  const canDeleteClient = userRole === "super" || userRole === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [clientForSales, setClientForSales] = useState<any>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(15);

  const filteredClientes = clientes.filter(
    (client: any) =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nit.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalItems = filteredClientes.length;
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(totalItems / (Number(pageSize) || 15)));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentItems =
    pageSize === "all"
      ? filteredClientes
      : filteredClientes.slice(
          (safeCurrentPage - 1) * (Number(pageSize) || 15),
          safeCurrentPage * (Number(pageSize) || 15),
        );

  const resetPage = () => setCurrentPage(1);

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleViewSales = (client: any) => {
    setClientForSales(client);
    setIsSalesModalOpen(true);
  };

  const handleDeleteClient = async (client: any) => {
    setDeletingClientId(client.id);

    try {
      const preview = await getClientDeletionPreview(client.id);

      if (preview.error) {
        await showAlert("error", "No se puede eliminar", preview.error);
        return;
      }

      if (preview.canDeleteDirectly) {
        const annulledNote =
          preview.annulledCount > 0
            ? `<p class="text-xs mt-3 opacity-80">${getAnnulledSalesUnlinkMessage(preview.annulledCount ?? 0)}</p>`
            : "";

        const result = await showConfirm({
          title: "¿Eliminar cliente?",
          html: `Se eliminará permanentemente a <strong>${client.nombre}</strong>. Esta acción no se puede deshacer.${annulledNote}`,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        await deleteMutation.mutateAsync({ id: client.id });
        return;
      }

      const candidates = clientes
        .filter((c: any) => c.id !== client.id)
        .map((c: any) => ({
          id: c.id,
          label: `${c.nombre} (${c.nit})`,
        }));

      if (candidates.length === 0) {
        await showAlert(
          "error",
          "No se puede eliminar",
          getActiveSalesNoCandidatesError(preview.activeCount ?? 0),
        );
        return;
      }

      const result = await showReassignClientDialog({
        clientName: client.nombre,
        activeCount: preview.activeCount ?? 0,
        annulledCount: preview.annulledCount ?? 0,
        candidates,
      });

      if (!result.isConfirmed || !result.value) return;

      await deleteMutation.mutateAsync({
        id: client.id,
        reassignToClientId: String(result.value),
      });
    } finally {
      setDeletingClientId(null);
    }
  };

  if (isLoading) {
    return <ClientesSkeleton />;
  }

  return (
    <div className="mx-auto w-full space-y-4 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="mb-2 flex items-start justify-between gap-4">
        <Link
          href="/cermadsa/laarada"
          className="group inline-flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Volver
          </span>
        </Link>
        <div className="min-w-0 text-right">
          <h1 className="text-base md:text-xl font-black uppercase tracking-tight text-foreground flex items-center justify-end gap-2">
            <Users className="size-5 text-blue-600 dark:text-blue-400" />
            Cartera de Clientes
          </h1>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold">
          <span className="text-foreground">Total: </span>
          <span className="text-zinc-600 dark:text-zinc-300">
            {totalItems}
          </span>
        </p>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-blue-600 bg-white shadow-sm dark:border-zinc-700 dark:border-t-blue-500 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-700 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente, NIT, teléfono..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-100 px-5 text-xs font-bold uppercase text-blue-600 transition-colors hover:bg-blue-200 cursor-pointer dark:border-blue-400 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
            >
              <Plus className="size-4" />
              NUEVO CLIENTE
            </button>
          </div>

          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full text-xs md:text-sm text-left md:table-fixed min-w-[320px]">
              <thead className="border-b border-zinc-200 bg-zinc-50 font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                <tr>
                  <th className="px-3 md:px-4 py-3 min-w-0">Nombre</th>
                  <th className="px-2 md:px-4 py-3 w-24 md:w-[12%]">NIT</th>
                  <th className="hidden md:table-cell md:w-[25%] px-4 py-3">Dirección</th>
                  <th className="hidden sm:table-cell px-2 md:px-4 py-3 w-28 md:w-[14%]">Teléfono</th>
                  <th className="hidden md:table-cell md:w-[18%] px-4 py-3">Email</th>
                  <th className="w-14 md:w-[10%] px-1 md:px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-muted-foreground italic"
                    >
                      Cargando clientes...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No hay resultados.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((client: any) => (
                    <tr
                      key={client.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-3 md:py-4 font-semibold uppercase truncate text-primary max-w-[120px] sm:max-w-none">
                        {client.nombre}
                      </td>
                      <td className="px-2 md:px-4 py-3 md:py-4 font-mono font-medium text-foreground/80 truncate">
                        {client.nit}
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-muted-foreground truncate">
                        {client.direccion}
                      </td>
                      <td className="hidden sm:table-cell px-2 md:px-4 py-3 md:py-4 font-medium truncate">
                        <a
                          href={`https://wa.me/502${client.telefono.replace(
                            /\s+/g,
                            "",
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 hover:underline font-bold"
                        >
                          {client.telefono}
                        </a>
                      </td>
                      <td className="hidden md:table-cell px-4 py-4 text-muted-foreground truncate lowercase">
                        {client.email || "-"}
                      </td>
                      <td className="px-1 md:px-4 py-3 md:py-4">
                        <ClientRowActions
                          canDelete={canDeleteClient}
                          isDeleting={deletingClientId === client.id}
                          onViewSales={() => handleViewSales(client)}
                          onEdit={() => handleEdit(client)}
                          onDelete={() => handleDeleteClient(client)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <TablePagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={selectedClient}
      />
      <ClientSalesModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        client={clientForSales}
      />
    </div>
  );
}
