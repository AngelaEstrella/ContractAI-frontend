import { X } from "lucide-react";
import type { GooglePickerFile } from "@/lib/googlePicker";
import { getDriveItemTypeLabel } from "@/features/contracts/lib/contracts-utils";
import { GoogleDriveIcon } from "./GoogleDriveIcon";

type ContractsDriveSelectionProps = {
  activeFolderName: string;
  isOpeningDrivePicker: boolean;
  onClearSelection: () => void;
  onRemoveFile: (fileId: string) => void;
  onSelectMore: () => void;
  selectedFiles: GooglePickerFile[];
};

export function ContractsDriveSelection({
  activeFolderName,
  isOpeningDrivePicker,
  onClearSelection,
  onRemoveFile,
  onSelectMore,
  selectedFiles,
}: ContractsDriveSelectionProps) {
  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
            <GoogleDriveIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Seleccion actual de Google Drive</h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedFiles.length} elemento{selectedFiles.length === 1 ? "" : "s"} seleccionado
              {selectedFiles.length === 1 ? "" : "s"} para la carpeta {activeFolderName}.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Ya puedes navegar Drive y escoger archivos; la importacion al backend sera la siguiente fase.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSelectMore}
            disabled={isOpeningDrivePicker}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
          >
            Seleccionar mas
          </button>
          <button
            onClick={onClearSelection}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Limpiar seleccion
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {selectedFiles.map((file) => (
          <article key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                <p className="mt-1 text-xs text-slate-500">ID: {file.id}</p>
              </div>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Quitar de la seleccion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                {getDriveItemTypeLabel(file.mimeType)}
              </span>
              {file.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Abrir en Drive
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
