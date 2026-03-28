import { LoaderCircle, Upload, X } from "lucide-react";
import type { GooglePickerFile } from "@/lib/googlePicker";
import { getDriveItemTypeLabel, isDriveFolder } from "@/features/contracts/lib/contracts-utils";
import { GoogleDriveIcon } from "./GoogleDriveIcon";

type ContractsDriveSelectionProps = {
  activeFolderName: string;
  isImportingDriveFiles: boolean;
  isOpeningDrivePicker: boolean;
  onClearSelection: () => void;
  onImportSelection: () => void;
  onRemoveFile: (fileId: string) => void;
  onSelectMore: () => void;
  selectedFiles: GooglePickerFile[];
};

export function ContractsDriveSelection({
  activeFolderName,
  isImportingDriveFiles,
  isOpeningDrivePicker,
  onClearSelection,
  onImportSelection,
  onRemoveFile,
  onSelectMore,
  selectedFiles,
}: ContractsDriveSelectionProps) {
  if (selectedFiles.length === 0) {
    return null;
  }

  const importableFiles = selectedFiles.filter((file) => !isDriveFolder(file));
  const skippedFolders = selectedFiles.length - importableFiles.length;
  const isBusy = isOpeningDrivePicker || isImportingDriveFiles;

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
               Puedes enviar los archivos seleccionados al backend para procesarlos en segundo plano.
             </p>
             {skippedFolders > 0 && (
               <p className="mt-2 text-xs text-amber-600">
                 {skippedFolders} carpeta{skippedFolders === 1 ? "" : "s"} no se importara
                 {skippedFolders === 1 ? "" : "n"}; solo se enviaran archivos.
               </p>
             )}
           </div>
         </div>

         <div className="flex flex-wrap items-center gap-2">
           <button
             onClick={onImportSelection}
             disabled={isBusy || importableFiles.length === 0}
             className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
           >
             {isImportingDriveFiles ? (
               <LoaderCircle className="h-4 w-4 animate-spin" />
             ) : (
               <Upload className="h-4 w-4" />
             )}
             {isImportingDriveFiles ? "Subiendo..." : "Subir archivos"}
           </button>
           <button
             onClick={onSelectMore}
             disabled={isBusy}
             className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
           >
             Seleccionar mas
           </button>
           <button
             onClick={onClearSelection}
             disabled={isBusy}
             className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
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
                disabled={isBusy}
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
