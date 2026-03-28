"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createEmptyServiceItem,
  getInitialContractTotal,
  getServiceOptions,
  parseOptionalNumber,
  type FormState,
  type ServiceItemDraft,
} from "@/features/contracts/lib/contract-form.utils";
import { getServices } from "@/lib/api";
import type {
  Document,
  DocumentServiceItemPayload,
  ServiceCatalogItem,
} from "@/types/api.types";

type UseContractFormServicesOptions = {
  form: FormState;
  initialData?: Document;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
};

type ServiceItemDraftField = keyof Omit<ServiceItemDraft, "key">;

export function useContractFormServices({
  form,
  initialData,
  setForm,
}: UseContractFormServicesOptions) {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoadError, setServicesLoadError] = useState<string | null>(null);
  const [serviceItemsTouched, setServiceItemsTouched] = useState(false);
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

  const handleServiceChange = (key: string, field: ServiceItemDraftField, value: string) => {
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
  };

  const cancelNewService = () => {
    setAddingService(false);
  };

  const saveNewService = (): string | null => {
    const serviceId = parseOptionalNumber(newServiceDraft.service_id);

    if (!serviceId || !Number.isInteger(serviceId) || serviceId <= 0) {
      return "Selecciona un servicio valido.";
    }

    const value = parseOptionalNumber(newServiceDraft.value);

    if (value === undefined || value < 0) {
      return "Ingresa un valor numerico valido.";
    }

    if (!newServiceDraft.start_date || !newServiceDraft.end_date) {
      return "Completa las fechas del servicio.";
    }

    if (new Date(newServiceDraft.end_date) < new Date(newServiceDraft.start_date)) {
      return "La fecha fin no puede ser anterior a la fecha inicio.";
    }

    if (form.service_items.some((item) => item.service_id === newServiceDraft.service_id)) {
      return "Ya existe un servicio con esa seleccion en este contrato.";
    }

    setServiceItemsTouched(true);
    setForm((previous) => ({
      ...previous,
      service_items: [...previous.service_items, { ...newServiceDraft }],
    }));
    setAddingService(false);

    return null;
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
        currency: form.contract_currency,
        description: item.description.trim() || undefined,
        end_date: item.end_date,
        service_id: serviceId,
        start_date: item.start_date,
        value,
      } satisfies DocumentServiceItemPayload;
    });

    const ids = new Set(parsedItems.map((item) => item.service_id));

    if (ids.size !== parsedItems.length) {
      throw new Error("No puedes repetir el mismo servicio dentro del contrato.");
    }

    return parsedItems;
  };

  return {
    addingService,
    buildServiceItemsPayload,
    cancelNewService,
    contractTotal,
    editingServiceKey,
    handleNewDraftChange,
    handleServiceChange,
    newServiceDraft,
    removeServiceItem,
    saveNewService,
    serviceOptions,
    servicesLoadError,
    servicesLoading,
    setEditingServiceKey,
    startAddingService,
  };
}
