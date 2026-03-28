"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertCircle, AlertTriangle, Info, Trash2 } from "lucide-react";
import { getDaysLabel, type NotificationType } from "@/lib/mockNotifications";
import type { DisplayNotification } from "./Header";

type Filter = "all" | "critical" | "warning";

const filterLabels: Record<Filter, string> = {
  all: "Todos",
  critical: "Críticos",
  warning: "Advertencias",
};

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; cardStyle: React.CSSProperties; border: string; badge: string }
> = {
  critical: {
    icon: <AlertCircle size={20} className="text-red-500" />,
    cardStyle: { background: "rgba(255, 240, 240, 0.4)", border: "1px solid rgba(252, 165, 165, 0.3)" },
    border: "",
    badge: "bg-red-100/80 text-red-600",
  },
  warning: {
    icon: <AlertTriangle size={20} className="text-orange-500" />,
    cardStyle: { background: "rgba(255, 247, 235, 0.4)", border: "1px solid rgba(253, 186, 116, 0.3)" },
    border: "",
    badge: "bg-orange-100/80 text-orange-600",
  },
  info: {
    icon: <Info size={20} className="text-blue-500" />,
    cardStyle: { background: "rgba(235, 245, 255, 0.4)", border: "1px solid rgba(147, 197, 253, 0.3)" },
    border: "",
    badge: "bg-blue-100/80 text-blue-600",
  },
};

interface Props {
  notifications: DisplayNotification[];
  onClose: () => void;
  onDeleteOne: (id: string) => void;
  onDeleteAll: () => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationSidebar({
  notifications,
  onClose,
  onDeleteOne,
  onDeleteAll,
  onMarkAllAsRead,
}: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const router = useRouter();

  const filtered = notifications.filter(
    (n) => activeFilter === "all" || n.type === activeFilter
  );

  return (
    <>
      {/* Fondo oscurecido */}
      <div
        className="fixed inset-0 z-40 transition-opacity"
        style={{ background: "rgba(0, 0, 0, 0.2)" }}
        onClick={onClose}
      />

      {/* Panel lateral — glassmorphism */}
      <div
        className="fixed right-0 top-0 h-full w-[420px] max-w-full z-50 flex flex-col border-l border-white/30"
        style={{
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.12), -1px 0 0 rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/30">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
              <p className="text-sm text-gray-500 mt-0.5">Actividad Reciente</p>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Marcar todas leídas
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mt-4">
            {(Object.keys(filterLabels) as Filter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeFilter === filter
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white/50 text-gray-600 hover:bg-white/80 border border-white/40"
                }`}
              >
                {filterLabels[filter]}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 bg-white/50 rounded-full flex items-center justify-center mb-3 border border-white/40">
                <AlertCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">Sin notificaciones</p>
              <p className="text-xs text-gray-400 mt-1">No hay actividad en esta categoría</p>
            </div>
          ) : (
            filtered.map((notification) => {
              const { icon, cardStyle, badge } = typeConfig[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`rounded-xl p-4 ${!notification.read ? "ring-1 ring-inset ring-white/20" : ""}`}
                  style={cardStyle}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono */}
                    <div className="shrink-0 mt-0.5">{icon}</div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {notification.title}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
                          {getDaysLabel(notification.days_remaining)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {notification.description}
                      </p>

                      {/* Botones de acción */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => { onClose(); router.push("/contracts"); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors"
                        >
                          Ver contrato
                        </button>
                        <button
                          onClick={() => onDeleteOne(notification.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/60 text-gray-600 border border-white/50 hover:bg-white/80 transition-colors"
                        >
                          Descartar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-4 border-t border-white/30">
            <button
              onClick={onDeleteAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-colors"
            >
              <Trash2 size={16} />
              Limpiar todas
            </button>
          </div>
        )}
      </div>
    </>
  );
}
