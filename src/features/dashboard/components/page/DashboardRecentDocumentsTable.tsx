import Link from "next/link";
import { ChevronLeft, ChevronRight, Ellipsis, FileText } from "lucide-react";
import {
  getDashboardDocumentStateClasses,
  getDocumentStateLabel,
} from "@/lib/document.utils";
import type { RecentDashboardDocument } from "@/features/dashboard/lib/dashboard-data";

type DashboardRecentDocumentsTableProps = {
  currentPage: number;
  documents: RecentDashboardDocument[];
  endIndex: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  startIndex: number;
  totalPages: number;
  totalRecords: number;
};

export function DashboardRecentDocumentsTable({
  currentPage,
  documents,
  endIndex,
  isLoading,
  onPageChange,
  startIndex,
  totalPages,
  totalRecords,
}: DashboardRecentDocumentsTableProps) {
  return (
    <article className="flex flex-col rounded-2xl bg-white shadow-md xl:col-span-8">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-800">Contratos recientes</h2>
        <p className="mt-1 text-sm text-[var(--gray-medium)]">
          Ultimas actualizaciones registradas en tus contratos.
        </p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col className="w-[52%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--gray-medium)]">
              <th className="px-6 py-4 font-medium">Nombre del documento</th>
              <th className="px-6 py-4 text-center font-medium">Estado</th>
              <th className="px-6 py-4 text-center font-medium">Ultima modificacion</th>
              <th className="px-6 py-4 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-6 py-6 text-sm text-[var(--gray-medium)]" colSpan={4}>
                  Cargando documentos...
                </td>
              </tr>
            )}
            {!isLoading && documents.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-sm text-[var(--gray-medium)]" colSpan={4}>
                  No hay documentos disponibles.
                </td>
              </tr>
            )}
            {!isLoading &&
              documents.map((document) => (
                <tr key={document.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{document.name}</p>
                        <p className="mt-1 truncate text-xs text-[var(--gray-medium)]">
                          {document.subtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getDashboardDocumentStateClasses(
                        document.status,
                      )}`}
                    >
                      {getDocumentStateLabel(document.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center align-middle text-sm text-[var(--gray-medium)]">
                    <span className="whitespace-nowrap">{document.modified}</span>
                  </td>
                  <td className="px-6 py-4 text-right align-middle">
                    <Link
                      href="/contracts"
                      className="inline-flex rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Ellipsis className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && totalRecords > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <span className="text-sm text-slate-500">
            Mostrando <span className="font-medium text-slate-700">{startIndex + 1}</span>
            {" - "}
            <span className="font-medium text-slate-700">{Math.min(endIndex, totalRecords)}</span> de{" "}
            <span className="font-medium text-slate-700">{totalRecords}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`h-8 min-w-[2rem] rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
