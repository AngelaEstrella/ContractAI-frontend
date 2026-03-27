"use client";

import { useCallback, useState } from "react";
import type { FormState, Step1Draft } from "@/features/contracts/lib/contract-form.utils";

export type ContractFormStep = 1 | 2 | 3;

type UseContractFormWizardOptions = {
  form: FormState;
  onBeforePrev?: () => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  validateStep2: () => string | null;
};

type FieldChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

export function useContractFormWizard({
  form,
  onBeforePrev,
  setForm,
  validateStep2,
}: UseContractFormWizardOptions) {
  const [currentStep, setCurrentStep] = useState<ContractFormStep>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [summary1Expanded, setSummary1Expanded] = useState(false);
  const [summary2Expanded, setSummary2Expanded] = useState(false);
  const [summary1Draft, setSummary1Draft] = useState<Step1Draft | null>(null);
  const [summary1Snapshot, setSummary1Snapshot] = useState<Step1Draft | null>(null);

  const validateStep1 = useCallback((): string | null => {
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
  }, [form.client, form.end_date, form.name, form.start_date]);

  const navigateToStep = useCallback((step: ContractFormStep) => {
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
  }, []);

  const goNext = useCallback(() => {
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
      const step2Error = validateStep2();

      if (step2Error) {
        setStepError(step2Error);
        return;
      }

      navigateToStep(3);
    }
  }, [currentStep, navigateToStep, validateStep1, validateStep2]);

  const goPrev = useCallback(() => {
    onBeforePrev?.();
    navigateToStep((currentStep - 1) as ContractFormStep);
  }, [currentStep, navigateToStep, onBeforePrev]);

  const openSummary1 = useCallback(() => {
    const snapshot: Step1Draft = {
      client: form.client,
      contract_currency: form.contract_currency,
      end_date: form.end_date,
      name: form.name,
      start_date: form.start_date,
      state: form.state,
      type: form.type,
    };

    setSummary1Draft(snapshot);
    setSummary1Snapshot(snapshot);
    setSummary1Expanded(true);
  }, [form]);

  const closeSummary1 = useCallback(() => {
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
  }, [summary1Draft, summary1Snapshot]);

  const saveSummary1 = useCallback(() => {
    if (summary1Draft) {
      setForm((previous) => ({ ...previous, ...summary1Draft }));
    }

    setSummary1Expanded(false);
    setSummary1Draft(null);
    setSummary1Snapshot(null);
  }, [setForm, summary1Draft]);

  const handleSummary1DraftChange = useCallback((event: FieldChangeEvent) => {
    const { name, value } = event.target;
    setSummary1Draft((previous) => (previous ? { ...previous, [name]: value } : previous));
  }, []);

  return {
    closeSummary1,
    currentStep,
    goNext,
    goPrev,
    handleSummary1DraftChange,
    openSummary1,
    saveSummary1,
    setStepError,
    setSummary2Expanded,
    stepError,
    summary1Draft,
    summary1Expanded,
    summary2Expanded,
    visible,
  };
}
