"use client";

import { useCallback, useMemo, useState } from "react";
import { filterContracts, type DocumentFilterValue } from "@/features/contracts/lib/contracts-utils";
import type { Document } from "@/types/api.types";

export function useContractsFilters(activeContracts: Document[]) {
  const [filter, setFilter] = useState<DocumentFilterValue>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const filteredContracts = useMemo(
    () => filterContracts(activeContracts, filter, search),
    [activeContracts, filter, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);
  const isEmpty = activeContracts.length === 0;

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const changeFilter = useCallback((value: DocumentFilterValue) => {
    setFilter(value);
    setCurrentPage(1);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const changeItemsPerPage = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  const changePage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  return {
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
  };
}
