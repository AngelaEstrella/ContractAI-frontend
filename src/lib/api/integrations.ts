import type { GooglePickerFile } from "@/lib/googlePicker";
import { GOOGLE_DRIVE_SCOPE } from "@/lib/googlePicker";
import { isDriveFolder } from "@/features/contracts/lib/contracts-utils";
import type { DocumentState, DocumentType } from "@/types/api.types";
import { TIMEOUTS } from "./constants";
import { fetchAPI } from "./fetch-client";

const DEFAULT_DRIVE_IMPORT_CLIENT = "Google Drive";
const DEFAULT_DRIVE_IMPORT_TYPE: DocumentType = "SERVICES";
const DEFAULT_DRIVE_IMPORT_STATE: DocumentState = "ACTIVE";

type DriveImportDocumentPayload = {
  name: string;
  client: string;
  type: DocumentType;
  start_date: string;
  end_date: string;
  form_data: Record<string, never>;
  state: DocumentState;
  service_items: [];
};

type DriveImportFilePayload = {
  file_id: string;
  document: DriveImportDocumentPayload;
};

type DriveImportRequest = {
  token: {
    token: string;
    scopes: string[];
  };
  files: DriveImportFilePayload[];
};

type DriveImportApiResponse = {
  message: string;
  queued_files: number;
  index_name: string;
};

export type GoogleDriveImportResponse = DriveImportApiResponse & {
  skipped_files: number;
};

const getTodayDate = (): string => {
  return new Date().toISOString().slice(0, 10);
};

const buildDriveImportDocument = (file: GooglePickerFile): DriveImportDocumentPayload => {
  const today = getTodayDate();

  return {
    name: file.name.trim() || "Documento de Google Drive",
    client: DEFAULT_DRIVE_IMPORT_CLIENT,
    type: DEFAULT_DRIVE_IMPORT_TYPE,
    start_date: today,
    end_date: today,
    form_data: {},
    state: DEFAULT_DRIVE_IMPORT_STATE,
    service_items: [],
  };
};

export async function importGoogleDriveFiles(
  accessToken: string,
  files: GooglePickerFile[],
): Promise<GoogleDriveImportResponse> {
  const importableFiles = files.filter((file) => !isDriveFolder(file));
  const skippedFiles = files.length - importableFiles.length;

  if (!accessToken.trim()) {
    throw new Error("No se encontro un token valido de Google Drive para importar los archivos.");
  }

  if (importableFiles.length === 0) {
    throw new Error("Selecciona al menos un archivo de Google Drive. Las carpetas no se pueden importar.");
  }

  const response = await fetchAPI<DriveImportApiResponse>(
    "/integrations/drive/import",
    {
      method: "POST",
      body: JSON.stringify({
        token: {
          token: accessToken,
          scopes: [GOOGLE_DRIVE_SCOPE],
        },
        files: importableFiles.map((file) => ({
          file_id: file.id,
          document: buildDriveImportDocument(file),
        })),
      } satisfies DriveImportRequest),
    },
    TIMEOUTS.UPLOAD,
  );

  return {
    ...response,
    skipped_files: skippedFiles,
  };
}
