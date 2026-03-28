"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import {
  X,
  Upload,
  FilePlus,
  User,
  Building2,
  FileText,
  AlertCircle,
  Download,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import type { Document } from "@/types/api.types";
import { getDocumentFileUrl } from "@/lib/api/documents";
import {
  getTemplates,
  generateWorkerContract,
  type WorkerContractFormData,
} from "@/lib/api/templates";

const ContractForm = dynamic(
  () => import("@/features/contracts/components/form/ContractForm"),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          Cargando formulario...
        </div>
      </div>
    ),
  },
);

// ── Types ──────────────────────────────────────────────────────────────────

type Flow = "select-action" | "upload" | "select-type" | "generate-worker";
type PreviewState = "idle" | "loading" | "success" | "error";

type WorkerFormFields = {
  // Datos del trabajador
  trabajador_nombre: string;
  trabajador_dni: string;
  trabajador_domicilio: string;
  trabajador_actividades: string;
  // Modalidad
  forma_contratacion: string;
  modalidad_y_causas_contratacion: string;
  contrato_duracion: string;
  contrato_fecha_inicio: string;
  contrato_fecha_fin: string;
  // Remuneración
  remuneracion_monto: string;
  remuneracion_periodicidad: string;
  // Horario
  horario_dias: string;
  horario_horas: string;
  refrigerio_duracion: string;
  refrigerio_inicio: string;
  refrigerio_fin: string;
};

type WorkerFormErrors = Partial<Record<keyof WorkerFormFields, string>>;

export type NewContractModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (contract: Document) => void;
};

// ── Constants ──────────────────────────────────────────────────────────────

const INITIAL_FORM: WorkerFormFields = {
  trabajador_nombre: "",
  trabajador_dni: "",
  trabajador_domicilio: "",
  trabajador_actividades: "",
  forma_contratacion: "",
  modalidad_y_causas_contratacion: "",
  contrato_duracion: "",
  contrato_fecha_inicio: "",
  contrato_fecha_fin: "",
  remuneracion_monto: "",
  remuneracion_periodicidad: "",
  horario_dias: "",
  horario_horas: "",
  refrigerio_duracion: "",
  refrigerio_inicio: "",
  refrigerio_fin: "",
};

const FORMA_OPTIONS = [
  { value: "temporal", label: "Temporal" },
  { value: "accidental", label: "Accidental" },
  { value: "para obra o servicio", label: "Para obra o servicio" },
  { value: "de suplencia", label: "De suplencia" },
  { value: "de emergencia", label: "De emergencia" },
  { value: "intermitente", label: "Intermitente" },
  { value: "de temporada", label: "De temporada" },
];

const PERIODICIDAD_OPTIONS = [
  { value: "mensual", label: "Mensual" },
  { value: "quincenal", label: "Quincenal" },
  { value: "semanal", label: "Semanal" },
];

// ── Validation ─────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof WorkerFormFields)[] = [
  "trabajador_nombre",
  "trabajador_dni",
  "trabajador_domicilio",
  "trabajador_actividades",
  "forma_contratacion",
  "modalidad_y_causas_contratacion",
  "contrato_duracion",
  "contrato_fecha_inicio",
  "contrato_fecha_fin",
  "remuneracion_monto",
  "remuneracion_periodicidad",
  "horario_dias",
  "horario_horas",
  "refrigerio_duracion",
  "refrigerio_inicio",
  "refrigerio_fin",
];

