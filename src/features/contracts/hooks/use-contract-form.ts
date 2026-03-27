"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildFormState,
  createEmptyServiceItem,
  getInitialContractTotal,
  getServiceOptions,
  isAllowedFile,
  parseOptionalNumber,
  type FormState,
  type ServiceItemDraft,
  type Step1Draft,
} from "@/features/contracts/lib/contract-form.utils";
import { getServices, updateDocument, uploadDocument } from "@/lib/api";
import type {
  Document,
  DocumentFormData,
  DocumentServiceItemPayload,
  ServiceCatalogItem,
} from "@/types/api.types";

export type ContractFormStep = 1 | 2 | 3;
type ServiceItemDraftField = keyof Omit<ServiceItemDraft, "key">;

type ContractFormProps = {
  readonly editMode?: boolean;
  readonly initialData?: Document;
  readonly onAdd: (contract: Document) => void;
  readonly onClose: () => void;
};

type FieldChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

export function useContractForm({
  editMode = false,
  initialData,
  onAdd,
  onClose,
}: ContractFormProps) {
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

  const [currentStep, setCurrentStep] = useState<ContractFormStep>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [summary1Expanded, setSummary1Expanded] = useState(false);
  const [summary2Expanded, setSummary2Expanded] = useState(false);
  const [summary1Draft, setSummary1Draft] = useState<Step1Draft | null>(null);
  const [summary1Snapshot, setSummary1Snapshot] = useState<Step1Draft | null>(null);

  const [addingService, setAddingService] = useState(false);
  const [newServiceDraft, setNewServiceDraft] = useState<ServiceItemDraft>(() =>
    createEmptyServiceItem("", ""),
  );
  const [editingServiceKey, setEditingServiceKey] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setServicesLoading(true);
        setServicesLoadError(null);
        setServices(await getServices());
      } catch (err) {
        setServicesLoadError(
          err instanceof Error ? err.message : "No se pudo cargar el catalogo de servicios.",
        );
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

  const initialTotalFallback = useMemo(
    () => getInitialContractTotal(initialData),
    [initialData],
  );

  const serviceOptions = useMemo(
    () => getServiceOptions(services, form.service_items),
    [form.service_items, services],
  );

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

  const handleFieldChange = (event: FieldChangeEvent) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleServiceChange = (
    key: string,
    field: ServiceItemDraftField,
    value: string,
  ) => {
    setServiceItemsTouched(true);
    setForm((previous) => ({
      ...previous,
      service_items: previous.service_items.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleNewDraftChange = (field: ServiceItemDraftField, value: string) => {
    setNewServiceDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
      setKeepOriginalFile(false);
      setFileError(false);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
      return;
    }

    if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      const droppedFile = event.dataTransfer.files[0];

      if (isAllowedFile(droppedFile.name)) {
        setFile(droppedFile);
        setKeepOriginalFile(false);
        setFileError(false);
        return;
      }

      setError("Formato no permitido. Usa PDF, Excel (.xlsx/.xls) o Word (.doc/.docx).");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(false);

    if (editMode && (initialData?.file_name || initialData?.file_path)) {
      setKeepOriginalFile(true);
    }
  };

  const removeServiceItem = (key: string) => {
    setServiceItemsTouched(true);

    if (editingServiceKey === key) {
      setEditingServiceKey(null);
    }

    setForm((previous) => ({
      ...previous,
      service_items: previous.service_items.filter((item) => item.key !== key),
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
      setStepError("Selecciona un servicio valido.");
      return;
    }

    const value = parseOptionalNumber(newServiceDraft.value);

    if (value === undefined || value < 0) {
      setStepError("Ingresa un valor numerico valido.");
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
      setStepError("Ya existe un servicio con esa seleccion en este contrato.");
      return;
    }

    setServiceItemsTouched(true);
    setForm((previous) => ({
      ...previous,
      service_items: [...previous.service_items, { ...newServiceDraft }],
    }));
    setStepError(null);
    setAddingService(false);
  };

  const buildFormDataPayload = (): DocumentFormData => {
    const payload: DocumentFormData = editMode && initialData ? { ...initialData.form_data } : {};

    delete payload.licenses;
    payload.value = contractTotal;
    payload.currency = form.contract_currency;

    return payload;
  };

  const buildServiceItemsPayload = (): DocumentServiceItemPayload[] => {
    const nonEmptyItems = form.service_items.filter((item) =>
      [item.service_id, item.description, item.value, item.start_date, item.end_date].some(
        (value) => value.trim() !== "",
      ),
    );

    const parsedItems = nonEmptyItems.map((item, index) => {
      const serviceId = parseOptionalNumber(item.service_id);
      const value = parseOptionalNumber(item.value);

      if (!serviceId || !Number.isInteger(serviceId) || serviceId <= 0) {
        throw new Error(`Selecciona un servicio valido en la fila ${index + 1}.`);
      }

      if (value === undefined || value < 0) {
        throw new Error(`Ingresa un valor valido para el servicio en la fila ${index + 1}.`);
      }

      if (!item.start_date || !item.end_date) {
        throw new Error(`Completa las fechas del servicio en la fila ${index + 1}.`);
      }

      if (new Date(item.end_date) < new Date(item.start_date)) {
        throw new Error(`La fecha fin del servicio ${index + 1} no puede ser anterior a la fecha inicio.`);
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

    const ids = new Set(parsedItems.map((item) => item.service_id));

    if (ids.size !== parsedItems.length) {
      throw new Error("No puedes repetir el mismo servicio dentro del contrato.");
    }

    return parsedItems;
  };

  const validateStep1 = (): string | null => {
    if (!form.name.trim()) {
      return "Debes ingresar el nombre del contrato.";
    }

    if (!form.client.trim()) {
      return "Debes ingresar el cliente asociado.";
    }

    if (!form.start_date || !form.end_date) {
      return "Debes completar las fechas de inicio y vencimiento.";
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      return "La fecha de vencimiento no puede ser anterior a la de inicio.";
    }

    return null;
  };

  const navigateToStep = (step: ContractFormStep) => {
    setVisible(false);

    window.setTimeout(() => {
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
      const validationError = validateStep1();

      if (validationError) {
        setStepError(validationError);
        return;
      }

      navigateToStep(2);
      return;
    }

    if (currentStep === 2) {
      if (addingService) {
        setStepError("Guarda o cancela el servicio actual antes de continuar.");
        return;
      }

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
    navigateToStep((currentStep - 1) as ContractFormStep);
  };

  const openSummary1 = () => {
    const snapshot: Step1Draft = {
      name: form.name,
      client: form.client,
      type: form.type,
      state: form.state,
      start_date: form.start_date,
      end_date: form.end_date,
      contract_currency: form.contract_currency,
    };

    setSummary1Draft(snapshot);
    setSummary1Snapshot(snapshot);
    setSummary1Expanded(true);
  };

  const closeSummary1 = () => {
    if (
      summary1Draft &&
      summary1Snapshot &&
      JSON.stringify(summary1Draft) !== JSON.stringify(summary1Snapshot) &&
      !window.confirm("¿Descartar los cambios realizados en Datos generales?")
    ) {
      return;
    }

    setSummary1Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
  };

  const saveSummary1 = () => {
    if (summary1Draft) {
      setForm((previous) => ({ ...previous, ...summary1Draft }));
    }

    setSummary1Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
  };

  const handleSummary1DraftChange = (event: FieldChangeEvent) => {
    const { name, value } = event.target;
    setSummary1Draft((previous) => (previous ? { ...previous, [name]: value } : previous));
  };

  const handleSubmit = async () => {
    if (!hasValidFile) {
      setFileError(true);
      setError("Debes tener un archivo PDF asociado al contrato.");
      return;
    }

    if (!editMode && !file) {
      setFileError(true);
      setError("Debes seleccionar un archivo.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFileError(false);

      const formDataPayload = buildFormDataPayload();
      const serviceItemsPayload = buildServiceItemsPayload();

      const result = editMode && initialData
        ? await updateDocument(initialData.id, {
            name: form.name.trim(),
            client: form.client.trim(),
            type: form.type,
            start_date: form.start_date,
            end_date: form.end_date,
            state: form.state,
            form_data: formDataPayload,
            service_items: serviceItemsPayload,
            file: file || undefined,
          })
        : await uploadDocument({
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

      onAdd(result);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Error al ${editMode ? "actualizar" : "crear"} contrato`,
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    addingService,
    cancelNewService,
    closeSummary1,
    contractTotal,
    currentStep,
    dragActive,
    editingServiceKey,
    error,
    file,
    fileError,
    form,
    goNext,
    goPrev,
    handleDrag,
    handleDrop,
    handleFieldChange,
    handleFileChange,
    handleNewDraftChange,
    handleServiceChange,
    handleSubmit,
    handleSummary1DraftChange,
    hasValidFile,
    keepOriginalFile,
    loading,
    newServiceDraft,
    openSummary1,
    removeFile,
    removeServiceItem,
    saveNewService,
    saveSummary1,
    serviceOptions,
    servicesLoadError,
    servicesLoading,
    setEditingServiceKey,
    setKeepOriginalFile,
    setSummary2Expanded,
    startAddingService,
    stepError,
    summary1Draft,
    summary1Expanded,
    summary2Expanded,
    visible,
  };
}
