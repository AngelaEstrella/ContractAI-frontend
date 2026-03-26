"use client";

import { useEffect, useMemo, useState } from "react";
import { getServices, uploadDocument, updateDocument } from "@/lib/api";
import {
  CURRENCY_OPTIONS,
  DOCUMENT_STATE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  getDocumentPrimaryCurrency,
  getDocumentTotalValue,
} from "@/lib/document.utils";
import {
  CurrencyType,
  Document,
  DocumentFormData,
  DocumentServiceItemPayload,
  DocumentState,
  DocumentType,
  ServiceCatalogItem,
} from "@/types/api.types";
import { Plus, Trash2, Upload, X } from "lucide-react";

type Props = {
  readonly onAdd: (contract: Document) => void;
  readonly onClose: () => void;
  readonly editMode?: boolean;
  readonly initialData?: Document;
};

type ServiceItemDraft = {
  key: string;
  service_id: string;
  description: string;
  value: string;
  start_date: string;
  end_date: string;
};

type FormState = {
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  state: DocumentState;
  contract_currency: CurrencyType;
  service_items: ServiceItemDraft[];
};

const createDraftKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
};

const createEmptyServiceItem = (contractStartDate: string, contractEndDate: string): ServiceItemDraft => ({
  key: createDraftKey(),
  service_id: "",
  description: "",
  value: "",
  start_date: contractStartDate,
  end_date: contractEndDate,
});

