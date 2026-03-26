"use client";

import { useEffect, useMemo, useState } from "react";
import { getServices, uploadDocument, updateDocument } from "@/lib/api";
import {
  CURRENCY_OPTIONS,
  DOCUMENT_STATE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  getDocumentPrimaryCurrency,
  getDocumentStateLabel,
  getDocumentTotalValue,
  getDocumentTypeLabel,
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
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

type Step1Draft = Pick<FormState, "name" | "client" | "type" | "state" | "start_date" | "end_date" | "contract_currency">;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const createDraftKey = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const createEmptyServiceItem = (start: string, end: string): ServiceItemDraft => ({
  key: createDraftKey(),
  service_id: "",
  description: "",
  value: "",
  start_date: start,
  end_date: end,
});

const buildFormState = (doc?: Document): FormState => ({
  name: doc?.name ?? "",
  client: doc?.client ?? "",
  type: doc?.type ?? "SERVICES",
  start_date: doc?.start_date ?? "",
  end_date: doc?.end_date ?? "",
  state: doc?.state ?? "ACTIVE",
  contract_currency: doc ? (getDocumentPrimaryCurrency(doc) ?? "USD") : "USD",
  service_items:
    doc?.service_items.map((item) => ({
      key: createDraftKey(),
      service_id: String(item.service_id),
      description: item.description ?? "",
      value: String(item.value),
      start_date: item.start_date,
      end_date: item.end_date,
    })) ?? [],
});

const parseOptionalNumber = (value: string): number | undefined => {
  const t = value.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

const fmt = (value: number): string =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (date: string): string => {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
};

const ALLOWED_EXTENSIONS = new Set(["pdf", "xlsx", "xls", "doc", "docx"]);

const getFileExt = (filename: string): string =>
  filename.split(".").pop()?.toLowerCase() ?? "";

const isAllowedFile = (filename: string): boolean =>
  ALLOWED_EXTENSIONS.has(getFileExt(filename));

const getFileTypeBadge = (filename: string): { label: string; bg: string; text: string } => {
  const ext = getFileExt(filename);
  if (ext === "pdf") return { label: "PDF", bg: "bg-red-100", text: "text-red-600" };
  if (ext === "xlsx" || ext === "xls") return { label: "XLS", bg: "bg-green-100", text: "text-green-600" };
  if (ext === "doc" || ext === "docx") return { label: "DOC", bg: "bg-blue-100", text: "text-blue-600" };
  return { label: "FILE", bg: "bg-slate-100", text: "text-slate-600" };
};

// ─────────────────────────────────────────────
// HelpTip – tooltip standalone component
// ─────────────────────────────────────────────

function HelpTip({ text }: { readonly text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex cursor-help align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-blue-500" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100">
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function AddContractForm({ onAdd, onClose, editMode = false, initialData }: Props) {
  // ── Form state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoadError, setServicesLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [keepOriginalFile, setKeepOriginalFile] = useState(
    Boolean(editMode && (initialData?.file_name || initialData?.file_path)),
  );
  const [fileError, setFileError] = useState(false);
  const [serviceItemsTouched, setServiceItemsTouched] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(initialData));

  // ── Wizard state ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [summary1Expanded, setSummary1Expanded] = useState(false);
  const [summary2Expanded, setSummary2Expanded] = useState(false);
  const [summary1Draft, setSummary1Draft] = useState<Step1Draft | null>(null);
  const [summary1Snapshot, setSummary1Snapshot] = useState<Step1Draft | null>(null);

  // ── Service add/edit state ──
  const [addingService, setAddingService] = useState(false);
  const [newServiceDraft, setNewServiceDraft] = useState<ServiceItemDraft>(() =>
    createEmptyServiceItem("", ""),
  );
  const [editingServiceKey, setEditingServiceKey] = useState<string | null>(null);

  // ── Load catalog ──
  useEffect(() => {
    const load = async () => {
      try {
        setServicesLoading(true);
        setServicesLoadError(null);
        setServices(await getServices());
      } catch (err) {
        setServicesLoadError(
          err instanceof Error ? err.message : "No se pudo cargar el catálogo de servicios.",
        );
      } finally {
        setServicesLoading(false);
      }
    };
    void load();
  }, []);

  // ── Reset on open ──
  useEffect(() => {
    setForm(buildFormState(initialData));
    setFile(null);
    setError(null);
    setFileError(false);
    setServiceItemsTouched(false);
    setEditingServiceKey(null);
    setKeepOriginalFile(Boolean(editMode && (initialData?.file_name || initialData?.file_path)));
    setCurrentStep(1);
    setStepError(null);
    setVisible(true);
    setSummary1Expanded(false);
    setSummary2Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
    setAddingService(false);
    setNewServiceDraft(createEmptyServiceItem("", ""));
  }, [editMode, initialData]);

  // ── Derived ──
  const initialTotalFallback = useMemo(
    () => (initialData ? getDocumentTotalValue(initialData) : 0),
    [initialData],
  );

  const serviceOptions = useMemo(() => {
    const map = new Map<string, ServiceCatalogItem>();
    services.forEach((s) => map.set(String(s.id), s));
    form.service_items.forEach((item) => {
      if (item.service_id && !map.has(item.service_id))
        map.set(item.service_id, { id: Number(item.service_id), name: `Servicio #${item.service_id}` });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [form.service_items, services]);

  const calculatedTotal = useMemo(
    () => form.service_items.reduce((sum, item) => sum + (parseOptionalNumber(item.value) ?? 0), 0),
    [form.service_items],
  );

  const contractTotal = useMemo(
    () =>
      !serviceItemsTouched && form.service_items.length === 0 ? initialTotalFallback : calculatedTotal,
    [calculatedTotal, form.service_items.length, initialTotalFallback, serviceItemsTouched],
  );

  const hasValidFile = file !== null || keepOriginalFile;

  // ── Field handlers ──
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (key: string, field: keyof Omit<ServiceItemDraft, "key">, value: string) => {
    setServiceItemsTouched(true);
    setForm((prev) => ({
      ...prev,
      service_items: prev.service_items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleNewDraftChange = (field: keyof Omit<ServiceItemDraft, "key">, value: string) =>
    setNewServiceDraft((prev) => ({ ...prev, [field]: value }));

  // ── File handlers ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setKeepOriginalFile(false);
      setFileError(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (isAllowedFile(f.name)) {
        setFile(f);
        setKeepOriginalFile(false);
        setFileError(false);
      } else {
        setError("Formato no permitido. Usa PDF, Excel (.xlsx/.xls) o Word (.doc/.docx).");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(false);
    if (editMode && (initialData?.file_name || initialData?.file_path)) setKeepOriginalFile(true);
  };

  // ── Service handlers ──
  const removeServiceItem = (key: string) => {
    setServiceItemsTouched(true);
    if (editingServiceKey === key) setEditingServiceKey(null);
    setForm((prev) => ({
      ...prev,
      service_items: prev.service_items.filter((item) => item.key !== key),
    }));
  };

  const startAddingService = () => {
    setNewServiceDraft(createEmptyServiceItem(form.start_date, form.end_date));
    setAddingService(true);
    setStepError(null);
  };

  const cancelNewService = () => {
    setAddingService(false);
    setStepError(null);
  };

  const saveNewService = () => {
    const serviceId = parseOptionalNumber(newServiceDraft.service_id);
    if (!serviceId || !Number.isInteger(serviceId) || serviceId <= 0) {
      setStepError("Selecciona un servicio válido.");
      return;
    }
    const value = parseOptionalNumber(newServiceDraft.value);
    if (value === undefined || value < 0) {
      setStepError("Ingresa un valor numérico válido.");
      return;
    }
    if (!newServiceDraft.start_date || !newServiceDraft.end_date) {
      setStepError("Completa las fechas del servicio.");
      return;
    }
    if (new Date(newServiceDraft.end_date) < new Date(newServiceDraft.start_date)) {
      setStepError("La fecha fin no puede ser anterior a la fecha inicio.");
      return;
    }
    if (form.service_items.some((item) => item.service_id === newServiceDraft.service_id)) {
      setStepError("Ya existe un servicio con esa selección en este contrato.");
      return;
    }
    setServiceItemsTouched(true);
    setForm((prev) => ({ ...prev, service_items: [...prev.service_items, { ...newServiceDraft }] }));
    setStepError(null);
    setAddingService(false);
  };

  // ── Payload builders ──
  const buildFormDataPayload = (): DocumentFormData => {
    const payload: DocumentFormData = editMode && initialData ? { ...initialData.form_data } : {};
    delete payload.licenses;
    payload.value = contractTotal;
    payload.currency = form.contract_currency;
    return payload;
  };

  const buildServiceItemsPayload = (): DocumentServiceItemPayload[] => {
    const nonEmpty = form.service_items.filter((item) =>
      [item.service_id, item.description, item.value, item.start_date, item.end_date].some(
        (v) => v.trim() !== "",
      ),
    );
    const parsed = nonEmpty.map((item, i) => {
      const serviceId = parseOptionalNumber(item.service_id);
      const value = parseOptionalNumber(item.value);
      if (!serviceId || !Number.isInteger(serviceId) || serviceId <= 0)
        throw new Error(`Selecciona un servicio válido en la fila ${i + 1}.`);
      if (value === undefined || value < 0)
        throw new Error(`Ingresa un valor válido para el servicio en la fila ${i + 1}.`);
      if (!item.start_date || !item.end_date)
        throw new Error(`Completa las fechas del servicio en la fila ${i + 1}.`);
      if (new Date(item.end_date) < new Date(item.start_date))
        throw new Error(`La fecha fin del servicio ${i + 1} no puede ser anterior a la fecha inicio.`);
      return {
        service_id: serviceId,
        description: item.description.trim() || undefined,
        value,
        currency: form.contract_currency,
        start_date: item.start_date,
        end_date: item.end_date,
      } satisfies DocumentServiceItemPayload;
    });
    const ids = new Set(parsed.map((p) => p.service_id));
    if (ids.size !== parsed.length) throw new Error("No puedes repetir el mismo servicio dentro del contrato.");
    return parsed;
  };

  // ── Wizard navigation ──
  const validateStep1 = (): string | null => {
    if (!form.name.trim()) return "Debes ingresar el nombre del contrato.";
    if (!form.client.trim()) return "Debes ingresar el cliente asociado.";
    if (!form.start_date || !form.end_date) return "Debes completar las fechas de inicio y vencimiento.";
    if (new Date(form.end_date) < new Date(form.start_date))
      return "La fecha de vencimiento no puede ser anterior a la de inicio.";
    return null;
  };

  const navigateToStep = (step: 1 | 2 | 3) => {
    setVisible(false);
    setTimeout(() => {
      setCurrentStep(step);
      setStepError(null);
      setSummary1Expanded(false);
      setSummary2Expanded(false);
      setSummary1Draft(null);
      setSummary1Snapshot(null);
      setVisible(true);
    }, 150);
  };

  const goNext = () => {
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) { setStepError(err); return; }
      navigateToStep(2);
    } else if (currentStep === 2) {
      if (addingService) { setStepError("Guarda o cancela el servicio actual antes de continuar."); return; }
      try {
        buildServiceItemsPayload();
        navigateToStep(3);
      } catch (err) {
        setStepError(err instanceof Error ? err.message : "Error en los servicios.");
      }
    }
  };

  const goPrev = () => {
    setAddingService(false);
    navigateToStep((currentStep - 1) as 1 | 2 | 3);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!hasValidFile) { setFileError(true); setError("Debes tener un archivo PDF asociado al contrato."); return; }
    if (!editMode && !file) { setFileError(true); setError("Debes seleccionar un archivo."); return; }
    try {
      setLoading(true);
      setError(null);
      setFileError(false);
      const formDataPayload = buildFormDataPayload();
      const serviceItemsPayload = buildServiceItemsPayload();
      let result: Document;
      if (editMode && initialData) {
        result = await updateDocument(initialData.id, {
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
        result = await uploadDocument({
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
      onAdd(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Error al ${editMode ? "actualizar" : "crear"} contrato`);
    } finally {
      setLoading(false);
    }
  };

  // ── Style constants ──
  const iCls =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const sCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const lCls = "mb-1.5 flex items-center text-sm font-medium text-slate-700";
  const siCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
  const ssCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  // ── Summary 1 draft handlers ──
  const openSummary1 = () => {
    const snap: Step1Draft = {
      name: form.name,
      client: form.client,
      type: form.type,
      state: form.state,
      start_date: form.start_date,
      end_date: form.end_date,
      contract_currency: form.contract_currency,
    };
    setSummary1Draft(snap);
    setSummary1Snapshot(snap);
    setSummary1Expanded(true);
  };

  const closeSummary1 = () => {
    if (
      summary1Draft &&
      summary1Snapshot &&
      JSON.stringify(summary1Draft) !== JSON.stringify(summary1Snapshot)
    ) {
      if (!window.confirm("¿Descartar los cambios realizados en Datos generales?")) return;
    }
    setSummary1Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
  };

  const saveSummary1 = () => {
    if (summary1Draft) setForm((prev) => ({ ...prev, ...summary1Draft }));
    setSummary1Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
  };

  const handleSummary1DraftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSummary1Draft((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // ── Reusable: step 1 fields (shared between step 1 and expanded summary) ──
  const renderStep1Fields = (
    data: Step1Draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  ) => (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <div>
        <label className={lCls}>Nombre del contrato</label>
        <input name="name" value={data.name} placeholder="Ej: Contrato de servicios 2024" onChange={onChange} className={iCls} />
      </div>
      <div>
        <label className={lCls}>Cliente</label>
        <input name="client" value={data.client} placeholder="Nombre del cliente" onChange={onChange} className={iCls} />
      </div>
      <div>
        <label className={lCls}>
          Tipo de contrato
          <HelpTip text="Servicios = prestación de servicios profesionales. Licencias = uso de software. Soporte = mantenimiento y asistencia técnica." />
        </label>
        <select name="type" value={data.type} onChange={onChange} className={sCls}>
          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={lCls}>
          Estado
          <HelpTip text="Activo = contrato vigente. Pendiente = en revisión o pendiente de firma. Expirado = fuera del período de vigencia." />
        </label>
        <select name="state" value={data.state} onChange={onChange} className={sCls}>
          {DOCUMENT_STATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={lCls}>Fecha de inicio</label>
        <input type="date" name="start_date" value={data.start_date} onChange={onChange} className={iCls} />
      </div>
      <div>
        <label className={lCls}>Fecha de vencimiento</label>
        <input type="date" name="end_date" value={data.end_date} onChange={onChange} className={iCls} />
      </div>
      <div className="col-span-2">
        <label className={lCls}>
          Moneda del contrato
          <HelpTip text="La moneda elegida se aplicará automáticamente a todos los servicios. No se puede cambiar por servicio individual." />
        </label>
        <select name="contract_currency" value={data.contract_currency} onChange={onChange} className={sCls}>
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // ── Reusable: service list (shared between step 2 and expanded summary) ──
  const renderServiceList = () => (
    <>
      {servicesLoading && (
        <p className="text-xs text-slate-500">Cargando catálogo de servicios...</p>
      )}
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
            const sName =
              serviceOptions.find((s) => String(s.id) === item.service_id)?.name ??
              (item.service_id ? `Servicio #${item.service_id}` : null);
            const isEditing = editingServiceKey === item.key;
            return (
              <div key={item.key} className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">
                    {sName ? sName.charAt(0).toUpperCase() : String(index + 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {sName ?? <span className="italic text-slate-400">Sin seleccionar</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                      {item.description && <span className="truncate max-w-[12rem]">{item.description}</span>}
                      {item.value && (
                        <>
                          {item.description && <span>·</span>}
                          <span className="font-medium text-slate-600">
                            {form.contract_currency} {fmt(parseOptionalNumber(item.value) ?? 0)}
                          </span>
                        </>
                      )}
                      {(item.start_date || item.end_date) && (
                        <>
                          <span>·</span>
                          <CalendarDays className="h-3 w-3" />
                          <span>{fmtDate(item.start_date)} – {fmtDate(item.end_date)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditingServiceKey(isEditing ? null : item.key)}
                      className={`rounded-lg p-1.5 transition-colors ${isEditing ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeServiceItem(item.key)}
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
                        <select value={item.service_id} onChange={(e) => handleServiceChange(item.key, "service_id", e.target.value)} className={ssCls}>
                          <option value="">Selecciona un servicio</option>
                          {serviceOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-500">Descripción</label>
                        <input value={item.description} onChange={(e) => handleServiceChange(item.key, "description", e.target.value)} placeholder="Detalle opcional" className={siCls} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Valor</label>
                        <input type="number" min="0" step="0.01" value={item.value} onChange={(e) => handleServiceChange(item.key, "value", e.target.value)} placeholder="0.00" className={siCls} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Moneda</label>
                        <div className="flex h-[38px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">{form.contract_currency}</div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Fecha inicio</label>
                        <input type="date" value={item.start_date} onChange={(e) => handleServiceChange(item.key, "start_date", e.target.value)} className={siCls} />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Fecha fin</label>
                        <input type="date" value={item.end_date} onChange={(e) => handleServiceChange(item.key, "end_date", e.target.value)} className={siCls} />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingServiceKey(null)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingServiceKey(null)}
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

      {/* Add new service form */}
      {addingService && (
        <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <p className="mb-2.5 text-xs font-semibold text-blue-700">Nuevo servicio</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Servicio</label>
              <select value={newServiceDraft.service_id} onChange={(e) => handleNewDraftChange("service_id", e.target.value)} className={ssCls}>
                <option value="">Selecciona un servicio</option>
                {serviceOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
              <input value={newServiceDraft.description} onChange={(e) => handleNewDraftChange("description", e.target.value)} placeholder="Detalle opcional" className={siCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Valor</label>
              <input type="number" min="0" step="0.01" value={newServiceDraft.value} onChange={(e) => handleNewDraftChange("value", e.target.value)} placeholder="0.00" className={siCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Moneda</label>
              <div className="flex h-[38px] items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">{form.contract_currency}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha inicio</label>
              <input type="date" value={newServiceDraft.start_date} onChange={(e) => handleNewDraftChange("start_date", e.target.value)} className={siCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha fin</label>
              <input type="date" value={newServiceDraft.end_date} onChange={(e) => handleNewDraftChange("end_date", e.target.value)} className={siCls} />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={cancelNewService} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Cancelar
            </button>
            <button type="button" onClick={saveNewService} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
              <Check className="h-3.5 w-3.5" />
              Guardar servicio
            </button>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-slate-500">Valor total</p>
          <HelpTip text="Se calcula automáticamente sumando los valores de todos los servicios. No es editable de forma directa." />
        </div>
        <p className="text-base font-semibold text-slate-800">
          {form.contract_currency} {fmt(contractTotal)}
        </p>
      </div>
    </>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col px-7 py-6">
      {/* ── Header (fixed) ── */}
      <div className="shrink-0">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        {editMode ? "Editar Contrato" : "Nuevo Contrato"}
      </h2>

      {/* ── Progress bar ── */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          {([1, 2, 3] as const).map((step, idx) => (
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
              {idx < 2 && (
                <div
                  className={`mx-4 h-px flex-1 transition-colors duration-500 ${currentStep > step ? "bg-green-400" : "bg-slate-200"}`}
                  style={{ minWidth: "2rem" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      </div>{/* end header */}

      {/* ── Body (scrollable) ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      {/* ── Step content (fade transition) ── */}
      <div className={`transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}>

        {/* ══ STEP 1: Datos generales ══ */}
        {currentStep === 1 && renderStep1Fields(form, handleFieldChange)}

        {/* ══ STEP 2: Servicios ══ */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Expandable summary: step 1 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => (summary1Expanded ? closeSummary1() : openSummary1())}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos generales</span>
                  {!summary1Expanded && (
                    <p className="mt-0.5 truncate text-sm text-slate-700">
                      <span className="font-medium">{form.name || "—"}</span>
                      {form.client && <span className="text-slate-500"> · {form.client}</span>}
                      <span className="text-slate-400"> · {form.contract_currency}</span>
                      {form.start_date && form.end_date && (
                        <span className="text-slate-400"> · {fmtDate(form.start_date)} — {fmtDate(form.end_date)}</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600">
                  {summary1Expanded ? "Colapsar" : "Ver más"}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${summary1Expanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  summary1Expanded ? "max-h-[600px]" : "max-h-0"
                }`}
              >
                {summary1Draft && (
                  <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
                    {renderStep1Fields(summary1Draft, handleSummary1DraftChange)}
                    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={closeSummary1}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Cancelar cambios
                      </button>
                      <button
                        type="button"
                        onClick={saveSummary1}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Services section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Servicios asociados</p>
                <button
                  type="button"
                  onClick={startAddingService}
                  disabled={servicesLoading || addingService || serviceOptions.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar servicio
                </button>
              </div>
              {renderServiceList()}
            </div>
          </div>
        )}

        {/* ══ STEP 3: Documento ══ */}
        {currentStep === 3 && (
          <div className="space-y-5">
            {/* Expandable summary: step 1 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => (summary1Expanded ? closeSummary1() : openSummary1())}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos generales</span>
                  {!summary1Expanded && (
                    <p className="mt-0.5 truncate text-sm text-slate-700">
                      <span className="font-medium">{form.name || "—"}</span>
                      {form.client && <span className="text-slate-500"> · {form.client}</span>}
                      <span className="text-slate-400"> · {getDocumentTypeLabel(form.type)} · {getDocumentStateLabel(form.state)} · {form.contract_currency}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600">
                  {summary1Expanded ? "Colapsar" : "Ver más"}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${summary1Expanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  summary1Expanded ? "max-h-[600px]" : "max-h-0"
                }`}
              >
                {summary1Draft && (
                  <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-4">
                    {renderStep1Fields(summary1Draft, handleSummary1DraftChange)}
                    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={closeSummary1}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Cancelar cambios
                      </button>
                      <button
                        type="button"
                        onClick={saveSummary1}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable summary: step 2 */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setSummary2Expanded((prev) => !prev)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/60"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Servicios</span>
                  {!summary2Expanded && (
                    <p className="mt-0.5 text-sm text-slate-700">
                      {form.service_items.length === 0
                        ? <span className="text-slate-400">Sin servicios asociados</span>
                        : <><span className="font-medium">{form.service_items.length} servicio{form.service_items.length !== 1 ? "s" : ""}</span><span className="text-slate-400"> · Total: {form.contract_currency} {fmt(contractTotal)}</span></>
                      }
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-blue-600">
                  {summary2Expanded ? "Colapsar" : "Ver más"}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${summary2Expanded ? "rotate-180" : ""}`} />
                </div>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  summary2Expanded ? "max-h-[800px]" : "max-h-0"
                }`}
              >
                <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Edita los servicios directamente sin retroceder.</p>
                    <button
                      type="button"
                      onClick={startAddingService}
                      disabled={servicesLoading || addingService || serviceOptions.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar
                    </button>
                  </div>
                  {renderServiceList()}
                </div>
              </div>
            </div>

            {/* PDF upload */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Documento PDF
                {!hasValidFile && <span className="ml-1 text-red-500">*</span>}
              </p>

              {editMode && keepOriginalFile && !file && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const badge = getFileTypeBadge(initialData?.file_name ?? "");
                      return (
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge.bg}`}>
                          <span className={`text-xs font-bold ${badge.text}`}>{badge.label}</span>
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium text-slate-700">{initialData?.file_name ?? "Documento actual"}</p>
                      <p className="text-xs text-slate-500">Archivo actual del contrato</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setKeepOriginalFile(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              {file && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const badge = getFileTypeBadge(file.name);
                      return (
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${badge.bg}`}>
                          <span className={`text-xs font-bold ${badge.text}`}>{badge.label}</span>
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-sm font-medium text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                        {editMode && <span className="ml-2 text-blue-600">(Nuevo archivo)</span>}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={removeFile} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              {!file && !keepOriginalFile && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : fileError
                        ? "border-red-300 bg-red-50/30 hover:border-red-400"
                        : "border-slate-300 bg-slate-50/30 hover:border-slate-400"
                  }`}
                >
                  <Upload className={`mx-auto mb-2 h-8 w-8 ${fileError ? "text-red-400" : "text-slate-400"}`} />
                  <p className="mb-1 text-sm text-slate-600">
                    Arrastra tu archivo aquí o{" "}
                    <label className="cursor-pointer font-medium text-blue-600 hover:underline">
                      selecciona un archivo
                      <input type="file" accept=".pdf,.xlsx,.xls,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                  </p>
                  <p className="text-xs text-slate-400">Formatos permitidos: PDF, Excel, Word</p>
                  {fileError && <p className="mt-2 text-xs text-red-500">Debes subir un archivo válido para continuar.</p>}
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step error */}
      {stepError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {stepError}
        </div>
      )}
      </div>{/* end body */}

      {/* ── Navigation (fixed footer) ── */}
      <div className="shrink-0 mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={currentStep === 1 ? onClose : goPrev}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {currentStep === 1 ? "Cancelar" : "← Anterior"}
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
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
