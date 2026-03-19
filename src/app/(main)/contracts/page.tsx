"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getDocuments, deleteDocument } from "@/lib/api";
import { Document } from "@/types/api.types";
import AddContractForm from "./AddContractForm";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle } from "lucide-react";

export default function ContractsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [contracts, setContracts] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openedFromQuery, setOpenedFromQuery] = useState(false);

  // Paginación - cambiado a 8 por defecto
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Modal de confirmación para eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de edición
  const [showEditForm, setShowEditForm] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Document | null>(null);

  // Cargar contratos al montar el componente
  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setShowForm(true);
      setOpenedFromQuery(true);
    }
  }, []);

  // Resetear a página 1 cuando cambia el filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  };

  const addContract = (newContract: Document) => {
    setContracts((prev) => [...prev, newContract]);
  };

  const updateContract = (updatedContract: Document) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );
  };

  const closeForm = () => {
    setShowForm(false);
    if (openedFromQuery) {
      router.replace(pathname);
      setOpenedFromQuery(false);
    }
  };

  // Filtrado
  const filtered = contracts.filter((c) => {
  const matchFilter = filter === "all" || c.state === filter;
  const matchSearch =
    c.id.toString().includes(search) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client.toLowerCase().includes(search.toLowerCase());

  return matchFilter && matchSearch;
});

  // Cálculos de paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // Navegación de páginas
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "ACTIVO":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      case "POR_VENCER":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
      case "EXPIRADO":
        return "bg-red-50 text-red-700 ring-1 ring-red-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "ACTIVO":
        return "Activo";
      case "POR_VENCER":
        return "Por vencer";
      case "EXPIRADO":
        return "Expirado";
      default:
        return status;
    }
  };

  // Handlers de acciones
  const handleView = (contract: Document) => {
    router.push(`/contracts/${contract.id}`);
  };

  const handleEdit = (contract: Document) => {
    setContractToEdit(contract);
    setShowEditForm(true);
  };

  const handleDeleteClick = (contract: Document) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;

    try {
      setDeleting(true);
      await deleteDocument(contractToDelete.id);
      setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
      setShowDeleteModal(false);
      setContractToDelete(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar el contrato");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-lg">Cargando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadContracts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-shrink-0 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Gestión de Contratos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} contrato{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Contrato
        </button>
      </div>

      {/* MODAL NUEVO CONTRATO */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeForm}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <AddContractForm onAdd={addContract} onClose={closeForm} />
          </div>
        </div>
      )}

      {/* MODAL EDITAR CONTRATO */}
      {showEditForm && contractToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEditForm(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <AddContractForm
              onAdd={updateContract}
              onClose={() => {
                setShowEditForm(false);
                setContractToEdit(null);
              }}
              editMode
              initialData={contractToEdit}
            />
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {showDeleteModal && contractToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                ¿Eliminar contrato?
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Estás a punto de eliminar el contrato{" "}
                <span className="font-medium text-slate-700">{contractToDelete.name}</span>.
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSCADOR Y FILTROS */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200/60 flex-shrink-0 mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="text"
            placeholder="Buscar por contrato o cliente..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 lg:max-w-md"
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            {["all", "ACTIVO", "POR_VENCER", "EXPIRADO"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Todos" : statusLabel(f)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLA - Se ajusta al contenido */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200/60 flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
              </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contrato</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Inicio</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Vencimiento</th>
                <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Valor</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Licencias</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((c, index) => (
                <tr
                  key={c.id}
                  className={`group transition-colors hover:bg-blue-50/50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.client}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{c.start_date}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{c.end_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 tabular-nums">
                    {c.currency} {c.value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {c.licenses}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(
                        c.state
                      )}`}
                    >
                      {statusLabel(c.state)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleView(c)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-7 h-7 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium">No se encontraron contratos</p>
                      <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-4 py-3">
            {/* Info y selector de items por página */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>
                Mostrando{" "}
                <span className="font-medium text-slate-800">{startIndex + 1}</span>
                {" - "}
                <span className="font-medium text-slate-800">
                  {Math.min(endIndex, filtered.length)}
                </span>{" "}
                de <span className="font-medium text-slate-800">{filtered.length}</span>
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-slate-500">
                  Filas:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {[5, 9, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Números de página */}
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <span key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-1 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`min-w-[2.25rem] h-9 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}