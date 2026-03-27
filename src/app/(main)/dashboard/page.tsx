"use client";

import { useMemo, useState } from "react";
import { DashboardMetricsGrid } from "@/features/dashboard/components/DashboardMetricsGrid";
import { DashboardQuickActions } from "@/features/dashboard/components/DashboardQuickActions";
import { DashboardRecentDocumentsTable } from "@/features/dashboard/components/DashboardRecentDocumentsTable";
import { DashboardWelcome } from "@/features/dashboard/components/DashboardWelcome";
import { useDashboardDocuments } from "@/features/dashboard/hooks/use-dashboard-documents";
import {
  buildDashboardMetrics,
  buildRecentDocuments,
} from "@/features/dashboard/lib/dashboard-data";
import { toFirstName } from "@/lib/authUser";
import { useAuthStore } from "@/store";

const ITEMS_PER_PAGE = 4;

export default function DashboardPage() {
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

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      <DashboardWelcome firstName={firstName} />

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
          No se pudieron cargar los datos del dashboard: {error}
        </section>
      )}

      <DashboardMetricsGrid isLoading={isLoading} metrics={metrics} />

      <section className="grid gap-6 xl:grid-cols-12">
        <DashboardRecentDocumentsTable
          currentPage={safeCurrentPage}
          documents={paginatedDocuments}
          endIndex={endIndex}
          isLoading={isLoading}
          onPageChange={goToPage}
          startIndex={startIndex}
          totalPages={totalPages}
          totalRecords={recentDocuments.length}
        />
        <DashboardQuickActions />
      </section>
    </div>
  );
}
