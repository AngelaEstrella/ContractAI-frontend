import type { Document } from "@/types/api.types";

const PDF_EXTENSION = "pdf";

const normalizeOptionalString = (value: string | null | undefined): string => value?.trim().toLowerCase() ?? "";

const getContractFileReference = (document: Pick<Document, "file_name" | "file_path">): string => {
  return normalizeOptionalString(document.file_name) || normalizeOptionalString(document.file_path);
};

export const getContractFileExtension = (document: Pick<Document, "file_name" | "file_path">): string => {
  const fileReference = getContractFileReference(document);
  const lastDotIndex = fileReference.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === fileReference.length - 1) {
    return "";
  }

  return fileReference.slice(lastDotIndex + 1);
};

export const hasContractPreviewFile = (document: Pick<Document, "file_name" | "file_path">): boolean => {
  return Boolean(getContractFileReference(document));
};

export const supportsInlineContractPreview = (document: Pick<Document, "file_name" | "file_path">): boolean => {
  return getContractFileExtension(document) === PDF_EXTENSION;
};
