"use client";

import { useCallback } from "react";
import { deleteDocument, getDocumentFileUrl } from "@/lib/api";
import { useContractsCollection } from "@/features/contracts/hooks/use-contracts-collection";
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
    drivePickerError,
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

  const viewContract = useCallback(async (contract: Document) => {
    try {
      const signedUrl = await getDocumentFileUrl(contract.id);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error al abrir documento:", err);
      window.alert(err instanceof Error ? err.message : "No se pudo abrir el documento");
    }
  }, []);

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
    confirmDelete,
    contractToDelete,
    contractToEdit,
    createFolder,
    deleting,
    drivePickerError,
    error,
    filter,
    filteredContracts,
    folders,
    isEmpty,
    isOpeningDrivePicker,
    itemsPerPage,
    loading,
    openCreateForm,
    openDeleteModal,
    openDrivePicker,
    openEditForm,
    paginatedContracts,
    reloadContracts,
    removeDriveFile,
    safeCurrentPage,
    search,
    selectedDriveFiles,
    selectFolder,
    showDeleteModal,
    showEditForm,
    showForm,
    startIndex,
    totalPages,
    updateContract,
    viewContract,
  };
}
