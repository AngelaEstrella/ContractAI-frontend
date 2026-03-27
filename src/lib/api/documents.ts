import type {
  Document,
  DocumentCreateRequest,
  DocumentFileUrlResponse,
  DocumentFormData,
  DocumentServiceItem,
  DocumentUpdateRequest,
  ServiceCatalogItem,
} from "@/types/api.types";
import { createCacheEntry, hasFreshCache, type CacheEntry } from "./cache";
import { DOCUMENTS_CACHE_TTL_MS, TIMEOUTS } from "./constants";
import { fetchAPI, fetchWithFormData } from "./fetch-client";
import { onApiSessionChange } from "./token-store";

let documentsCache: CacheEntry<Document[]> | null = null;
let documentsInFlight: Promise<Document[]> | null = null;
let servicesCache: CacheEntry<ServiceCatalogItem[]> | null = null;
let servicesInFlight: Promise<ServiceCatalogItem[]> | null = null;

const resetDocumentApiState = () => {
  documentsCache = null;
  documentsInFlight = null;
  servicesCache = null;
  servicesInFlight = null;
};

onApiSessionChange(resetDocumentApiState);

const normalizeDocument = (document: Document): Document => ({
  ...document,
  form_data: (document.form_data ?? {}) as DocumentFormData,
  service_items: Array.isArray(document.service_items)
    ? document.service_items
    : ([] as DocumentServiceItem[]),
  file_path: document.file_path ?? null,
  file_name: document.file_name ?? null,
});

const appendDocumentPayload = (
  formData: FormData,
  data: {
    name?: string;
    client?: string;
    type?: Document["type"];
    start_date?: string;
    end_date?: string;
    form_data?: DocumentFormData;
    state?: Document["state"];
    service_items?: DocumentCreateRequest["service_items"];
  },
) => {
  formData.append("document", JSON.stringify(data));
};

export async function uploadDocument(data: DocumentCreateRequest): Promise<Document> {
  const formData = new FormData();
  formData.append("file", data.file);

  appendDocumentPayload(formData, {
    name: data.name,
    client: data.client,
    type: data.type,
    start_date: data.start_date,
    end_date: data.end_date,
    form_data: data.form_data,
    state: data.state,
    service_items: data.service_items ?? [],
  });

  const createdDocument = normalizeDocument(
    await fetchWithFormData<Document>("/documents/", "POST", formData, TIMEOUTS.UPLOAD),
  );

  resetDocumentApiState();
  return createdDocument;
}

export async function getDocuments(): Promise<Document[]> {
  if (hasFreshCache(documentsCache, DOCUMENTS_CACHE_TTL_MS)) {
    return documentsCache.data;
  }

  if (documentsInFlight) {
    return documentsInFlight;
  }

  documentsInFlight = fetchAPI<Document[]>(
    "/documents/",
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  )
    .then((documents) => {
      const normalizedDocuments = documents.map(normalizeDocument);
      documentsCache = createCacheEntry(normalizedDocuments);
      return normalizedDocuments;
    })
    .finally(() => {
      documentsInFlight = null;
    });

  return documentsInFlight;
}

export async function getServices(): Promise<ServiceCatalogItem[]> {
  if (hasFreshCache(servicesCache, DOCUMENTS_CACHE_TTL_MS)) {
    return servicesCache.data;
  }

  if (servicesInFlight) {
    return servicesInFlight;
  }

  servicesInFlight = fetchAPI<ServiceCatalogItem[]>(
    "/documents/services",
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  )
    .then((services) => {
      servicesCache = createCacheEntry(services);
      return services;
    })
    .finally(() => {
      servicesInFlight = null;
    });

  return servicesInFlight;
}

export async function deleteDocument(id: number): Promise<void> {
  const result = await fetchAPI<void>(
    `/documents/${id}`,
    {
      method: "DELETE",
    },
    TIMEOUTS.AUTH,
  );

  resetDocumentApiState();
  return result;
}

export async function getDocumentById(id: number): Promise<Document> {
  const document = await fetchAPI<Document>(
    `/documents/${id}`,
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  );

  return normalizeDocument(document);
}

export async function getDocumentFileUrl(id: number): Promise<string> {
  const response = await fetchAPI<DocumentFileUrlResponse>(
    `/documents/${id}/file-url`,
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  );

  return response.url;
}

export async function updateDocument(id: number, data: DocumentUpdateRequest): Promise<Document> {
  const formData = new FormData();

  if (data.file) {
    formData.append("file", data.file);
  }

  appendDocumentPayload(formData, {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.client !== undefined && { client: data.client }),
    ...(data.type !== undefined && { type: data.type }),
    ...(data.start_date !== undefined && { start_date: data.start_date }),
    ...(data.end_date !== undefined && { end_date: data.end_date }),
    ...(data.form_data !== undefined && { form_data: data.form_data }),
    ...(data.state !== undefined && { state: data.state }),
    ...(data.service_items !== undefined && { service_items: data.service_items }),
  });

  const updatedDocument = normalizeDocument(
    await fetchWithFormData<Document>(`/documents/${id}`, "PATCH", formData, TIMEOUTS.UPLOAD),
  );

  resetDocumentApiState();
  return updatedDocument;
}
