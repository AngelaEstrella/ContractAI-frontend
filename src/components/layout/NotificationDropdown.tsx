"use client";

import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { mockNotifications, type Notification, type NotificationType } from "@/lib/mockNotifications";

const PREVIEW_COUNT = 4;

const typeConfig: Record<NotificationType, { icon: React.ReactNode; dot: string }> = {
  critical: {
    icon: <AlertCircle size={16} className="text-red-500" />,
    dot: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle size={16} className="text-orange-500" />,
    dot: "bg-orange-500",
  },
  info: {
    icon: <Info size={16} className="text-blue-500" />,
    dot: "bg-blue-500",
  },
};

interface Props {
  onViewAll: () => void;
  onClose: () => void;
}

export default function NotificationDropdown({ onViewAll, onClose }: Props) {
  const preview = mockNotifications.slice(0, PREVIEW_COUNT);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Overlay invisible para cerrar al hacer clic fuera */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden">
        {/* Header del dropdown */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-800 text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Lista resumida */}
        <ul className="divide-y divide-gray-50">
          {preview.map((notification: Notification) => {
            const { icon, dot } = typeConfig[notification.type];
            return (
              <li
                key={notification.id}
                className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50/40" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {notification.title}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">
                      {notification.timeLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {notification.description}
                  </p>
                </div>
                {!notification.read && (
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={() => {
              onClose();
              onViewAll();
            }}
            className="w-full text-center text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
          >
            Ver todas las notificaciones
          </button>
        </div>
      </div>
    </>
  );
}
