"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useClients,
  useDeleteClient,
  getClientDeletionPreview,
} from "./lib/hooks";
import ClientModal from "./modals/client-modal";
import ClientSalesModal from "./modals/client-sales-modal";
import ClientRowActions from "./components/client-row-actions";
import { useUser } from "@/components/(base)/providers/UserProvider";
import {
  showConfirm,
  showReassignClientDialog,
  showAlert,
} from "@/lib/notifications";

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
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredClientes = clientes.filter(
    (client: any) =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.nit.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalItems = filteredClientes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

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
            ? `<p class="text-xs mt-3 opacity-80">Se desvincularán <strong>${preview.annulledCount}</strong> venta(s) anulada(s) del cliente.</p>`
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
          `El cliente tiene ${preview.activeCount} venta(s) activa(s) y no hay otro cliente al cual reasignarlas.`,
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

  return (
    <div className="p-4 md:px-15 w-full mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="size-5 md:size-6 text-primary" />
            Cartera de Clientes
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Gestiona la información de tus clientes.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer active:scale-95 w-full sm:w-auto text-xs md:text-sm"
        >
          <Plus className="size-4" />
          NUEVO CLIENTE
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:w-72 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent outline-none text-xs md:text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-background border rounded-lg px-2 py-2 text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer h-9.5 w-20 text-center"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={100000}>Todos</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || totalItems === 0}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalItems === 0}
              className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left md:table-fixed min-w-[320px]">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase tracking-widest text-[10px] md:text-xs">
              <tr>
                <th className="px-3 md:px-4 py-3 md:py-4 min-w-0">Nombre</th>
                <th className="px-2 md:px-4 py-3 md:py-4 w-20 md:w-[10%]">
                  NIT
                </th>
                <th className="hidden md:table-cell md:w-[25%] px-4 py-4">
                  Dirección
                </th>
                <th className="hidden sm:table-cell px-2 md:px-4 py-3 md:py-4 w-24 md:w-[12%]">
                  Teléfono
                </th>
                <th className="hidden md:table-cell md:w-[18%] px-4 py-4">
                  Email
                </th>
                <th className="w-12 md:w-[8%] px-1 md:px-4 py-3 md:py-4 text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