function validateForm(form: WorkerFormFields): WorkerFormErrors {
  const errors: WorkerFormErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (!form[field].trim()) {
      errors[field] = "Campo requerido";
    }
  }

  if (form.trabajador_dni && !/^\d{8}$/.test(form.trabajador_dni.trim())) {
    errors.trabajador_dni = "El DNI debe tener 8 dígitos";
  }

  if (form.remuneracion_monto && (isNaN(Number(form.remuneracion_monto)) || Number(form.remuneracion_monto) <= 0)) {
    errors.remuneracion_monto = "Debe ser un monto mayor a 0";
  }

  if (form.refrigerio_duracion && (isNaN(Number(form.refrigerio_duracion)) || Number(form.refrigerio_duracion) <= 0)) {
    errors.refrigerio_duracion = "Debe ser un número mayor a 0";
  }

  if (
    form.contrato_fecha_inicio &&
    form.contrato_fecha_fin &&
    form.contrato_fecha_fin <= form.contrato_fecha_inicio
  ) {
    errors.contrato_fecha_fin = "Debe ser posterior a la fecha de inicio";
  }

  return errors;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Tipo de acción", "Tipo de contrato", "Datos del contrato"];

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-1.5 px-7 pb-3 pt-6">
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = step === current;
        const isDone = step < current;

        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isDone
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {isDone ? "✓" : step}
            </div>
            <span className={`text-xs font-medium ${isActive ? "text-slate-700" : "text-slate-400"}`}>
              {label}
            </span>
            {index < steps.length - 1 && (
              <div className={`h-px w-4 ${isDone ? "bg-blue-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectionCard({
  icon,
  title,
  description,
  badge,
  disabled,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: { label: string; colorClass: string };
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 p-7 text-center transition-all duration-150 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
          : "border-slate-200 bg-white hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      {badge && (
        <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.colorClass}`}>
          {badge.label}
        </span>
      )}
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${disabled ? "bg-slate-100" : "bg-blue-50"}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className={`text-sm font-semibold ${disabled ? "text-slate-400" : "text-slate-800"}`}>{title}</p>
        <p className={`text-xs leading-relaxed ${disabled ? "text-slate-400" : "text-slate-500"}`}>{description}</p>
      </div>
    </button>
  );
}

const BASE_INPUT =
  "w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:ring-2";
