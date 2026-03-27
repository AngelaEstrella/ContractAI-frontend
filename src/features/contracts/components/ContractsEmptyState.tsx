import type { ReactNode } from "react";
import { FolderOpen, Plus } from "lucide-react";

type ContractsEmptyStateProps = {
  importControl: ReactNode;
  onCreateContract: () => void;
};

export function ContractsEmptyState({ importControl, onCreateContract }: ContractsEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <FolderOpen className="h-10 w-10 text-slate-400" />
      </div>
      <p className="mb-1 text-base font-medium text-slate-600">Esta carpeta esta vacia</p>
      <p className="mb-6 text-sm text-slate-400">Agrega un contrato nuevo o importa documentos</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateContract}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <Plus className="h-4 w-4" />
          Nuevo Contrato
        </button>
        {importControl}
      </div>
    </div>
  );
}