const buildFormState = (document?: Document): FormState => ({
  name: document?.name ?? "",
  client: document?.client ?? "",
  type: document?.type ?? "SERVICES",
  start_date: document?.start_date ?? "",
  end_date: document?.end_date ?? "",
  state: document?.state ?? "ACTIVE",
  contract_currency: document ? getDocumentPrimaryCurrency(document) ?? "USD" : "USD",
  service_items:
    document?.service_items.map((item) => ({
      key: createDraftKey(),
      service_id: String(item.service_id),
      description: item.description ?? "",
      value: String(item.value),
      start_date: item.start_date,
      end_date: item.end_date,
    })) ?? [],
});

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatTotalValue = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function AddContractForm({ onAdd, onClose, editMode = false, initialData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoadError, setServicesLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [keepOriginalFile, setKeepOriginalFile] = useState(Boolean(editMode && (initialData?.file_name || initialData?.file_path)));
  const [fileError, setFileError] = useState(false);
  const [serviceItemsTouched, setServiceItemsTouched] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(initialData));

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        setServicesLoadError(null);
        const catalog = await getServices();
        setServices(catalog);
      } catch (err) {
        setServicesLoadError(err instanceof Error ? err.message : "No se pudo cargar el catálogo de servicios.");
      } finally {
        setServicesLoading(false);
      }
    };

    void loadServices();
  }, []);

  useEffect(() => {
    setForm(buildFormState(initialData));
    setFile(null);
    setError(null);
    setServiceError(null);
    setFileError(false);
    setServiceItemsTouched(false);
    setKeepOriginalFile(Boolean(editMode && (initialData?.file_name || initialData?.file_path)));
  }, [editMode, initialData]);

  const initialTotalFallback = useMemo(() => {
    return initialData ? getDocumentTotalValue(initialData) : 0;
  }, [initialData]);

  const serviceOptions = useMemo(() => {
    const optionsMap = new Map<string, ServiceCatalogItem>();

    services.forEach((service) => {
      optionsMap.set(String(service.id), service);
    });

    form.service_items.forEach((item) => {
      if (item.service_id && !optionsMap.has(item.service_id)) {
        optionsMap.set(item.service_id, {
          id: Number(item.service_id),
          name: `Servicio #${item.service_id}`,
        });
      }
    });

    return Array.from(optionsMap.values()).sort((left, right) => left.name.localeCompare(right.name, "es"));
  }, [form.service_items, services]);

  const calculatedServicesTotal = useMemo(() => {
    return form.service_items.reduce((total, item) => total + (parseOptionalNumber(item.value) ?? 0), 0);
  }, [form.service_items]);

  const contractTotal = useMemo(() => {
    if (!serviceItemsTouched && form.service_items.length === 0) {
      return initialTotalFallback;
    }

    return calculatedServicesTotal;
  }, [calculatedServicesTotal, form.service_items.length, initialTotalFallback, serviceItemsTouched]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceChange = (key: string, field: keyof Omit<ServiceItemDraft, "key">, value: string) => {
    setServiceItemsTouched(true);
    setForm((prev) => ({
      ...prev,
      service_items: prev.service_items.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setKeepOriginalFile(false);
      setFileError(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setKeepOriginalFile(false);
        setFileError(false);
        return;
      }

      setError("Solo se permiten archivos PDF");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(false);
    if (editMode && (initialData?.file_name || initialData?.file_path)) {
      setKeepOriginalFile(true);
    }
  };

  const removeOriginalFile = () => {
    setKeepOriginalFile(false);
  };

  const addServiceItem = () => {
    setServiceError(null);
    setServiceItemsTouched(true);
    setForm((prev) => ({
      ...prev,
      service_items: [...prev.service_items, createEmptyServiceItem(prev.start_date, prev.end_date)],
    }));
  };

  const removeServiceItem = (key: string) => {
    setServiceError(null);
    setServiceItemsTouched(true);
    setForm((prev) => ({
      ...prev,
      service_items: prev.service_items.filter((item) => item.key !== key),
    }));
  };

  const buildFormDataPayload = (): DocumentFormData => {
    const payload: DocumentFormData = editMode && initialData ? { ...initialData.form_data } : {};

    delete payload.licenses;
    payload.value = contractTotal;
    payload.currency = form.contract_currency;

    return payload;
  };

  const buildServiceItemsPayload = (): DocumentServiceItemPayload[] => {
    const nonEmptyItems = form.service_items.filter((item) => {
      return [item.service_id, item.description, item.value, item.start_date, item.end_date].some(
        (fieldValue) => fieldValue.trim() !== "",
      );
    });

    const parsedItems = nonEmptyItems.map((item, index) => {
      const serviceId = parseOptionalNumber(item.service_id);
      const value = parseOptionalNumber(item.value);

      if (serviceId === undefined || !Number.isInteger(serviceId) || serviceId <= 0) {
        throw new Error(`Selecciona un servicio válido en la fila ${index + 1}.`);
      }

      if (value === undefined || value < 0) {
        throw new Error(`Ingresa un valor válido para el servicio en la fila ${index + 1}.`);
      }

      if (!item.start_date || !item.end_date) {
        throw new Error(`Completa las fechas del servicio en la fila ${index + 1}.`);
      }

      if (new Date(item.end_date) < new Date(item.start_date)) {
        throw new Error(`La fecha fin del servicio en la fila ${index + 1} no puede ser anterior a la fecha inicio.`);
      }

      return {
        service_id: serviceId,
        description: item.description.trim() || undefined,
        value,
        currency: form.contract_currency,
        start_date: item.start_date,
        end_date: item.end_date,
      } satisfies DocumentServiceItemPayload;
    });

    const uniqueIds = new Set(parsedItems.map((item) => item.service_id));
    if (uniqueIds.size !== parsedItems.length) {
      throw new Error("No puedes repetir el mismo servicio dentro del contrato.");
    }

    return parsedItems;
  };

  const validateBaseFields = () => {
    if (!form.name.trim()) {
      throw new Error("Debes ingresar el nombre del contrato.");
    }

    if (!form.client.trim()) {
      throw new Error("Debes ingresar el cliente asociado.");
    }

    if (!form.start_date || !form.end_date) {
      throw new Error("Debes completar la fecha de inicio y la fecha de vencimiento.");
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      throw new Error("La fecha de vencimiento no puede ser anterior a la fecha de inicio.");
    }
  };

  const hasValidFile = file !== null || keepOriginalFile;

  const handleSubmit = async () => {
    if (!hasValidFile) {
      setFileError(true);
      setError("Debes tener un archivo PDF asociado al contrato");
      return;
    }

    if (!editMode && !file) {
      setFileError(true);
      setError("Debes seleccionar un archivo");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setServiceError(null);
      setFileError(false);

      validateBaseFields();
      const formDataPayload = buildFormDataPayload();
      const serviceItemsPayload = buildServiceItemsPayload();

      let resultDocument: Document;

      if (editMode && initialData) {
        resultDocument = await updateDocument(initialData.id, {
          name: form.name.trim(),
          client: form.client.trim(),
          type: form.type,
          start_date: form.start_date,
          end_date: form.end_date,
          state: form.state,
          form_data: formDataPayload,
          service_items: serviceItemsPayload,
          file: file || undefined,
        });
      } else {
        resultDocument = await uploadDocument({
          file: file!,
          name: form.name.trim(),
          client: form.client.trim(),
          type: form.type,
          start_date: form.start_date,
          end_date: form.end_date,
          state: form.state,
          form_data: formDataPayload,
          service_items: serviceItemsPayload,
        });
      }

      onAdd(resultDocument);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Error al ${editMode ? "actualizar" : "crear"} contrato`;

      if (message.toLowerCase().includes("servicio") || message.toLowerCase().includes("fecha")) {
        setServiceError(message);
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">
        {editMode ? "Editar Contrato" : "Nuevo Contrato"}
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="mb-1.5 text-sm font-semibold text-slate-800">Datos generales</div>
          <p className="text-xs text-slate-500">Completa la información base del contrato antes de adjuntar el PDF.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre del contrato</label>
          <input
            name="name"
            value={form.name}
            placeholder="Ej: Contrato de servicios 2024"
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Cliente</label>
          <input
            name="client"
            value={form.client}
            placeholder="Nombre del cliente"
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo de contrato</label>
          <select
            name="type"
            value={form.type}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Estado</label>
          <select
            name="state"
            value={form.state}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {DOCUMENT_STATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 md:col-span-2">
          <div className="mb-1.5 text-sm font-semibold text-slate-800">Detalle del contrato</div>
          <p className="text-xs text-slate-500">El monto total se calcula automaticamente en base a los servicios asociados.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha de inicio</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Fecha de vencimiento</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Moneda del contrato</label>
          <select
            name="contract_currency"
            value={form.contract_currency}
            onChange={handleFieldChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Todos los servicios asociados usaran esta misma moneda.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Valor total del contrato</label>
          <input
            type="text"
            readOnly
            value={formatTotalValue(contractTotal)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">Se actualiza automaticamente al sumar los valores de los servicios.</p>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Servicios asociados</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Selecciona un servicio del catalogo, indica su rango de fechas y el importe correspondiente.
                </p>
              </div>
              <button
                type="button"
                onClick={addServiceItem}
                disabled={servicesLoading || serviceOptions.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Agregar servicio
              </button>
            </div>

            {servicesLoading && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                Cargando catálogo de servicios...
              </div>
            )}

            {!servicesLoading && servicesLoadError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {servicesLoadError}
              </div>
            )}

            {!servicesLoading && !servicesLoadError && serviceOptions.length === 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                No hay servicios disponibles para seleccionar en este momento.
              </div>
            )}

            {serviceError && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {serviceError}
              </div>
            )}

            {form.service_items.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                Aun no hay servicios asociados. Puedes continuar sin agregarlos.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {form.service_items.map((item, index) => (
                  <div key={item.key} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Servicio #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeServiceItem(item.key)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar servicio ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                      <div className="md:col-span-4">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Servicio
                        </label>
                        <select
                          value={item.service_id}
                          onChange={(e) => handleServiceChange(item.key, "service_id", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">Selecciona un servicio</option>
                          {serviceOptions.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Descripcion
                        </label>
                        <input
                          value={item.description}
                          onChange={(e) => handleServiceChange(item.key, "description", e.target.value)}
                          placeholder="Detalle opcional"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Valor
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.value}
                          onChange={(e) => handleServiceChange(item.key, "value", e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Moneda
                        </label>
                        <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                          {form.contract_currency}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Fecha de inicio
                        </label>
                        <input
                          type="date"
                          value={item.start_date}
                          onChange={(e) => handleServiceChange(item.key, "start_date", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Fecha de fin
                        </label>
                        <input
                          type="date"
                          value={item.end_date}
                          onChange={(e) => handleServiceChange(item.key, "end_date", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 md:col-span-2">
          <div className="mb-1.5 text-sm font-semibold text-slate-800">Archivo PDF</div>
          <p className="text-xs text-slate-500">Adjunta el archivo firmado o la version contractual vigente.</p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Documento PDF
            {!hasValidFile && <span className="ml-1 text-red-500">*</span>}
          </label>

          {editMode && keepOriginalFile && !file && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <span className="text-xs font-bold text-red-600">PDF</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{initialData?.file_name ?? "Documento actual"}</p>
                  <p className="text-xs text-slate-500">Archivo actual del contrato</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeOriginalFile}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Eliminar archivo actual"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {file && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <span className="text-xs font-bold text-red-600">PDF</span>
                </div>
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
                onClick={removeFile}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {!file && !keepOriginalFile && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : fileError
                    ? "border-red-300 bg-red-50/30 hover:border-red-400"
                    : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
              }`}
            >
              <Upload className={`mx-auto mb-2 h-8 w-8 ${fileError ? "text-red-400" : "text-slate-400"}`} />
              <p className="mb-1 text-sm text-slate-600">
                Arrastra tu archivo aqui o{" "}
                <label className="cursor-pointer font-medium text-blue-600 hover:underline">
                  selecciona un archivo
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                </label>
              </p>
              <p className="text-xs text-slate-400">Solo archivos PDF</p>
              {fileError && (
                <p className="mt-2 text-xs text-red-500">Debes subir un archivo PDF para continuar.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {editMode ? "Actualizando..." : "Guardando..."}
            </>
          ) : editMode ? (
            "Guardar cambios"
          ) : (
            "Crear contrato"
          )}
        </button>
      </div>
    </>
  );
}
