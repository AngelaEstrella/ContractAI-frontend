import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { FILTER_OPTIONS, type DocumentFilterValue } from "@/features/contracts/lib/contracts-utils";

type ContractsActionsBarProps = {
  filter: DocumentFilterValue;
  importControl: ReactNode;
  onCreateContract: () => void;
  onFilterChange: (value: DocumentFilterValue) => void;
  onSearchChange: (value: string) => void;
  search: string;
};

export function ContractsActionsBar({
  filter,
  importControl,
  onCreateContract,
  onFilterChange,
  onSearchChange,
  search,
}: ContractsActionsBarProps) {
  return (
    <div className="mb-4 flex-shrink-0 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="text"
          value={search}
          placeholder="Buscar por contrato, cliente o archivo..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 lg:max-w-md"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === option.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-200" />
          {importControl}
          <button
            onClick={onCreateContract}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Contrato
          </button>
        </div>
      </div>
    </div>
  );
}
