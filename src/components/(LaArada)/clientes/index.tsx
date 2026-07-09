"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
  Pencil,
} from "lucide-react";
import { useClients, useDeleteClient } from "./lib/hooks";
import ClientModal from "./modals/client-modal";
import ClientSalesModal from "./modals/client-sales-modal";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { showConfirm } from "@/lib/notifications";

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

  const handleEdit = (e: React.MouseEvent, client: any) => {
    e.stopPropagation();
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

  const handleDeleteClient = async (e: React.MouseEvent, client: any) => {
    e.stopPropagation();

    const result = await showConfirm({
      title: "¿Eliminar cliente?",
      html: `Se eliminará permanentemente a <strong>${client.nombre}</strong>. Esta acción no se puede deshacer.`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    await deleteMutation.mutateAsync(client.id);
  };

  return (
    <div className="p-4 md:px-15 w-full mx-auto space-y-6">
      {/* ENCABEZADO */}
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

      {/* BARRA DE HERRAMIENTAS: BUSCADOR IZQ - CONTROLES DER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
        {/* IZQUIERDA: BUSCADOR */}
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

        {/* DERECHA: SELECTOR + FLECHAS */}
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

      {/* TABLA DE CLIENTES */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] md:text-sm text-left table-fixed">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase tracking-widest">
              <tr>
                <th className="w-2/4 md:w-[35%] px-4 py-4 truncate">Nombre</th>
                <th className="w-1/4 md:w-[10%] px-4 py-4 truncate">NIT</th>
                <th className="hidden md:table-cell md:w-[25%] px-4 py-4 truncate">
                  Dirección
                </th>
                <th className="w-1/4 md:w-[10%] px-4 py-4 truncate">
                  Teléfono
                </th>
                <th className="hidden md:table-cell md:w-[20%] px-4 py-4 truncate">
                  Email
                </th>
                <th className="w-[10%] px-4 py-4 text-center">Ventas</th>
                <th className="w-[12%] px-4 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground italic"
                  >
                    Cargando clientes...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No hay resultados.
                  </td>
                </tr>
              ) : (
                currentItems.map((client: any) => (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-4 py-4 font-semibold uppercase truncate text-primary">
                      {client.nombre}
                    </td>
                    <td className="px-4 py-4 font-mono font-medium text-foreground/80 truncate">
                      {client.nit}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-muted-foreground truncate">
                      {client.direccion}
                    </td>
                    <td className="px-4 py-4 font-medium truncate">
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
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientForSales(client);
                          setIsSalesModalOpen(true);
                        }}
                        className="p-2 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 rounded-lg transition-colors cursor-pointer inline-flex"
                        title="Ver ventas"
                      >
                        <ShoppingCart className="size-4" />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleEdit(e, client)}
                          className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer inline-flex"
                          title="Editar cliente"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {canDeleteClient && (
                          <button
                            onClick={(e) => handleDeleteClient(e, client)}
                            disabled={deleteMutation.isPending}
                            className="p-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer inline-flex disabled:opacity-50"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
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
