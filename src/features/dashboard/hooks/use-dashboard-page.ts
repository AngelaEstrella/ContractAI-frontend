"use client";

import { useMemo, useState } from "react";
import { useDashboardDocuments } from "@/features/dashboard/hooks/use-dashboard-documents";
import {
  buildDashboardMetrics,
  buildRecentDocuments,
} from "@/features/dashboard/lib/dashboard-data";
import { toFirstName } from "@/lib/authUser";
import { useAuthStore } from "@/store";

const ITEMS_PER_PAGE = 4;

export function useDashboardPage() {
  const { user } = useAuthStore();
  const { documents, error, isLoading } = useDashboardDocuments();
  const [currentPage, setCurrentPage] = useState(1);

  const firstName = toFirstName(user?.name || "Usuario");
  const metrics = useMemo(() => buildDashboardMetrics(documents), [documents]);
  const recentDocuments = useMemo(() => buildRecentDocuments(documents), [documents]);
  const totalPages = Math.max(1, Math.ceil(recentDocuments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDocuments = recentDocuments.slice(startIndex, endIndex);

  const changePage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    endIndex,
    error,
    firstName,
    isLoading,
    metrics,
    paginatedDocuments,
    recentDocuments,
    safeCurrentPage,
    startIndex,
    totalPages,
    changePage,
  };
}
