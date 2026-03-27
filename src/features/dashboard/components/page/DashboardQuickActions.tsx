import Link from "next/link";
import { ArrowUpRight, Bot, FileText, Upload } from "lucide-react";

export function DashboardQuickActions() {
  return (
    <div className="space-y-6 xl:col-span-4">
      <article className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-800">Acciones rapidas</h2>
        <p className="mt-1 text-sm text-[var(--gray-medium)]">
          Gestiona procesos comunes con un clic.
        </p>

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

      <article className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-500/25">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold leading-snug">
              ¿Necesitas ayuda para revisar un contrato?
            </h3>
            <p className="mt-2 text-sm text-blue-100">
              Usa el asistente para detectar riesgos y mejorar clausulas clave.
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
  );
}