const NORMAL_INPUT = `${BASE_INPUT} border-slate-200 bg-slate-50/50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/20`;
const ERROR_INPUT = `${BASE_INPUT} border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20`;

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</p>
      <div className="flex-1 border-t border-slate-100" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function NewContractModal({ open, onClose, onSubmit }: NewContractModalProps) {
  const [flow, setFlow] = useState<Flow>("select-action");
  const [form, setForm] = useState<WorkerFormFields>(INITIAL_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof WorkerFormFields, boolean>>>({});
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<Document | null>(null);

  const allErrors = useMemo(() => validateForm(form), [form]);
  const isFormValid = useMemo(() => Object.keys(allErrors).length === 0, [allErrors]);

  const visibleErrors = useMemo<WorkerFormErrors>(() => {
    const result: WorkerFormErrors = {};
    for (const key of Object.keys(touched) as (keyof WorkerFormFields)[]) {
      if (touched[key] && allErrors[key]) result[key] = allErrors[key];
    }
    return result;
  }, [allErrors, touched]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setFlow("select-action");
      setForm(INITIAL_FORM);
      setTouched({});
      setPreviewState("idle");
      setPreviewUrl(null);
      setPreviewError(null);
      setGeneratedDoc(null);
    }, 300);
  }, [onClose]);

  const setField = useCallback((field: keyof WorkerFormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const blurField = useCallback((field: keyof WorkerFormFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const touchAllFields = useCallback(() => {
    const all: Partial<Record<keyof WorkerFormFields, boolean>> = {};
    for (const key of Object.keys(INITIAL_FORM) as (keyof WorkerFormFields)[]) {
      all[key] = true;
    }
    setTouched(all);
  }, []);

  const handleGenerate = useCallback(async () => {
    touchAllFields();
    if (!isFormValid) return;

    setPreviewState("loading");
    setPreviewError(null);
    setPreviewUrl(null);

    try {
      const templates = await getTemplates();
      if (templates.length === 0) throw new Error("No hay plantillas disponibles");

      const template =
        templates.find(
          (t) =>
            t.name.toLowerCase().includes("trabajador") ||
            t.name.toLowerCase().includes("worker") ||
            t.name.toLowerCase().includes("laboral"),
        ) ?? templates[0];

      const MESES_ES = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
      ];
      const now = new Date();

      const payload: WorkerContractFormData = {
        trabajador_nombre: form.trabajador_nombre,
        trabajador_dni: form.trabajador_dni,
        trabajador_domicilio: form.trabajador_domicilio,
        trabajador_actividades: form.trabajador_actividades,
        forma_contratacion: form.forma_contratacion,
        modalidad_y_causas_contratacion: form.modalidad_y_causas_contratacion,
        contrato_duracion: form.contrato_duracion,
        contrato_fecha_inicio: form.contrato_fecha_inicio,
        contrato_fecha_fin: form.contrato_fecha_fin,
        remuneracion_monto: form.remuneracion_monto,
        remuneracion_periodicidad: form.remuneracion_periodicidad,
        horario_dias: form.horario_dias,
        horario_horas: form.horario_horas,
        refrigerio_duracion: form.refrigerio_duracion,
        refrigerio_inicio: form.refrigerio_inicio,
        refrigerio_fin: form.refrigerio_fin,
        dia_firma: String(now.getDate()),
        mes_firma: MESES_ES[now.getMonth()],
        anio_firma: String(now.getFullYear()),
      };

      const doc = await generateWorkerContract(template.id, payload);
      setGeneratedDoc(doc);
      onSubmit(doc);

      const url = await getDocumentFileUrl(doc.id);
      setPreviewUrl(url);
      setPreviewState("success");
    } catch (err) {
      setPreviewState("error");
      setPreviewError(err instanceof Error ? err.message : "Error al generar el contrato");
    }
  }, [form, isFormValid, touchAllFields, onSubmit]);

  if (!open) return null;

  const modalSizeClass =
    flow === "generate-worker"
      ? "h-[90vh] max-h-[820px] w-full max-w-[1100px]"
      : "h-[560px] w-full max-w-[650px]";

  const stepNum: 1 | 2 | 3 =
    flow === "select-type" ? 2 : flow === "generate-worker" ? 3 : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={`relative flex flex-col rounded-2xl bg-white shadow-2xl ${modalSizeClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
        >
          <X className="h-5 w-5" />
        </button>

        {flow !== "upload" && <StepIndicator current={stepNum} />}

        {/* ── PASO 1: Selector de acción ── */}
        {flow === "select-action" && (
          <div className="flex min-h-0 flex-1 flex-col px-7 pb-7">
            <h2 className="mb-1 text-xl font-semibold text-slate-800">Nuevo Contrato</h2>
            <p className="mb-5 text-sm text-slate-500">¿Cómo quieres agregar el contrato?</p>
            <div className="grid flex-1 grid-cols-2 gap-4">
              <SelectionCard
                icon={<Upload className="h-7 w-7 text-blue-600" />}
                title="Subir contrato existente"
                description="Carga un PDF ya firmado o en proceso"
                onClick={() => setFlow("upload")}
              />
              <SelectionCard
                icon={<FilePlus className="h-7 w-7 text-blue-600" />}
                title="Generar nuevo contrato"
                description="Crea un contrato desde plantilla"
                onClick={() => setFlow("select-type")}
              />
            </div>
          </div>
        )}

        {/* ── Upload: formulario existente ── */}
        {flow === "upload" && (
          <ContractForm onAdd={onSubmit} onClose={() => setFlow("select-action")} />
        )}

        {/* ── PASO 2: Selector de tipo de contrato ── */}
        {flow === "select-type" && (
          <div className="flex min-h-0 flex-1 flex-col px-7 pb-7">
            <h2 className="mb-1 text-xl font-semibold text-slate-800">Tipo de contrato</h2>
            <p className="mb-5 text-sm text-slate-500">Selecciona el tipo de contrato a generar</p>
            <div className="grid flex-1 grid-cols-2 gap-4">
              <SelectionCard
                icon={<User className="h-7 w-7 text-blue-600" />}
                title="Contrato con trabajador"
                description="Contrato laboral, prestación de servicios, prácticas"
                onClick={() => setFlow("generate-worker")}
              />
              <SelectionCard
                icon={<Building2 className="h-7 w-7 text-slate-400" />}
                title="Contrato con cliente"
                description="Servicios comerciales, acuerdos B2B"
                disabled
                badge={{ label: "Próximamente", colorClass: "bg-amber-100 text-amber-700" }}
              />
            </div>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setFlow("select-action")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Formulario + Split View ── */}
        {flow === "generate-worker" && (
          <div className="flex min-h-0 flex-1 overflow-hidden rounded-b-2xl">

            {/* Panel izquierdo: formulario */}
            <div className="flex w-1/2 flex-col border-r border-slate-200 px-6 pb-5">
              <h2 className="mb-0.5 text-lg font-semibold text-slate-800">Datos del contrato</h2>
              <p className="mb-4 text-xs text-slate-500">
                Todos los campos marcados con <span className="text-red-500">*</span> son requeridos
              </p>

              {/* Campos — scrollable */}
              <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1">

                <SectionTitle>Trabajador</SectionTitle>

                <Field label="Nombre completo" required error={visibleErrors.trabajador_nombre}>
                  <input
                    type="text"
                    value={form.trabajador_nombre}
                    placeholder="Ej: Juan García López"
                    className={visibleErrors.trabajador_nombre ? ERROR_INPUT : NORMAL_INPUT}
                    onChange={(e) => setField("trabajador_nombre", e.target.value)}
                    onBlur={() => blurField("trabajador_nombre")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="DNI" required error={visibleErrors.trabajador_dni}>
                    <input
                      type="text"
                      value={form.trabajador_dni}
                      placeholder="12345678"
                      maxLength={8}
                      className={visibleErrors.trabajador_dni ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("trabajador_dni", e.target.value.replace(/\D/g, ""))}
                      onBlur={() => blurField("trabajador_dni")}
                    />
                  </Field>

                  <Field label="Domicilio" required error={visibleErrors.trabajador_domicilio}>
                    <input
                      type="text"
                      value={form.trabajador_domicilio}
                      placeholder="Dirección completa"
                      className={visibleErrors.trabajador_domicilio ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("trabajador_domicilio", e.target.value)}
                      onBlur={() => blurField("trabajador_domicilio")}
                    />
                  </Field>
                </div>

                <Field label="Actividades / funciones" required error={visibleErrors.trabajador_actividades}>
                  <textarea
                    value={form.trabajador_actividades}
                    placeholder="Describe las actividades que realizará el trabajador"
                    rows={2}
                    className={`${visibleErrors.trabajador_actividades ? ERROR_INPUT : NORMAL_INPUT} resize-none`}
                    onChange={(e) => setField("trabajador_actividades", e.target.value)}
                    onBlur={() => blurField("trabajador_actividades")}
                  />
                </Field>

                <SectionTitle>Modalidad del contrato</SectionTitle>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Forma de contratación" required error={visibleErrors.forma_contratacion}>
                    <select
                      value={form.forma_contratacion}
                      className={visibleErrors.forma_contratacion ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("forma_contratacion", e.target.value)}
                      onBlur={() => blurField("forma_contratacion")}
                    >
                      <option value="">Seleccionar...</option>
                      {FORMA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Duración del contrato" required error={visibleErrors.contrato_duracion}>
                    <input
                      type="text"
                      value={form.contrato_duracion}
                      placeholder="Ej: 6 meses, 1 año"
                      className={visibleErrors.contrato_duracion ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("contrato_duracion", e.target.value)}
                      onBlur={() => blurField("contrato_duracion")}
                    />
                  </Field>
                </div>

                <Field label="Modalidad y causas de contratación" required error={visibleErrors.modalidad_y_causas_contratacion}>
                  <textarea
                    value={form.modalidad_y_causas_contratacion}
                    placeholder="Ej: Contrato por necesidades de mercado para cubrir incremento de producción"
                    rows={2}
                    className={`${visibleErrors.modalidad_y_causas_contratacion ? ERROR_INPUT : NORMAL_INPUT} resize-none`}
                    onChange={(e) => setField("modalidad_y_causas_contratacion", e.target.value)}
                    onBlur={() => blurField("modalidad_y_causas_contratacion")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fecha de inicio" required error={visibleErrors.contrato_fecha_inicio}>
                    <input
                      type="date"
                      value={form.contrato_fecha_inicio}
                      className={visibleErrors.contrato_fecha_inicio ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("contrato_fecha_inicio", e.target.value)}
                      onBlur={() => blurField("contrato_fecha_inicio")}
                    />
                  </Field>

                  <Field label="Fecha de fin" required error={visibleErrors.contrato_fecha_fin}>
                    <input
                      type="date"
                      value={form.contrato_fecha_fin}
                      min={form.contrato_fecha_inicio || undefined}
                      className={visibleErrors.contrato_fecha_fin ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("contrato_fecha_fin", e.target.value)}
                      onBlur={() => blurField("contrato_fecha_fin")}
                    />
                  </Field>
                </div>

                <SectionTitle>Remuneración</SectionTitle>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Monto" required error={visibleErrors.remuneracion_monto}>
                    <input
                      type="number"
                      value={form.remuneracion_monto}
                      placeholder="Ej: 2500"
                      min="0"
                      step="0.01"
                      className={visibleErrors.remuneracion_monto ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("remuneracion_monto", e.target.value)}
                      onBlur={() => blurField("remuneracion_monto")}
                    />
                  </Field>

                  <Field label="Periodicidad" required error={visibleErrors.remuneracion_periodicidad}>
                    <select
                      value={form.remuneracion_periodicidad}
                      className={visibleErrors.remuneracion_periodicidad ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("remuneracion_periodicidad", e.target.value)}
                      onBlur={() => blurField("remuneracion_periodicidad")}
                    >
                      <option value="">Seleccionar...</option>
                      {PERIODICIDAD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <SectionTitle>Horario de trabajo</SectionTitle>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Días de trabajo" required error={visibleErrors.horario_dias}>
                    <input
                      type="text"
                      value={form.horario_dias}
                      placeholder="Ej: lunes a viernes"
                      className={visibleErrors.horario_dias ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("horario_dias", e.target.value)}
                      onBlur={() => blurField("horario_dias")}
                    />
                  </Field>

                  <Field label="Horas de trabajo" required error={visibleErrors.horario_horas}>
                    <input
                      type="text"
                      value={form.horario_horas}
                      placeholder="Ej: 9:00 a 18:00"
                      className={visibleErrors.horario_horas ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("horario_horas", e.target.value)}
                      onBlur={() => blurField("horario_horas")}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Refrigerio (min)" required error={visibleErrors.refrigerio_duracion}>
                    <input
                      type="number"
                      value={form.refrigerio_duracion}
                      placeholder="60"
                      min="1"
                      className={visibleErrors.refrigerio_duracion ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("refrigerio_duracion", e.target.value)}
                      onBlur={() => blurField("refrigerio_duracion")}
                    />
                  </Field>

                  <Field label="Inicio refrigerio" required error={visibleErrors.refrigerio_inicio}>
                    <input
                      type="time"
                      value={form.refrigerio_inicio}
                      className={visibleErrors.refrigerio_inicio ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("refrigerio_inicio", e.target.value)}
                      onBlur={() => blurField("refrigerio_inicio")}
                    />
                  </Field>

                  <Field label="Fin refrigerio" required error={visibleErrors.refrigerio_fin}>
                    <input
                      type="time"
                      value={form.refrigerio_fin}
                      className={visibleErrors.refrigerio_fin ? ERROR_INPUT : NORMAL_INPUT}
                      onChange={(e) => setField("refrigerio_fin", e.target.value)}
                      onBlur={() => blurField("refrigerio_fin")}
                    />
                  </Field>
                </div>

              </div>

              {/* Botones */}
              <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFlow("select-type")}
                  disabled={previewState === "loading"}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleGenerate();
                  }}
                  disabled={previewState === "loading"}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {previewState === "loading" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generar contrato
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Panel derecho: vista previa del PDF */}
            <div className="flex w-1/2 flex-col bg-slate-50/50">

              {previewState === "idle" && (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Vista previa</p>
                  <p className="max-w-[200px] text-xs leading-relaxed text-slate-400">
                    Completa el formulario y genera el contrato para ver la vista previa
                  </p>
                </div>
              )}

              {previewState === "loading" && (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  <p className="text-sm text-slate-500">Generando contrato...</p>
                </div>
              )}

              {previewState === "success" && previewUrl && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Vista previa</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {generatedDoc?.state ?? "Activo"}
                      </span>
                    </div>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Descargar PDF
                    </a>
                  </div>
                  <iframe
                    src={previewUrl}
                    className="flex-1"
                    title="Vista previa del contrato"
                  />
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(INITIAL_FORM);
                        setTouched({});
                        setPreviewState("idle");
                        setPreviewUrl(null);
                        setGeneratedDoc(null);
                        setFlow("select-action");
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Crear otro contrato
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                    >
                      Listo, cerrar
                    </button>
                  </div>
                </div>
              )}

              {previewState === "error" && (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-800">Error al generar</p>
                  <p className="max-w-[200px] text-xs leading-relaxed text-slate-500">
                    {previewError ?? "Ocurrió un error inesperado. Intenta de nuevo."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewState("idle");
                      setPreviewError(null);
                    }}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reintentar
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
