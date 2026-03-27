"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

type ContractImportModalProps = {
  activeFolderName: string;
  onClose: () => void;
  open: boolean;
};

export function ContractImportModal({ activeFolderName, onClose, open }: ContractImportModalProps) {
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  const resetState = () => {
    setImportFiles([]);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Importar a {activeFolderName}</h3>
          <button onClick={handleClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              setImportFiles((files) => [...files, ...Array.from(event.dataTransfer.files)]);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
              isDragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50"
            }`}
          >
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${isDragging ? "bg-blue-100" : "bg-slate-200"}`}>
              <Upload className={`h-5 w-5 ${isDragging ? "text-blue-600" : "text-slate-500"}`} />
            </div>
            <p className="mb-0.5 text-sm font-medium text-slate-700">o suelta tus archivos aqui</p>
            <p className="mb-5 text-xs text-slate-400">PDF, Excel, Word</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Subir archivos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={(event) => {
                const selectedFiles = event.target.files ? Array.from(event.target.files) : [];

                if (selectedFiles.length > 0) {
                  setImportFiles((files) => [...files, ...selectedFiles]);
                }
              }}
            />
          </div>
          {importFiles.length > 0 && (
            <ul className="mt-3 max-h-32 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {importFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between px-3 py-2">
                  <span className="truncate text-sm text-slate-700">{file.name}</span>
                  <button
                    onClick={() => setImportFiles((files) => files.filter((_, currentIndex) => currentIndex !== index))}
                    className="ml-2 flex-shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleClose}
              disabled={importFiles.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:shadow-md disabled:opacity-40"
            >
              ✓ Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
