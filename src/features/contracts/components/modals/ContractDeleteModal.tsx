import { AlertTriangle } from "lucide-react";

type ContractDeleteModalProps = {
  contractName: string | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
};

export function ContractDeleteModal({
  contractName,
  deleting,
  onClose,
  onConfirm,
  open,
}: ContractDeleteModalProps) {
  if (!open || !contractName) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => {
        if (!deleting) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800">¿Eliminar contrato?</h3>
          <p className="mb-6 text-sm text-slate-500">
            Estas a punto de eliminar el contrato <span className="font-medium text-slate-700">{contractName}</span>.
            Esta accion no se puede deshacer.
          </p>
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
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
  );
}
