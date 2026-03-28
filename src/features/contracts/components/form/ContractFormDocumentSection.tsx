import { Upload, X } from "lucide-react";
import { getFileTypeBadge } from "@/features/contracts/lib/contract-form.utils";
import type { Document } from "@/types/api.types";

type ContractFormDocumentSectionProps = {
  dragActive: boolean;
  editMode: boolean;
  error: string | null;
  file: File | null;
  fileError: boolean;
  hasValidFile: boolean;
  initialData?: Document;
  keepOriginalFile: boolean;
  onDisableOriginalFile: () => void;
  onDrag: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
};

const FileBadge = ({ filename }: { filename: string }) => {
  const badge = getFileTypeBadge(filename);

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge.bg}`}>
      <span className={`text-xs font-bold ${badge.text}`}>{badge.label}</span>
    </div>
  );
};

export function ContractFormDocumentSection({
  dragActive,
  editMode,
  error,
  file,
  fileError,
  hasValidFile,
  initialData,
  keepOriginalFile,
  onDisableOriginalFile,
  onDrag,
  onDrop,
  onFileChange,
  onRemoveFile,
}: ContractFormDocumentSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">
        Documento PDF
        {!hasValidFile && <span className="ml-1 text-red-500">*</span>}
      </p>

      {editMode && keepOriginalFile && !file && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <FileBadge filename={initialData?.file_name ?? ""} />
            <div>
              <p className="text-sm font-medium text-slate-700">
                {initialData?.file_name ?? "Documento actual"}
              </p>
              <p className="text-xs text-slate-500">Archivo actual del contrato</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDisableOriginalFile}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {file && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <FileBadge filename={file.name} />
            <div>
              <p className="text-sm font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
                {editMode && <span className="ml-2 text-blue-600">(Nuevo archivo)</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveFile}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!file && !keepOriginalFile && (
        <div
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : fileError
                ? "border-red-300 bg-red-50/30 hover:border-red-400"
                : "border-slate-300 bg-slate-50/30 hover:border-slate-400"
          }`}
        >
          <Upload className={`mx-auto mb-2 h-8 w-8 ${fileError ? "text-red-400" : "text-slate-400"}`} />
          <p className="mb-1 text-sm text-slate-600">
            Arrastra tu archivo aqui o{" "}
            <label className="cursor-pointer font-medium text-blue-600 hover:underline">
              selecciona un archivo
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.doc,.docx"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          </p>
          <p className="text-xs text-slate-400">Formatos permitidos: PDF, Excel, Word</p>
          {fileError && (
            <p className="mt-2 text-xs text-red-500">Debes subir un archivo valido para continuar.</p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
