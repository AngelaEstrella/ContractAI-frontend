"use client";

import { DashboardMetricsGrid } from "@/features/dashboard/components/page/DashboardMetricsGrid";
import { DashboardQuickActions } from "@/features/dashboard/components/page/DashboardQuickActions";
import { DashboardRecentDocumentsTable } from "@/features/dashboard/components/page/DashboardRecentDocumentsTable";
import { DashboardWelcome } from "@/features/dashboard/components/page/DashboardWelcome";
import { useDashboardPage } from "@/features/dashboard/hooks/use-dashboard-page";

export function DashboardPageContent() {
  const page = useDashboardPage();

  return (
    <div className="space-y-6">
      <DashboardWelcome firstName={page.firstName} />

      {page.error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
          No se pudieron cargar los datos del dashboard: {page.error}
        </section>
      )}

      <DashboardMetricsGrid isLoading={page.isLoading} metrics={page.metrics} />

      <section className="grid gap-6 xl:grid-cols-12">
        <DashboardRecentDocumentsTable
          currentPage={page.safeCurrentPage}
          documents={page.paginatedDocuments}
          endIndex={page.endIndex}
          isLoading={page.isLoading}
          onPageChange={page.changePage}
          startIndex={page.startIndex}
          totalPages={page.totalPages}
          totalRecords={page.recentDocuments.length}
        />
        <DashboardQuickActions />
      </section>
    </div>
  );
}
