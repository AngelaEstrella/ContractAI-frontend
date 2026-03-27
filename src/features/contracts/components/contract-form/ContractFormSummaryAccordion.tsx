import type { ReactNode } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";

type ContractFormSummaryAccordionProps = {
  children: ReactNode;
  expanded: boolean;
  maxHeightClass?: string;
  onToggle: () => void;
  preview: ReactNode;
  title: string;
};

export function ContractFormSummaryAccordion({
  children,
  expanded,
  maxHeightClass = "max-h-[600px]",
  onToggle,
  preview,
  title,
}: ContractFormSummaryAccordionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
          {!expanded && preview}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600">
          {expanded ? "Colapsar" : "Ver mas"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? maxHeightClass : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
