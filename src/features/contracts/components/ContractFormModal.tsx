import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { Document } from "@/types/api.types";

type ContractFormModalProps = {
  editMode?: boolean;
  initialData?: Document;
  onClose: () => void;
  onSubmit: (contract: Document) => void;
  open: boolean;
};

const ContractForm = dynamic(() => import("@/features/contracts/components/contract-form/ContractForm"), {
  loading: () => (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        Cargando formulario...
      </div>
    </div>
  ),
});

export function ContractFormModal({
  editMode = false,
  initialData,
  onClose,
  onSubmit,
  open,
}: ContractFormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex h-[700px] w-full max-w-[650px] flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>
        <ContractForm
          onAdd={onSubmit}
          onClose={onClose}
          editMode={editMode}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
