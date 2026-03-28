"use client";

import { Check, Plus } from "lucide-react";
import { formatCurrencyValue, formatFormDate } from "@/features/contracts/lib/contract-form.utils";
import { useContractForm } from "@/features/contracts/hooks/use-contract-form";
import { getDocumentStateLabel, getDocumentTypeLabel } from "@/lib/document.utils";
import type { Document } from "@/types/api.types";
import { ContractFormDocumentSection } from "./ContractFormDocumentSection";
import { ContractFormGeneralFields } from "./ContractFormGeneralFields";
import { ContractFormProgress } from "./ContractFormProgress";
import { ContractFormServicesSection } from "./ContractFormServicesSection";
import { ContractFormSummaryAccordion } from "./ContractFormSummaryAccordion";

type Props = {
  readonly onAdd: (contract: Document) => void;
  readonly onClose: () => void;
  readonly editMode?: boolean;
  readonly initialData?: Document;
};

export default function ContractForm({ onAdd, onClose, editMode = false, initialData }: Props) {
  const formState = useContractForm({ editMode, initialData, onAdd, onClose });

  const generalPreview = (
    <p className="mt-0.5 truncate text-sm text-slate-700">
      <span className="font-medium">{formState.form.name || "-"}</span>
      {formState.form.client && <span className="text-slate-500"> · {formState.form.client}</span>}
      <span className="text-slate-400"> · {formState.form.contract_currency}</span>
      {formState.form.start_date && formState.form.end_date && (
        <span className="text-slate-400">
          {" "}· {formatFormDate(formState.form.start_date)} — {formatFormDate(formState.form.end_date)}
        </span>
      )}
    </p>
  );

  const generalPreviewDetailed = (
    <p className="mt-0.5 truncate text-sm text-slate-700">
      <span className="font-medium">{formState.form.name || "-"}</span>
      {formState.form.client && <span className="text-slate-500"> · {formState.form.client}</span>}
      <span className="text-slate-400">
        {" "}· {getDocumentTypeLabel(formState.form.type)} · {getDocumentStateLabel(formState.form.state)} · {formState.form.contract_currency}
      </span>
    </p>
  );

  const servicesPreview = (
    <p className="mt-0.5 text-sm text-slate-700">
      {formState.form.service_items.length === 0 ? (
        <span className="text-slate-400">Sin servicios asociados</span>
      ) : (
        <>
          <span className="font-medium">
            {formState.form.service_items.length} servicio
            {formState.form.service_items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-400">
            {" "}· Total: {formState.form.contract_currency} {formatCurrencyValue(formState.contractTotal)}
          </span>
        </>
      )}
    </p>
  );

  const summary1Content = formState.summary1Draft ? (
    <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
      <ContractFormGeneralFields
        data={formState.summary1Draft}
        onChange={formState.handleSummary1DraftChange}
      />
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={formState.closeSummary1}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancelar cambios
        </button>
        <button
          type="button"
          onClick={formState.saveSummary1}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Check className="h-3.5 w-3.5" />
          Guardar cambios
        </button>
      </div>
    </div>
  ) : null;

  const servicesHeader = (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-800">Servicios asociados</p>
      <button
        type="button"
        onClick={formState.startAddingService}
        disabled={
          formState.servicesLoading ||
          formState.addingService ||
          formState.serviceOptions.length === 0
        }
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar servicio
      </button>
    </div>
  );

  const servicesSummaryHeader = (
    <div className="mb-3 flex items-center justify-between">
      <p className="text-xs text-slate-500">Edita los servicios directamente sin retroceder.</p>
      <button
        type="button"
        onClick={formState.startAddingService}
        disabled={
          formState.servicesLoading ||
          formState.addingService ||
          formState.serviceOptions.length === 0
        }
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar
      </button>
    </div>
  );

  const servicesSection = (
    <ContractFormServicesSection
      addingService={formState.addingService}
      contractTotal={formState.contractTotal}
      editingServiceKey={formState.editingServiceKey}
      form={formState.form}
      newServiceDraft={formState.newServiceDraft}
      onCancelNewService={formState.cancelNewService}
      onNewDraftChange={formState.handleNewDraftChange}
      onRemoveServiceItem={formState.removeServiceItem}
      onSaveNewService={formState.saveNewService}
      onServiceChange={formState.handleServiceChange}
      onSetEditingServiceKey={formState.setEditingServiceKey}
      serviceOptions={formState.serviceOptions}
      servicesLoadError={formState.servicesLoadError}
      servicesLoading={formState.servicesLoading}
    />
  );

  return (
    <div className="flex h-full flex-col px-7 py-6">
      <div className="shrink-0">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">
          {editMode ? "Editar Contrato" : "Nuevo Contrato"}
        </h2>
        <ContractFormProgress currentStep={formState.currentStep} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`transition-opacity duration-150 ${formState.visible ? "opacity-100" : "opacity-0"}`}>
          {formState.currentStep === 1 && (
            <ContractFormGeneralFields
              data={formState.form}
              onChange={formState.handleFieldChange}
            />
          )}

          {formState.currentStep === 2 && (
            <div className="space-y-5">
              <ContractFormSummaryAccordion
                expanded={formState.summary1Expanded}
                onToggle={() =>
                  formState.summary1Expanded ? formState.closeSummary1() : formState.openSummary1()
                }
                preview={generalPreview}
                title="Datos generales"
              >
                {summary1Content}
              </ContractFormSummaryAccordion>

              <div>
                {servicesHeader}
                {servicesSection}
              </div>
            </div>
          )}

          {formState.currentStep === 3 && (
            <div className="space-y-5">
              <ContractFormSummaryAccordion
                expanded={formState.summary1Expanded}
                onToggle={() =>
                  formState.summary1Expanded ? formState.closeSummary1() : formState.openSummary1()
                }
                preview={generalPreviewDetailed}
                title="Datos generales"
              >
                {summary1Content}
              </ContractFormSummaryAccordion>

              <ContractFormSummaryAccordion
                expanded={formState.summary2Expanded}
                maxHeightClass="max-h-[800px]"
                onToggle={() => formState.setSummary2Expanded((previous) => !previous)}
                preview={servicesPreview}
                title="Servicios"
              >
                <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3">
                  {servicesSummaryHeader}
                  {servicesSection}
                </div>
              </ContractFormSummaryAccordion>

              <ContractFormDocumentSection
                dragActive={formState.dragActive}
                editMode={editMode}
                error={formState.error}
                file={formState.file}
                fileError={formState.fileError}
                hasValidFile={formState.hasValidFile}
                initialData={initialData}
                keepOriginalFile={formState.keepOriginalFile}
                onDisableOriginalFile={() => formState.setKeepOriginalFile(false)}
                onDrag={formState.handleDrag}
                onDrop={formState.handleDrop}
                onFileChange={formState.handleFileChange}
                onRemoveFile={formState.removeFile}
              />
            </div>
          )}
        </div>

        {formState.stepError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {formState.stepError}
          </div>
        )}
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={formState.currentStep === 1 ? onClose : formState.goPrev}
          disabled={formState.loading}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {formState.currentStep === 1 ? "Volver" : "← Anterior"}
        </button>

        {formState.currentStep < 3 ? (
          <button
            type="button"
            onClick={formState.goNext}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={formState.handleSubmit}
            disabled={formState.loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {formState.loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {editMode ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {editMode ? "Guardar cambios" : "Crear contrato"}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
