import { HelpCircle } from "lucide-react";
import { getDocumentPrimaryCurrency, getDocumentTotalValue } from "@/lib/document.utils";
import type {
  CurrencyType,
  Document,
  DocumentState,
  DocumentType,
  ServiceCatalogItem,
} from "@/types/api.types";

export type ServiceItemDraft = {
  key: string;
  service_id: string;
  description: string;
  value: string;
  start_date: string;
  end_date: string;
};

export type FormState = {
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  state: DocumentState;
  contract_currency: CurrencyType;
  service_items: ServiceItemDraft[];
};

export type Step1Draft = Pick<
  FormState,
  "name" | "client" | "type" | "state" | "start_date" | "end_date" | "contract_currency"
>;

const ALLOWED_EXTENSIONS = new Set(["pdf", "xlsx", "xls", "doc", "docx"]);

const createDraftKey = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

const getFileExt = (filename: string): string => filename.split(".").pop()?.toLowerCase() ?? "";

export const createEmptyServiceItem = (start: string, end: string): ServiceItemDraft => ({
  key: createDraftKey(),
  service_id: "",
  description: "",
  value: "",
  start_date: start,
  end_date: end,
});

export const buildFormState = (document?: Document): FormState => ({
  name: document?.name ?? "",
  client: document?.client ?? "",
  type: document?.type ?? "SERVICES",
  start_date: document?.start_date ?? "",
  end_date: document?.end_date ?? "",
  state: document?.state ?? "ACTIVE",
  contract_currency: document ? (getDocumentPrimaryCurrency(document) ?? "USD") : "USD",
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

export const parseOptionalNumber = (value: string): number | undefined => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const parsedNumber = Number(trimmedValue);
  return Number.isFinite(parsedNumber) ? parsedNumber : undefined;
};

export const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatFormDate = (date: string): string => {
  if (!date) {
    return "-";
  }

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

export const isAllowedFile = (filename: string): boolean => ALLOWED_EXTENSIONS.has(getFileExt(filename));

export const getFileTypeBadge = (
  filename: string,
): { label: string; bg: string; text: string } => {
  const extension = getFileExt(filename);

  if (extension === "pdf") {
    return { label: "PDF", bg: "bg-red-100", text: "text-red-600" };
  }

  if (extension === "xlsx" || extension === "xls") {
    return { label: "XLS", bg: "bg-green-100", text: "text-green-600" };
  }

  if (extension === "doc" || extension === "docx") {
    return { label: "DOC", bg: "bg-blue-100", text: "text-blue-600" };
  }

  return { label: "FILE", bg: "bg-slate-100", text: "text-slate-600" };
};

export const getServiceOptions = (
  services: ServiceCatalogItem[],
  draftItems: ServiceItemDraft[],
): ServiceCatalogItem[] => {
  const servicesById = new Map<string, ServiceCatalogItem>();

  services.forEach((service) => {
    servicesById.set(String(service.id), service);
  });

  draftItems.forEach((item) => {
    if (item.service_id && !servicesById.has(item.service_id)) {
      servicesById.set(item.service_id, {
        id: Number(item.service_id),
        name: `Servicio #${item.service_id}`,
      });
    }
  });

  return Array.from(servicesById.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
};

export const getInitialContractTotal = (document?: Document): number => {
  return document ? getDocumentTotalValue(document) : 0;
};

export function HelpTip({ text }: { readonly text: string }) {
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
