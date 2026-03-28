"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut } from "lucide-react";
import { logout as clearApiSession, getNotifications } from "@/lib/api";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabaseClient";
import { toNameAndLastName } from "@/lib/authUser";
import NotificationDropdown from "./NotificationDropdown";
import NotificationSidebar from "./NotificationSidebar";
import type { Notification } from "@/types/api.types";

const LS_READ = "notifications_read";
const LS_DISMISSED = "notifications_dismissed";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>): void {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export interface DisplayNotification extends Notification {
  read: boolean;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [raw, setRaw] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { isHydrating, user, logout } = useAuthStore();

  const userName = toNameAndLastName(user?.name || (isHydrating ? "Cargando usuario" : "Usuario"));
  const userRole = user?.role || (isHydrating ? "..." : "Sin rol");
  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "U";

  const notifications: DisplayNotification[] = raw
    .filter((n) => !dismissedIds.has(n.id))
    .map((n) => ({ ...n, read: readIds.has(n.id) }));

  const hasUnread = notifications.some((n) => !n.read);

  // Cargar notificaciones y estado localStorage al montar, con polling cada 3s
  useEffect(() => {
    setReadIds(loadSet(LS_READ));
    setDismissedIds(loadSet(LS_DISMISSED));

    let mounted = true;

    const fetchNotifications = () => {
      getNotifications()
        .then((data) => { if (mounted) setRaw(data); })
        .catch(() => { /* notificaciones no son críticas */ });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error cerrando sesión en Supabase:", error.message);
    clearApiSession();
    logout();
    router.push("/");
  };

  const handleMarkAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev).add(id);
      saveSet(LS_READ, next);
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      raw.forEach((n) => next.add(n.id));
      saveSet(LS_READ, next);
      return next;
    });
  };

  const handleDismissOne = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      saveSet(LS_DISMISSED, next);
      return next;
    });
  };

  const handleDismissAll = () => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      raw.forEach((n) => next.add(n.id));
      saveSet(LS_DISMISSED, next);
      return next;
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-end px-8 py-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={22} />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {isDropdownOpen && (
            <NotificationDropdown
              notifications={notifications}
              onViewAll={() => setIsSidebarOpen(true)}
              onClose={() => setIsDropdownOpen(false)}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
        </div>

        {isSidebarOpen && (
          <NotificationSidebar
            notifications={notifications}
            onClose={() => setIsSidebarOpen(false)}
            onDeleteOne={handleDismissOne}
            onDeleteAll={handleDismissAll}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{userInitials}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => { setIsMenuOpen(false); router.push("/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={18} />
                  Ver perfil
                </button>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
