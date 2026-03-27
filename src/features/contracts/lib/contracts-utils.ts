import type { GooglePickerFile } from "@/lib/googlePicker";
import { DOCUMENT_STATE_OPTIONS } from "@/lib/document.utils";
import type { Document, DocumentState } from "@/types/api.types";

export type DocumentFilterValue = "all" | DocumentState;
export const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

export const FILTER_OPTIONS: Array<{ value: DocumentFilterValue; label: string }> = [
  { value: "all", label: "Todos" },
  ...DOCUMENT_STATE_OPTIONS,
];

export const createFolderId = (): number => Date.now() + Math.floor(Math.random() * 1_000);

export const getServiceCountLabel = (count: number): string => {
  if (count === 0) {
    return "Sin servicios";
  }

  return `${count} servicio${count === 1 ? "" : "s"}`;
};

export const mergeDriveSelections = (
  currentFiles: GooglePickerFile[],
  nextFiles: GooglePickerFile[],
): GooglePickerFile[] => {
  const filesById = new Map(currentFiles.map((file) => [file.id, file]));

  nextFiles.forEach((file) => {
    filesById.set(file.id, file);
  });

  return Array.from(filesById.values());
};

export const getDriveItemTypeLabel = (mimeType: string): string => {
  if (mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE) {
    return "Carpeta";
  }

  if (mimeType.startsWith("application/vnd.google-apps.")) {
    return "Google Workspace";
  }

  const [, subtype] = mimeType.split("/");
  return subtype ? subtype.toUpperCase() : "Archivo";
};

export const isDriveFolder = (file: Pick<GooglePickerFile, "mimeType">): boolean => {
  return file.mimeType === GOOGLE_DRIVE_FOLDER_MIME_TYPE;
};

export const filterContracts = (
  contracts: Document[],
  filter: DocumentFilterValue,
  search: string,
): Document[] => {
  const searchTerm = search.trim().toLowerCase();

  return contracts.filter((contract) => {
    const matchesFilter = filter === "all" || contract.state === filter;
    const matchesSearch =
      searchTerm.length === 0 ||
      contract.id.toString().includes(searchTerm) ||
      contract.name.toLowerCase().includes(searchTerm) ||
      contract.client.toLowerCase().includes(searchTerm) ||
      (contract.file_name ?? "").toLowerCase().includes(searchTerm);

    return matchesFilter && matchesSearch;
  });
};

export const getVisiblePageNumbers = (currentPage: number, totalPages: number): number[] => {
  return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );
};
