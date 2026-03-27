"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDocuments } from "@/lib/api";
import {
  INITIAL_CONTRACT_FOLDERS,
  INITIAL_CONTRACTS_BY_FOLDER,
  type ContractFolder,
} from "@/features/contracts/lib/contracts-mock-data";
import { createFolderId } from "@/features/contracts/lib/contracts-utils";
import type { Document } from "@/types/api.types";

export function useContractsCollection() {
  const [contractsByFolder, setContractsByFolder] = useState<Record<number, Document[]>>(
    INITIAL_CONTRACTS_BY_FOLDER,
  );
  const [folders, setFolders] = useState<ContractFolder[]>(INITIAL_CONTRACT_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<number>(INITIAL_CONTRACT_FOLDERS[0].id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) ?? folders[0],
    [activeFolderId, folders],
  );

  const activeContracts = useMemo(
    () => contractsByFolder[activeFolderId] ?? [],
    [activeFolderId, contractsByFolder],
  );

  const reloadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const documents = await getDocuments();

      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [INITIAL_CONTRACT_FOLDERS[0].id]: documents,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contratos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadContracts();
  }, [reloadContracts]);

  const addContract = useCallback(
    (newContract: Document) => {
      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [activeFolderId]: [...(previousContracts[activeFolderId] ?? []), newContract],
      }));
    },
    [activeFolderId],
  );

  const updateContract = useCallback(
    (updatedContract: Document) => {
      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [activeFolderId]: (previousContracts[activeFolderId] ?? []).map((contract) =>
          contract.id === updatedContract.id ? updatedContract : contract,
        ),
      }));
    },
    [activeFolderId],
  );

  const removeContract = useCallback(
    (contractId: number) => {
      setContractsByFolder((previousContracts) => ({
        ...previousContracts,
        [activeFolderId]: (previousContracts[activeFolderId] ?? []).filter(
          (contract) => contract.id !== contractId,
        ),
      }));
    },
    [activeFolderId],
  );

  const createFolder = useCallback((name: string) => {
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
  }, []);

  const selectFolder = useCallback((folderId: number) => {
    setActiveFolderId(folderId);
  }, []);

  return {
    activeContracts,
    activeFolder,
    activeFolderId,
    addContract,
    createFolder,
    error,
    folders,
    loading,
    reloadContracts,
    removeContract,
    selectFolder,
    updateContract,
  };
}
