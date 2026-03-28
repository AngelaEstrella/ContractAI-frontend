"use client";

import { useEffect } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import { getDocumentFileLabel, getDocumentTypeLabel } from "@/lib/document.utils";
import type { Document } from "@/types/api.types";

type ContractPreviewModalProps = {
  contract: Document | null;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onOpenInNewTab: () => void;
  open: boolean;
  previewUrl: string | null;
};

export function ContractPreviewModal({
  contract,
  error,
  loading,
  onClose,
  onOpenInNewTab,
  open,
  previewUrl,
}: ContractPreviewModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !contract) {
    return null;
  }

  const fileLabel = getDocumentFileLabel(contract);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:max-h-[960px] sm:max-w-6xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/80 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">PDF</span>
              <span>{getDocumentTypeLabel(contract.type)}</span>
            </div>
            <h3 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{contract.name}</h3>
            <p className="mt-1 flex items-center gap-2 truncate text-sm text-slate-500">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{fileLabel}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInNewTab}
              disabled={!previewUrl}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Abrir aparte</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              title="Cerrar vista previa"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <div>
                <p className="text-base font-medium text-slate-800">Preparando vista previa...</p>
                <p className="mt-1 text-sm text-slate-500">Estamos generando un acceso temporal seguro al archivo.</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
              <p className="max-w-md text-sm text-slate-500">
                No fue posible cargar la vista previa embebida. Puedes cerrar esta ventana e intentar nuevamente.
              </p>
            </div>
          ) : previewUrl ? (
            <div className="flex h-full min-h-0 flex-col p-3 sm:p-4">
              <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner">
                <iframe
                  key={previewUrl}
                  title={`Vista previa de ${contract.name}`}
                  src={previewUrl}
                  className="h-full min-h-0 w-full bg-white"
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Si el PDF no se muestra correctamente en tu navegador, usa &quot;Abrir aparte&quot; para verlo en una
                pestaña nueva.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
