"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deleteDocument, getDocumentFileUrl, getDocuments } from "@/lib/api";
import {
  DOCUMENT_STATE_OPTIONS,
  getDocumentFileLabel,
  getDocumentStateClasses,
  getDocumentStateLabel,
  getDocumentSummary,
  getDocumentTypeLabel,
} from "@/lib/document.utils";
import { Document, DocumentState } from "@/types/api.types";
import AddContractForm from "./AddContractForm";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const FILTER_OPTIONS: Array<{ value: "all" | DocumentState; label: string }> = [
  { value: "all", label: "Todos" },
  ...DOCUMENT_STATE_OPTIONS,
];

const getServiceCountLabel = (count: number): string => {
  if (count === 0) {
    return "Sin servicios";
  }

  return `${count} servicio${count === 1 ? "" : "s"}`;
};

export default function ContractsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [contracts, setContracts] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | DocumentState>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openedFromQuery, setOpenedFromQuery] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Document | null>(null);

  useEffect(() => {
    void loadContracts();
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
    setContracts((prev) => prev.map((contract) => (contract.id === updatedContract.id ? updatedContract : contract)));
  };

  const closeForm = () => {
    setShowForm(false);
    if (openedFromQuery) {
      router.replace(pathname);
      setOpenedFromQuery(false);
    }
  };

  const filteredContracts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return contracts.filter((contract) => {
      const matchesFilter = filter === "all" || contract.state === filter;
      const matchesSearch =
        searchTerm.length === 0 ||
        contract.id.toString().includes(searchTerm) ||
        contract.name.toLowerCase().includes(searchTerm) ||
        contract.client.toLowerCase().includes(searchTerm) ||
        (contract.file_name ?? "").toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    });
  }, [contracts, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleView = async (contract: Document) => {
    try {
      const signedUrl = await getDocumentFileUrl(contract.id);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error al abrir documento:", err);
      alert(err instanceof Error ? err.message : "No se pudo abrir el documento");
    }
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
    if (!contractToDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDocument(contractToDelete.id);
      setContracts((prev) => prev.filter((contract) => contract.id !== contractToDelete.id));
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
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-lg text-gray-500">Cargando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{error}</p>
        <button
          onClick={loadContracts}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Gestión de Contratos</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filteredContracts.length} contrato{filteredContracts.length !== 1 ? "s" : ""} encontrado
            {filteredContracts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Contrato
        </button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeForm}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeForm}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <X className="h-5 w-5" />
            </button>

            <AddContractForm onAdd={addContract} onClose={closeForm} />
          </div>
        </div>
      )}

      {showEditForm && contractToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowEditForm(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEditForm(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <X className="h-5 w-5" />
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

      {showDeleteModal && contractToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-800">¿Eliminar contrato?</h3>
              <p className="mb-6 text-sm text-slate-500">
                Estás a punto de eliminar el contrato <span className="font-medium text-slate-700">{contractToDelete.name}</span>.
                Esta acción no se puede deshacer.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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

      <div className="mb-4 flex-shrink-0 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="text"
            placeholder="Buscar por contrato, cliente o archivo..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 lg:max-w-md"
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === option.value ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Contrato</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Inicio</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Vencimiento</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Archivo</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Servicios</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedContracts.map((contract, index) => {
                const summary = getDocumentSummary(contract);
                const fileLabel = getDocumentFileLabel(contract);

                return (
                  <tr
                    key={contract.id}
                    className={`group transition-colors hover:bg-blue-50/50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{contract.id}</td>
                    <td className="px-4 py-3">
                      <span className="block font-medium text-slate-800">{contract.name}</span>
                      {summary && <span className="mt-1 block truncate text-xs text-slate-500">{summary}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{contract.client}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {getDocumentTypeLabel(contract.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{contract.start_date}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{contract.end_date}</td>
                    <td className="px-4 py-3">
                      <span className={`block truncate text-sm ${contract.file_name ? "text-slate-700" : "text-slate-400"}`}>
                        {fileLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {contract.service_items.length}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-500">{getServiceCountLabel(contract.service_items.length)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getDocumentStateClasses(contract.state)}`}>
                        {getDocumentStateLabel(contract.state)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(contract)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(contract)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(contract)}
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedContracts.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="font-medium text-slate-500">No se encontraron contratos</p>
                      <p className="mt-1 text-sm text-slate-400">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredContracts.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>
                Mostrando <span className="font-medium text-slate-800">{startIndex + 1}</span>
                {" - "}
                <span className="font-medium text-slate-800">{Math.min(endIndex, filteredContracts.length)}</span> de{" "}
                <span className="font-medium text-slate-800">{filteredContracts.length}</span>
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
                  {[5, 9, 10, 15, 20].map((rows) => (
                    <option key={rows} value={rows}>
                      {rows}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="mx-2 flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, array) => (
                    <span key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => goToPage(page)}
                        className={`h-9 min-w-[2.25rem] rounded-lg text-sm font-medium transition-all ${
                          currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200/60"
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
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
