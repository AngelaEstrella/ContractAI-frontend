import { Check } from "lucide-react";
import type { ContractFormStep } from "@/features/contracts/hooks/use-contract-form";

type ContractFormProgressProps = {
  currentStep: ContractFormStep;
};

export function ContractFormProgress({ currentStep }: ContractFormProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center">
        {([1, 2, 3] as const).map((step, index) => (
          <div key={step} className="flex min-w-0 items-center">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                currentStep > step
                  ? "border-green-500 bg-green-500 text-white"
                  : currentStep === step
                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "border-slate-300 bg-white text-slate-400"
              }`}
            >
              {currentStep > step ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            <span
              className={`ml-2 shrink-0 text-xs font-medium transition-colors duration-300 ${
                currentStep >= step ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {step === 1 ? "Datos generales" : step === 2 ? "Servicios" : "Documento"}
            </span>
            {index < 2 && (
              <div
                className={`mx-4 h-px flex-1 transition-colors duration-500 ${
                  currentStep > step ? "bg-green-400" : "bg-slate-200"
                }`}
                style={{ minWidth: "2rem" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
