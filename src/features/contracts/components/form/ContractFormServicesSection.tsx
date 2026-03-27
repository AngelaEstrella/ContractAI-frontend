import { CalendarDays, Check, FileText, Pencil, Trash2 } from "lucide-react";
import {
  HelpTip,
  formatCurrencyValue,
  formatFormDate,
  parseOptionalNumber,
  type FormState,
  type ServiceItemDraft,
} from "@/features/contracts/lib/contract-form.utils";
import type { ServiceCatalogItem } from "@/types/api.types";
import { contractFormStyles } from "./contract-form.styles";

type ServiceItemDraftField = keyof Omit<ServiceItemDraft, "key">;

type ContractFormServicesSectionProps = {
  addingService: boolean;
  contractTotal: number;
  editingServiceKey: string | null;
  form: FormState;
  newServiceDraft: ServiceItemDraft;
  onCancelNewService: () => void;
  onNewDraftChange: (field: ServiceItemDraftField, value: string) => void;
  onRemoveServiceItem: (key: string) => void;
  onSaveNewService: () => void;
  onServiceChange: (key: string, field: ServiceItemDraftField, value: string) => void;
  onSetEditingServiceKey: (key: string | null) => void;
  serviceOptions: ServiceCatalogItem[];
  servicesLoadError: string | null;
  servicesLoading: boolean;
};

export function ContractFormServicesSection({
  addingService,
  contractTotal,
  editingServiceKey,
  form,
  newServiceDraft,
  onCancelNewService,
  onNewDraftChange,
  onRemoveServiceItem,
  onSaveNewService,
  onServiceChange,
  onSetEditingServiceKey,
  serviceOptions,
  servicesLoadError,
  servicesLoading,
}: ContractFormServicesSectionProps) {
  return (
    <>
      {servicesLoading && <p className="text-xs text-slate-500">Cargando catalogo de servicios...</p>}

      {!servicesLoading && servicesLoadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {servicesLoadError}
        </div>
      )}

      {!servicesLoading && !servicesLoadError && serviceOptions.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No hay servicios disponibles en este momento.
        </div>
      )}

      {form.service_items.length === 0 && !addingService ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-5 text-center">
          <FileText className="mx-auto mb-1.5 h-5 w-5 text-slate-300" />
          <p className="text-xs text-slate-400">Sin servicios. Puedes continuar sin agregarlos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {form.service_items.map((item, index) => {
            const serviceName =
              serviceOptions.find((service) => String(service.id) === item.service_id)?.name ??
              (item.service_id ? `Servicio #${item.service_id}` : null);
            const isEditing = editingServiceKey === item.key;

            return (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">
                    {serviceName ? serviceName.charAt(0).toUpperCase() : String(index + 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {serviceName ?? <span className="italic text-slate-400">Sin seleccionar</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                      {item.description && (
                        <span className="max-w-[12rem] truncate">{item.description}</span>
                      )}
                      {item.value && (
                        <>
                          {item.description && <span>·</span>}
                          <span className="font-medium text-slate-600">
                            {form.contract_currency} {formatCurrencyValue(parseOptionalNumber(item.value) ?? 0)}
                          </span>
                        </>
                      )}
                      {(item.start_date || item.end_date) && (
                        <>
                          <span>·</span>
                          <CalendarDays className="h-3 w-3" />
                          <span>
                            {formatFormDate(item.start_date)} – {formatFormDate(item.end_date)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onSetEditingServiceKey(isEditing ? null : item.key)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        isEditing
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveServiceItem(item.key)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Servicio</label>
                        <select
                          value={item.service_id}
                          onChange={(event) =>
                            onServiceChange(item.key, "service_id", event.target.value)
                          }
                          className={contractFormStyles.smallSelect}
                        >
                          <option value="">Selecciona un servicio</option>
                          {serviceOptions.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Descripcion</label>
                        <input
                          value={item.description}
                          onChange={(event) =>
                            onServiceChange(item.key, "description", event.target.value)
                          }
                          placeholder="Detalle opcional"
                          className={contractFormStyles.smallInput}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Valor</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.value}
                          onChange={(event) => onServiceChange(item.key, "value", event.target.value)}
                          placeholder="0.00"
                          className={contractFormStyles.smallInput}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Moneda</label>
                        <div className="flex h-[38px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                          {form.contract_currency}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Fecha inicio</label>
                        <input
                          type="date"
                          value={item.start_date}
                          onChange={(event) =>
                            onServiceChange(item.key, "start_date", event.target.value)
                          }
                          className={contractFormStyles.smallInput}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Fecha fin</label>
                        <input
                          type="date"
                          value={item.end_date}
                          onChange={(event) => onServiceChange(item.key, "end_date", event.target.value)}
                          className={contractFormStyles.smallInput}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSetEditingServiceKey(null)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetEditingServiceKey(null)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addingService && (
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <p className="mb-2.5 text-xs font-semibold text-blue-700">Nuevo servicio</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Servicio</label>
              <select
                value={newServiceDraft.service_id}
                onChange={(event) => onNewDraftChange("service_id", event.target.value)}
                className={contractFormStyles.smallSelect}
              >
                <option value="">Selecciona un servicio</option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Descripcion</label>
              <input
                value={newServiceDraft.description}
                onChange={(event) => onNewDraftChange("description", event.target.value)}
                placeholder="Detalle opcional"
                className={contractFormStyles.smallInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newServiceDraft.value}
                onChange={(event) => onNewDraftChange("value", event.target.value)}
                placeholder="0.00"
                className={contractFormStyles.smallInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
              <div className="flex h-[38px] items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                {form.contract_currency}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input
                type="date"
                value={newServiceDraft.start_date}
                onChange={(event) => onNewDraftChange("start_date", event.target.value)}
                className={contractFormStyles.smallInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
              <input
                type="date"
                value={newServiceDraft.end_date}
                onChange={(event) => onNewDraftChange("end_date", event.target.value)}
                className={contractFormStyles.smallInput}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancelNewService}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSaveNewService}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Check className="h-3.5 w-3.5" />
              Guardar servicio
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-slate-500">Valor total</p>
          <HelpTip text="Se calcula automaticamente sumando los valores de todos los servicios. No es editable de forma directa." />
        </div>
        <p className="text-base font-semibold text-slate-800">
          {form.contract_currency} {formatCurrencyValue(contractTotal)}
        </p>
      </div>
    </>
  );
}
