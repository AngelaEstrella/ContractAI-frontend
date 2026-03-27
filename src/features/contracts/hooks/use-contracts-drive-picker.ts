"use client";

import { useCallback, useState } from "react";
import { openGooglePicker, type GooglePickerFile } from "@/lib/googlePicker";
import { importGoogleDriveFiles } from "@/lib/api";
import { mergeDriveSelections } from "@/features/contracts/lib/contracts-utils";
import { useAuthStore } from "@/store";

export function useContractsDrivePicker() {
  const googleLoginHint = useAuthStore((state) => state.user?.email ?? null);
  const [isOpeningDrivePicker, setIsOpeningDrivePicker] = useState(false);
  const [isImportingDriveFiles, setIsImportingDriveFiles] = useState(false);
  const [drivePickerError, setDrivePickerError] = useState<string | null>(null);
  const [driveImportError, setDriveImportError] = useState<string | null>(null);
  const [driveImportMessage, setDriveImportMessage] = useState<string | null>(null);
  const [googleDriveAccessToken, setGoogleDriveAccessToken] = useState<string | null>(null);
  const [googleDriveAccessTokenExpiresAt, setGoogleDriveAccessTokenExpiresAt] = useState<number | null>(null);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<GooglePickerFile[]>([]);

  const openDrivePicker = useCallback(async () => {
    setDrivePickerError(null);
    setDriveImportError(null);
    setDriveImportMessage(null);
    setIsOpeningDrivePicker(true);

    try {
      const result = await openGooglePicker({
        accessToken: googleDriveAccessToken,
        accessTokenExpiresAt: googleDriveAccessTokenExpiresAt,
        loginHint: googleLoginHint,
      });

      if (!result || result.files.length === 0) {
        return;
      }

      setGoogleDriveAccessToken(result.accessToken);
      setGoogleDriveAccessTokenExpiresAt(result.accessTokenExpiresAt);
      setSelectedDriveFiles((files) => mergeDriveSelections(files, result.files));
    } catch (err) {
      setDrivePickerError(
        err instanceof Error ? err.message : "No se pudo abrir el selector de Google Drive.",
      );
    } finally {
      setIsOpeningDrivePicker(false);
    }
  }, [googleDriveAccessToken, googleDriveAccessTokenExpiresAt, googleLoginHint]);

  const importSelectedDriveFiles = useCallback(async () => {
    setDriveImportError(null);
    setDriveImportMessage(null);

    if (!googleDriveAccessToken) {
      setDriveImportError("Vuelve a abrir Google Drive para autorizar la importacion de archivos.");
      return;
    }

    if (selectedDriveFiles.length === 0) {
      setDriveImportError("Selecciona al menos un archivo antes de iniciar la importacion.");
      return;
    }

    setIsImportingDriveFiles(true);

    try {
      const result = await importGoogleDriveFiles(googleDriveAccessToken, selectedDriveFiles);
      const skippedMessage =
        result.skipped_files > 0
          ? ` Se omitieron ${result.skipped_files} carpeta${result.skipped_files === 1 ? "" : "s"}.`
          : "";

      setDriveImportMessage(
        `${result.message} ${result.queued_files} archivo${result.queued_files === 1 ? "" : "s"} enviado${result.queued_files === 1 ? "" : "s"} al backend.${skippedMessage}`,
      );
    } catch (err) {
      setDriveImportError(
        err instanceof Error ? err.message : "No se pudieron enviar los archivos seleccionados.",
      );
    } finally {
      setIsImportingDriveFiles(false);
    }
  }, [googleDriveAccessToken, selectedDriveFiles]);

  const clearDriveSelection = useCallback(() => {
    setSelectedDriveFiles([]);
    setDriveImportError(null);
    setDriveImportMessage(null);
  }, []);

  const removeDriveFile = useCallback((fileId: string) => {
    setSelectedDriveFiles((files) => files.filter((file) => file.id !== fileId));
  }, []);

  return {
    clearDriveSelection,
    driveImportError,
    driveImportMessage,
    drivePickerError,
    importSelectedDriveFiles,
    isImportingDriveFiles,
    isOpeningDrivePicker,
    openDrivePicker,
    removeDriveFile,
    selectedDriveFiles,
  };
}
