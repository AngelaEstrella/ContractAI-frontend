"use client";

import { useCallback, useMemo, useState } from "react";
import { isAllowedFile } from "@/features/contracts/lib/contract-form.utils";
import type { Document } from "@/types/api.types";

type UseContractFormFileOptions = {
  editMode?: boolean;
  initialData?: Document;
  onInvalidFile: (message: string) => void;
};

export function useContractFormFile({
  editMode = false,
  initialData,
  onInvalidFile,
}: UseContractFormFileOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [keepOriginalFile, setKeepOriginalFile] = useState(
    Boolean(editMode && (initialData?.file_name || initialData?.file_path)),
  );
  const [fileError, setFileError] = useState(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0]);
      setKeepOriginalFile(false);
      setFileError(false);
    }
  }, []);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
      return;
    }

    if (event.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      if (event.dataTransfer.files?.[0]) {
        const droppedFile = event.dataTransfer.files[0];

        if (isAllowedFile(droppedFile.name)) {
          setFile(droppedFile);
          setKeepOriginalFile(false);
          setFileError(false);
          return;
        }

        onInvalidFile("Formato no permitido. Usa PDF, Excel (.xlsx/.xls) o Word (.doc/.docx).");
      }
    },
    [onInvalidFile],
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setFileError(false);

    if (editMode && (initialData?.file_name || initialData?.file_path)) {
      setKeepOriginalFile(true);
    }
  }, [editMode, initialData]);

  const hasValidFile = useMemo(() => file !== null || keepOriginalFile, [file, keepOriginalFile]);

  return {
    dragActive,
    file,
    fileError,
    handleDrag,
    handleDrop,
    handleFileChange,
    hasValidFile,
    keepOriginalFile,
    removeFile,
    setFileError,
    setKeepOriginalFile,
  };
}
