"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  AlertTriangle,
  ShieldAlert,
  Ellipsis,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getDocuments } from "@/lib/api";
import {
  getDashboardDocumentStateClasses,
  getDocumentFileLabel,
  getDocumentStateLabel,
  getDocumentTypeLabel,
} from "@/lib/document.utils";
import { supabase } from "@/lib/supabaseClient";
import { mapSupabaseUserToAuthUser, toFirstName } from "@/lib/authUser";
import { Document, DocumentState } from "@/types/api.types";
import { useAuthStore } from "@/store";

type RecentDocument = {
  id: number;
  name: string;
  subtitle: string;
  status: DocumentState;
  modified: string;
};

const monthKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}`;

const formatRelative = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "hace unos minutos";
  }
  if (diffHours < 24) {
    return `hace ${diffHours} h`;
  }
  if (diffDays < 30) {
    return `hace ${diffDays} d`;
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatChange = (current: number, previous: number): { label: string; positive: boolean } => {
  if (previous === 0 && current === 0) {
    return { label: "0%", positive: true };
  }

  if (previous === 0) {
    return { label: "+100%", positive: true };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  const signal = rounded > 0 ? "+" : "";

  return {
    label: `${signal}${rounded}%`,
    positive: rounded >= 0,
  };
};

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación para documentos recientes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  useEffect(() => {
    if (user) {
      return;
    }

    const syncUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(mapSupabaseUserToAuthUser(session.user));
      }
    };

    syncUser();
  }, [setUser, user]);

  const firstName = toFirstName(user?.name || "Alex");

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = monthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = monthKey(previousMonthDate);

    const docsByCreationMonth = documents.reduce<Record<string, number>>((acc, doc) => {
      const key = monthKey(new Date(doc.created_at));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const pendingByUpdatedMonth = documents.reduce<Record<string, number>>((acc, doc) => {
      if (doc.state !== "PENDING") {
        return acc;
      }
      const key = monthKey(new Date(doc.updated_at));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const expiredByUpdatedMonth = documents.reduce<Record<string, number>>((acc, doc) => {
      if (doc.state !== "EXPIRED") {
        return acc;
      }
      const key = monthKey(new Date(doc.updated_at));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const totalContracts = documents.length;
    const pendingContracts = documents.filter((doc) => doc.state === "PENDING").length;
    const expiredContracts = documents.filter((doc) => doc.state === "EXPIRED").length;

    const totalChange = formatChange(docsByCreationMonth[currentMonth] || 0, docsByCreationMonth[previousMonth] || 0);
    const pendingChange = formatChange(
      pendingByUpdatedMonth[currentMonth] || 0,
      pendingByUpdatedMonth[previousMonth] || 0,
    );
    const expiredChange = formatChange(
      expiredByUpdatedMonth[currentMonth] || 0,
      expiredByUpdatedMonth[previousMonth] || 0,
    );

    return [
      {
        title: "TOTAL DE CONTRATOS",
        value: totalContracts.toLocaleString("es-ES"),
        change: totalChange.label,
        positive: totalChange.positive,
        icon: FileText,
        iconStyle: "bg-blue-50 text-blue-600",
      },
      {
        title: "PENDIENTES",
        value: pendingContracts.toLocaleString("es-ES"),
        change: pendingChange.label,
        positive: !pendingChange.positive,
        icon: AlertTriangle,
        iconStyle: "bg-amber-50 text-amber-600",
      },
      {
        title: "EXPIRADOS",
        value: expiredContracts.toLocaleString("es-ES"),
        change: expiredChange.label,
        positive: !expiredChange.positive,
        icon: ShieldAlert,
        iconStyle: "bg-red-50 text-red-600",
      },
    ];
  }, [documents]);

  const sortedDocuments = useMemo<RecentDocument[]>(() => {
    return [...documents]
      .sort((a, b) => b.id - a.id)
      .map((doc) => ({
        id: doc.id,
        name: doc.name,
        subtitle: `${doc.client} · ${getDocumentTypeLabel(doc.type)} · ${getDocumentFileLabel(doc)}`,
        status: doc.state,
        modified: formatRelative(doc.updated_at),
      }));
  }, [documents]);

  // Cálculos de paginación
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDocuments = sortedDocuments.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
        <section className="rounded-2xl bg-white px-6 py-6 shadow-md md:px-8">
          <h1 className="text-3xl font-semibold text-slate-800">Bienvenido, {firstName}</h1>
        <p className="mt-2 text-sm text-[var(--gray-medium)] md:text-base">
          Este es el resumen de tus contratos y documentos para hoy.
        </p>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 shadow-sm">
          No se pudieron cargar los datos del dashboard: {error}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((card) => {
          const Icon = card.icon;
          const ChangeIcon = card.positive ? ArrowUpRight : ArrowDownRight;

          return (
            <article
              key={card.title}
              className="rounded-2xl bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium tracking-wide text-[var(--gray-medium)]">
                    {card.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-800">
                    {isLoading ? "..." : card.value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${card.iconStyle}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <ChangeIcon
                  className={`h-4 w-4 ${card.positive ? "text-emerald-500" : "text-red-500"}`}
                />
                <span className={card.positive ? "text-emerald-500" : "text-red-500"}>
                  {isLoading ? "..." : card.change}
                </span>
                <span className="text-[var(--gray-medium)]">vs. mes anterior</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <article className="rounded-2xl bg-white shadow-md xl:col-span-8 flex flex-col">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-800">Contratos recientes</h2>
            <p className="mt-1 text-sm text-[var(--gray-medium)]">
              Últimas actualizaciones registradas en tus contratos.
            </p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col className="w-[52%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--gray-medium)]">
                  <th className="px-6 py-4 font-medium">Nombre del documento</th>
                  <th className="px-6 py-4 font-medium text-center">Estado</th>
                  <th className="px-6 py-4 font-medium text-center">Última modificación</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-[var(--gray-medium)]" colSpan={4}>
                      Cargando documentos...
                    </td>
                  </tr>
                )}
                {!isLoading && paginatedDocuments.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-[var(--gray-medium)]" colSpan={4}>
                      No hay documentos disponibles.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  paginatedDocuments.map((doc) => (
                    <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
                            <p className="mt-1 truncate text-xs text-[var(--gray-medium)]">{doc.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getDashboardDocumentStateClasses(
                            doc.status,
                          )}`}
                        >
                          {getDocumentStateLabel(doc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center align-middle text-sm text-[var(--gray-medium)]">
                        <span className="whitespace-nowrap">{doc.modified}</span>
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <Link
                          href="/contracts"
                          className="inline-flex rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Ellipsis className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* PAGINACIÓN */}
          {!isLoading && sortedDocuments.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <span className="text-sm text-slate-500">
                Mostrando{" "}
                <span className="font-medium text-slate-700">{startIndex + 1}</span>
                {" - "}
                <span className="font-medium text-slate-700">
                  {Math.min(endIndex, sortedDocuments.length)}
                </span>{" "}
                de <span className="font-medium text-slate-700">{sortedDocuments.length}</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </article>

        <div className="space-y-6 xl:col-span-4">
          <article className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-lg font-semibold text-slate-800">Acciones rápidas</h2>
            <p className="mt-1 text-sm text-[var(--gray-medium)]">Gestiona procesos comunes con un clic.</p>

            <div className="mt-5 space-y-3">
              <Link
                href="/contracts?new=1"
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                    <Upload className="h-4 w-4" />
                  </span>
                  Nuevo contrato
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/contracts"
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                    <FileText className="h-4 w-4" />
                  </span>
                  Ver contratos
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/ai-agent"
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <span className="flex items-center gap-3">
                  <span className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </span>
                  Abrir agente IA
                </span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* Card con gradiente azul-indigo */}
          <article className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold leading-snug">
                  ¿Necesitas ayuda para revisar un contrato?
                </h3>
                <p className="mt-2 text-sm text-blue-100">
                  Usa el asistente para detectar riesgos y mejorar cláusulas clave.
                </p>
              </div>
              <span className="rounded-xl bg-white/20 p-3">
                <Bot className="h-6 w-6" />
              </span>
            </div>
            <Link
              href="/ai-agent"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
            >
              Probar asistente de IA
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
