"use client";

import { useCallback, useState } from "react";
import { openGooglePicker, type GooglePickerFile } from "@/lib/googlePicker";
import { mergeDriveSelections } from "@/features/contracts/lib/contracts-utils";
import { useAuthStore } from "@/store";

export function useContractsDrivePicker() {
  const googleLoginHint = useAuthStore((state) => state.user?.email ?? null);
  const [isOpeningDrivePicker, setIsOpeningDrivePicker] = useState(false);
  const [drivePickerError, setDrivePickerError] = useState<string | null>(null);
  const [googleDriveAccessToken, setGoogleDriveAccessToken] = useState<string | null>(null);
  const [googleDriveAccessTokenExpiresAt, setGoogleDriveAccessTokenExpiresAt] = useState<number | null>(null);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<GooglePickerFile[]>([]);

  const openDrivePicker = useCallback(async () => {
    setDrivePickerError(null);
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

  const clearDriveSelection = useCallback(() => {
    setSelectedDriveFiles([]);
  }, []);

  const removeDriveFile = useCallback((fileId: string) => {
    setSelectedDriveFiles((files) => files.filter((file) => file.id !== fileId));
  }, []);

  return {
    clearDriveSelection,
    drivePickerError,
    isOpeningDrivePicker,
    openDrivePicker,
    removeDriveFile,
    selectedDriveFiles,
  };
}
