"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { deleteDocument, getDocumentFileUrl, getDocuments } from "@/lib/api";
import { openGooglePicker, type GooglePickerFile } from "@/lib/googlePicker";
import { ContractDeleteModal } from "@/features/contracts/components/ContractDeleteModal";
import { ContractFormModal } from "@/features/contracts/components/ContractFormModal";
import { ContractImportModal } from "@/features/contracts/components/ContractImportModal";
import { ContractsActionsBar } from "@/features/contracts/components/ContractsActionsBar";
import { ContractsDriveSelection } from "@/features/contracts/components/ContractsDriveSelection";
import { ContractsEmptyState } from "@/features/contracts/components/ContractsEmptyState";
import { ContractsFolderTabs } from "@/features/contracts/components/ContractsFolderTabs";
import { ContractsImportMenu } from "@/features/contracts/components/ContractsImportMenu";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";
import {
  INITIAL_CONTRACT_FOLDERS,
  INITIAL_CONTRACTS_BY_FOLDER,
  type ContractFolder,
} from "@/features/contracts/lib/contracts-mock-data";
import {
  createFolderId,
  filterContracts,
  mergeDriveSelections,
  type DocumentFilterValue,
} from "@/features/contracts/lib/contracts-utils";
import type { Document } from "@/types/api.types";

export default function ContractsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contractsByFolder, setContractsByFolder] = useState<Record<number, Document[]>>(
    INITIAL_CONTRACTS_BY_FOLDER,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DocumentFilterValue>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<Document | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [folders, setFolders] = useState<ContractFolder[]>(INITIAL_CONTRACT_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<number>(INITIAL_CONTRACT_FOLDERS[0].id);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isOpeningDrivePicker, setIsOpeningDrivePicker] = useState(false);
  const [drivePickerError, setDrivePickerError] = useState<string | null>(null);
  const [googleDriveAccessToken, setGoogleDriveAccessToken] = useState<string | null>(null);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<GooglePickerFile[]>([]);

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? folders[0];
  const activeContracts = useMemo(
    () => contractsByFolder[activeFolderId] ?? [],
    [activeFolderId, contractsByFolder],
  );

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments();
      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [INITIAL_CONTRACT_FOLDERS[0].id]: data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFolderId, filter, search]);

  const filteredContracts = useMemo(
    () => filterContracts(activeContracts, filter, search),
    [activeContracts, filter, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / itemsPerPage));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  const isEmpty = activeContracts.length === 0;

  const addContract = (newContract: Document) => {
    setContractsByFolder((previousContracts) => ({
      ...previousContracts,
      [activeFolderId]: [...(previousContracts[activeFolderId] ?? []), newContract],
    }));
  };

  const updateContract = (updatedContract: Document) => {
    setContractsByFolder((previousContracts) => ({
      ...previousContracts,
      [activeFolderId]: (previousContracts[activeFolderId] ?? []).map((contract) =>
        contract.id === updatedContract.id ? updatedContract : contract,
      ),
    }));

    setShowEditForm(false);
    setContractToEdit(null);
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = {
      id: createFolderId(),
      name,
    } satisfies ContractFolder;

    setFolders((previousFolders) => [...previousFolders, newFolder]);
    setContractsByFolder((previousContracts) => ({
      ...previousContracts,
      [newFolder.id]: [],
    }));
    setActiveFolderId(newFolder.id);
  };

  const handleDriveClick = async () => {
    setDrivePickerError(null);
    setIsOpeningDrivePicker(true);

    try {
      const result = await openGooglePicker({ accessToken: googleDriveAccessToken });

      if (!result || result.files.length === 0) {
        return;
      }

      setGoogleDriveAccessToken(result.accessToken);
      setSelectedDriveFiles((files) => mergeDriveSelections(files, result.files));
    } catch (err) {
      setDrivePickerError(
        err instanceof Error ? err.message : "No se pudo abrir el selector de Google Drive.",
      );
    } finally {
      setIsOpeningDrivePicker(false);
    }
  };

  const handleDeleteClick = (contract: Document) => {
    setContractToDelete(contract);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDocument(contractToDelete.id);
      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [activeFolderId]: (previousContracts[activeFolderId] ?? []).filter(
          (contract) => contract.id !== contractToDelete.id,
        ),
      }));
      setShowDeleteModal(false);
      setContractToDelete(null);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert(err instanceof Error ? err.message : "Error al eliminar el contrato");
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (contract: Document) => {
    try {
      const signedUrl = await getDocumentFileUrl(contract.id);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error al abrir documento:", err);
      alert(err instanceof Error ? err.message : "No se pudo abrir el documento");
    }
  };

  const handleEdit = (contract: Document) => {
    setContractToEdit(contract);
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setContractToEdit(null);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-lg text-gray-500">Cargando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{error}</p>
        <button
          onClick={() => {
            void loadContracts();
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-800">Gestion de Contratos</h1>
        <p className="text-sm text-slate-500">
          {filteredContracts.length} contrato{filteredContracts.length !== 1 ? "s" : ""} en {activeFolder.name}
        </p>
      </div>

      <ContractsFolderTabs
        activeFolderId={activeFolderId}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onSelectFolder={setActiveFolderId}
      />

      <ContractFormModal onClose={() => setShowForm(false)} onSubmit={addContract} open={showForm} />

      <ContractFormModal
        editMode
        initialData={contractToEdit ?? undefined}
        onClose={closeEditForm}
        onSubmit={updateContract}
        open={showEditForm && Boolean(contractToEdit)}
      />

      <ContractDeleteModal
        contractName={contractToDelete?.name ?? null}
        deleting={deleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          void confirmDelete();
        }}
        open={showDeleteModal}
      />

      <ContractImportModal
        activeFolderName={activeFolder.name}
        onClose={() => setShowImportModal(false)}
        open={showImportModal}
      />

      {drivePickerError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {drivePickerError}
        </div>
      )}

      <ContractsDriveSelection
        activeFolderName={activeFolder.name}
        isOpeningDrivePicker={isOpeningDrivePicker}
        onClearSelection={() => setSelectedDriveFiles([])}
        onRemoveFile={(fileId) => {
          setSelectedDriveFiles((files) => files.filter((file) => file.id !== fileId));
        }}
        onSelectMore={() => {
          void handleDriveClick();
        }}
        selectedFiles={selectedDriveFiles}
      />

      {isEmpty ? (
        <ContractsEmptyState
          importControl={
            <ContractsImportMenu
              align="left"
              isOpeningDrivePicker={isOpeningDrivePicker}
              onOpenDrive={handleDriveClick}
              onOpenLocalImport={() => setShowImportModal(true)}
            />
          }
          onCreateContract={() => setShowForm(true)}
        />
      ) : (
        <>
          <ContractsActionsBar
            filter={filter}
            importControl={
              <ContractsImportMenu
                isOpeningDrivePicker={isOpeningDrivePicker}
                onOpenDrive={handleDriveClick}
                onOpenLocalImport={() => setShowImportModal(true)}
              />
            }
            onCreateContract={() => setShowForm(true)}
            onFilterChange={setFilter}
            onSearchChange={setSearch}
            search={search}
          />

          <ContractsTable
            contracts={paginatedContracts}
            currentPage={currentPage}
            filteredCount={filteredContracts.length}
            itemsPerPage={itemsPerPage}
            onDelete={handleDeleteClick}
            onEdit={handleEdit}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            onView={(contract) => {
              void handleView(contract);
            }}
            startIndex={startIndex}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
}
