import { AlertTriangle, ArrowDownRight, ArrowUpRight, FileText, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardMetric, DashboardMetricTone } from "@/features/dashboard/lib/dashboard-data";

type DashboardMetricsGridProps = {
  isLoading: boolean;
  metrics: DashboardMetric[];
};

const metricStyles: Record<
  DashboardMetricTone,
  {
    icon: LucideIcon;
    iconStyle: string;
  }
> = {
  primary: {
    icon: FileText,
    iconStyle: "bg-blue-50 text-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    iconStyle: "bg-amber-50 text-amber-600",
  },
  danger: {
    icon: ShieldAlert,
    iconStyle: "bg-red-50 text-red-600",
  },
};

export function DashboardMetricsGrid({ isLoading, metrics }: DashboardMetricsGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => {
        const { icon: Icon, iconStyle } = metricStyles[metric.tone];
        const ChangeIcon = metric.positive ? ArrowUpRight : ArrowDownRight;

        return (
          <article
            key={metric.id}
            className="rounded-2xl bg-white p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[var(--gray-medium)]">
                  {metric.title}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-800">
                  {isLoading ? "..." : metric.value}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${iconStyle}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <ChangeIcon
                className={`h-4 w-4 ${metric.positive ? "text-emerald-500" : "text-red-500"}`}
              />
              <span className={metric.positive ? "text-emerald-500" : "text-red-500"}>
                {isLoading ? "..." : metric.change}
              </span>
              <span className="text-[var(--gray-medium)]">vs. mes anterior</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
