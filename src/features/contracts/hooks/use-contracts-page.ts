"use client";

import { useCallback } from "react";
import { deleteDocument } from "@/lib/api";
import { useContractsCollection } from "@/features/contracts/hooks/use-contracts-collection";
import { useContractPreview } from "@/features/contracts/hooks/use-contract-preview";
import { useContractsDrivePicker } from "@/features/contracts/hooks/use-contracts-drive-picker";
import { useContractsFilters } from "@/features/contracts/hooks/use-contracts-filters";
import { useContractsModalState } from "@/features/contracts/hooks/use-contracts-modal-state";
import type { Document } from "@/types/api.types";

type UseContractsPageOptions = {
  shouldOpenCreateModal?: boolean;
};

export function useContractsPage({ shouldOpenCreateModal = false }: UseContractsPageOptions) {
  const {
    activeContracts,
    activeFolder,
    addContract,
    createFolder: createCollectionFolder,
    error,
    folders,
    loading,
    reloadContracts,
    removeContract,
    selectFolder: selectCollectionFolder,
    updateContract: updateCollectionContract,
  } = useContractsCollection();

  const {
    changeFilter,
    changeItemsPerPage,
    changePage,
    changeSearch,
    filter,
    filteredContracts,
    isEmpty,
    itemsPerPage,
    paginatedContracts,
    resetPagination,
    safeCurrentPage,
    search,
    startIndex,
    totalPages,
  } = useContractsFilters(activeContracts);

  const {
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
  } = useContractsDrivePicker();

  const {
    closeCreateForm,
    closeDeleteModal,
    closeEditForm,
    contractToDelete,
    contractToEdit,
    deleting,
    openCreateForm,
    openDeleteModal,
    openEditForm,
    setDeleting,
    showDeleteModal,
    showEditForm,
    showForm,
  } = useContractsModalState({ shouldOpenCreateModal });

  const {
    closePreview,
    openPreview,
    openPreviewInNewTab,
    previewContract,
    previewError,
    previewLoading,
    previewUrl,
    showPreview,
  } = useContractPreview();

  const updateContract = useCallback(
    (updatedContract: Document) => {
      updateCollectionContract(updatedContract);
      closeEditForm();
    },
    [closeEditForm, updateCollectionContract],
  );

  const confirmDelete = useCallback(async () => {
    if (!contractToDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDocument(contractToDelete.id);
      removeContract(contractToDelete.id);
      closeDeleteModal();
    } catch (err) {
      console.error("Error al eliminar:", err);
      window.alert(err instanceof Error ? err.message : "Error al eliminar el contrato");
    } finally {
      setDeleting(false);
    }
  }, [closeDeleteModal, contractToDelete, removeContract, setDeleting]);

  const createFolder = useCallback(
    (name: string) => {
      createCollectionFolder(name);
      resetPagination();
    },
    [createCollectionFolder, resetPagination],
  );

  const selectFolder = useCallback(
    (folderId: number) => {
      selectCollectionFolder(folderId);
      resetPagination();
    },
    [resetPagination, selectCollectionFolder],
  );

  return {
    activeFolder,
    addContract,
    changeFilter,
    changeItemsPerPage,
    changePage,
    changeSearch,
    clearDriveSelection,
    closeCreateForm,
    closeDeleteModal,
    closeEditForm,
    closePreview,
    confirmDelete,
    contractToDelete,
    contractToEdit,
    createFolder,
    deleting,
    driveImportError,
    driveImportMessage,
    drivePickerError,
    error,
    filter,
    filteredContracts,
    folders,
    importSelectedDriveFiles,
    isEmpty,
    isImportingDriveFiles,
    isOpeningDrivePicker,
    itemsPerPage,
    loading,
    openPreviewInNewTab,
    openCreateForm,
    openDeleteModal,
    openDrivePicker,
    openEditForm,
    paginatedContracts,
    previewContract,
    previewError,
    previewLoading,
    previewUrl,
    reloadContracts,
    removeDriveFile,
    safeCurrentPage,
    search,
    selectedDriveFiles,
    selectFolder,
    showPreview,
    showDeleteModal,
    showEditForm,
    showForm,
    startIndex,
    totalPages,
    updateContract,
    viewContract: openPreview,
  };
}
