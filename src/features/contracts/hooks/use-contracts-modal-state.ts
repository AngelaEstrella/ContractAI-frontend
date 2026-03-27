"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Document } from "@/types/api.types";

type UseContractsModalStateOptions = {
  shouldOpenCreateModal?: boolean;
};

export function useContractsModalState({
  shouldOpenCreateModal = false,
}: UseContractsModalStateOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const didConsumeInitialCreateModal = useRef(false);

  const [showForm, setShowForm] = useState(shouldOpenCreateModal);
  const [showEditForm, setShowEditForm] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Document | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!shouldOpenCreateModal || didConsumeInitialCreateModal.current) {
      return;
    }

    didConsumeInitialCreateModal.current = true;
    router.replace(pathname);
  }, [pathname, router, shouldOpenCreateModal]);

  const openCreateForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const closeCreateForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const openEditForm = useCallback((contract: Document) => {
    setContractToEdit(contract);
    setShowEditForm(true);
  }, []);

  const closeEditForm = useCallback(() => {
    setShowEditForm(false);
    setContractToEdit(null);
  }, []);

  const openDeleteModal = useCallback((contract: Document) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setContractToDelete(null);
  }, []);

  return {
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
  };
}
