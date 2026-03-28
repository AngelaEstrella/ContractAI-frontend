import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getDocumentFileLabel,
  getDocumentStateClasses,
  getDocumentStateLabel,
  getDocumentTypeLabel,
} from "@/lib/document.utils";
import { getServiceCountLabel, getVisiblePageNumbers } from "@/features/contracts/lib/contracts-utils";
import type { Document } from "@/types/api.types";

type ContractsTableProps = {
  contracts: Document[];
  currentPage: number;
  filteredCount: number;
  itemsPerPage: number;
  onDelete: (contract: Document) => void;
  onEdit: (contract: Document) => void;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
  onView: (contract: Document) => void;
  startIndex: number;
  totalPages: number;
};

export function ContractsTable({
  contracts,
  currentPage,
  filteredCount,
  itemsPerPage,
  onDelete,
  onEdit,
  onItemsPerPageChange,
  onPageChange,
  onView,
  startIndex,
  totalPages,
}: ContractsTableProps) {
  const visiblePageNumbers = getVisiblePageNumbers(currentPage, totalPages);

  return (
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
            {contracts.map((contract, index) => {
              const fileLabel = getDocumentFileLabel(contract);

              return (
                <tr
                  key={contract.id}
                  className={`group transition-colors hover:bg-blue-50/50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{contract.id}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-slate-800">{contract.name}</span>
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
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {getServiceCountLabel(contract.service_items.length)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getDocumentStateClasses(contract.state)}`}>
                      {getDocumentStateLabel(contract.state)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onView(contract)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                        title="Vista previa"
                        aria-label={`Vista previa de ${contract.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(contract)}
                        className="rounded-lg p-2 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(contract)}
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

            {contracts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-medium text-slate-500">No se encontraron contratos</p>
                    <p className="mt-1 text-sm text-slate-400">Intenta ajustar los filtros de busqueda</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredCount > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              Mostrando <span className="font-medium text-slate-800">{startIndex + 1}</span>
              {" - "}
              <span className="font-medium text-slate-800">{Math.min(startIndex + itemsPerPage, filteredCount)}</span> de{" "}
              <span className="font-medium text-slate-800">{filteredCount}</span>
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-slate-500">
                Filas:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
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
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Primera pagina"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="mx-2 flex items-center gap-1">
              {visiblePageNumbers.map((page, index) => (
                <span key={page} className="flex items-center">
                  {index > 0 && visiblePageNumbers[index - 1] !== page - 1 && (
                    <span className="px-1 text-slate-400">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`h-9 min-w-[2.25rem] rounded-lg text-sm font-medium transition-all ${
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
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Pagina siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-200/60 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Ultima pagina"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
