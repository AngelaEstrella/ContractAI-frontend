"use client";

import { ContractsActionsBar } from "@/features/contracts/components/page/ContractsActionsBar";
import { ContractsDriveSelection } from "@/features/contracts/components/page/ContractsDriveSelection";
import { ContractsEmptyState } from "@/features/contracts/components/page/ContractsEmptyState";
import { ContractsFolderTabs } from "@/features/contracts/components/page/ContractsFolderTabs";
import { ContractsImportMenu } from "@/features/contracts/components/page/ContractsImportMenu";
import { ContractsTable } from "@/features/contracts/components/page/ContractsTable";
import { ContractDeleteModal } from "@/features/contracts/components/modals/ContractDeleteModal";
import { ContractFormModal } from "@/features/contracts/components/modals/ContractFormModal";
import { useContractsPage } from "@/features/contracts/hooks/use-contracts-page";
import type { Document } from "@/types/api.types";

type ContractsPageContentProps = {
  shouldOpenCreateModal?: boolean;
};

export function ContractsPageContent({
  shouldOpenCreateModal = false,
}: ContractsPageContentProps) {
  const page = useContractsPage({ shouldOpenCreateModal });

  if (page.loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-lg text-gray-500">Cargando contratos...</p>
      </div>
    );
  }

  if (page.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{page.error}</p>
        <button
          onClick={() => {
            void page.reloadContracts();
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
          {page.filteredContracts.length} contrato{page.filteredContracts.length !== 1 ? "s" : ""} en{" "}
          {page.activeFolder.name}
        </p>
      </div>

      <ContractsFolderTabs
        activeFolderId={page.activeFolder.id}
        folders={page.folders}
        onCreateFolder={page.createFolder}
        onSelectFolder={page.selectFolder}
      />

      <ContractFormModal onClose={page.closeCreateForm} onSubmit={page.addContract} open={page.showForm} />

      <ContractFormModal
        editMode
        initialData={page.contractToEdit ?? undefined}
        onClose={page.closeEditForm}
        onSubmit={page.updateContract}
        open={page.showEditForm && Boolean(page.contractToEdit)}
      />

      <ContractDeleteModal
        contractName={page.contractToDelete?.name ?? null}
        deleting={page.deleting}
        onClose={page.closeDeleteModal}
        onConfirm={() => {
          void page.confirmDelete();
        }}
        open={page.showDeleteModal}
      />

      {page.drivePickerError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {page.drivePickerError}
        </div>
      )}

      <ContractsDriveSelection
        activeFolderName={page.activeFolder.name}
        isOpeningDrivePicker={page.isOpeningDrivePicker}
        onClearSelection={page.clearDriveSelection}
        onRemoveFile={page.removeDriveFile}
        onSelectMore={() => {
          void page.openDrivePicker();
        }}
        selectedFiles={page.selectedDriveFiles}
      />

      {page.isEmpty ? (
        <ContractsEmptyState
          importControl={
            <ContractsImportMenu
              align="left"
              isOpeningDrivePicker={page.isOpeningDrivePicker}
              onOpenDrive={page.openDrivePicker}
            />
          }
          onCreateContract={page.openCreateForm}
        />
      ) : (
        <>
          <ContractsActionsBar
            filter={page.filter}
            importControl={
              <ContractsImportMenu
                isOpeningDrivePicker={page.isOpeningDrivePicker}
                onOpenDrive={page.openDrivePicker}
              />
            }
            onCreateContract={page.openCreateForm}
            onFilterChange={page.changeFilter}
            onSearchChange={page.changeSearch}
            search={page.search}
          />

          <ContractsTable
            contracts={page.paginatedContracts}
            currentPage={page.safeCurrentPage}
            filteredCount={page.filteredContracts.length}
            itemsPerPage={page.itemsPerPage}
            onDelete={page.openDeleteModal}
            onEdit={page.openEditForm}
            onItemsPerPageChange={page.changeItemsPerPage}
            onPageChange={page.changePage}
            onView={(contract: Document) => {
              void page.viewContract(contract);
            }}
            startIndex={page.startIndex}
            totalPages={page.totalPages}
          />
        </>
      )}
    </div>
  );
}
