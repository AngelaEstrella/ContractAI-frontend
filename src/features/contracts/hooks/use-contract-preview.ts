"use client";

import { useCallback, useRef, useState } from "react";
import { hasContractPreviewFile, supportsInlineContractPreview } from "@/features/contracts/lib/contracts-preview.utils";
import { getDocumentFileUrl } from "@/lib/api";
import type { Document } from "@/types/api.types";

const PREVIEW_FILE_MISSING_MESSAGE = "Este contrato no tiene un archivo disponible para vista previa.";
const PREVIEW_OPENING_ERROR_MESSAGE = "No se pudo abrir el documento";

const openUrlInNewTab = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export function useContractPreview() {
  const requestIdRef = useRef(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewContract, setPreviewContract] = useState<Document | null>(null);

  const resetPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewUrl(null);
    setPreviewContract(null);
  }, []);

  const closePreview = useCallback(() => {
    requestIdRef.current += 1;
    resetPreview();
  }, [resetPreview]);

  const openPreviewInNewTab = useCallback(() => {
    if (!previewUrl) {
      return;
    }

    openUrlInNewTab(previewUrl);
  }, [previewUrl]);

  const openPreview = useCallback(async (contract: Document) => {
    if (!hasContractPreviewFile(contract)) {
      window.alert(PREVIEW_FILE_MISSING_MESSAGE);
      return;
    }

    const supportsInlinePreview = supportsInlineContractPreview(contract);
    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;

    setPreviewContract(contract);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    setShowPreview(supportsInlinePreview);

    try {
      const signedUrl = await getDocumentFileUrl(contract.id);

      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      if (!supportsInlinePreview) {
        openUrlInNewTab(signedUrl);
        resetPreview();
        return;
      }

      setPreviewUrl(signedUrl);
      setShowPreview(true);
    } catch (err) {
      if (requestIdRef.current !== nextRequestId) {
        return;
      }

      console.error("Error al abrir documento:", err);

      const message = err instanceof Error ? err.message : PREVIEW_OPENING_ERROR_MESSAGE;

      if (!supportsInlinePreview) {
        window.alert(message);
        resetPreview();
        return;
      }

      setPreviewError(message);
      setShowPreview(true);
    } finally {
      if (requestIdRef.current === nextRequestId) {
        setPreviewLoading(false);
      }
    }
  }, [resetPreview]);

  return {
    closePreview,
    openPreview,
    openPreviewInNewTab,
    previewContract,
    previewError,
    previewLoading,
    previewUrl,
    showPreview,
  };
}
