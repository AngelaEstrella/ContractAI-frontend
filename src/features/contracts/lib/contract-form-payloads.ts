import type { Document, DocumentFormData } from "@/types/api.types";
import type { CurrencyType } from "@/types/api.types";

type BuildContractFormDataPayloadOptions = {
  contractTotal: number;
  currency: CurrencyType;
  editMode?: boolean;
  initialData?: Document;
};

export const buildContractFormDataPayload = ({
  contractTotal,
  currency,
  editMode = false,
  initialData,
}: BuildContractFormDataPayloadOptions): DocumentFormData => {
  const payload: DocumentFormData = editMode && initialData ? { ...initialData.form_data } : {};

  delete payload.licenses;
  payload.value = contractTotal;
  payload.currency = currency;

  return payload;
};
