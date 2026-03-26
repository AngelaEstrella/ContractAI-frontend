"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut } from "lucide-react";
import { logout as clearApiSession } from "@/lib/api";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabaseClient";
import { toNameAndLastName } from "@/lib/authUser";
import NotificationDropdown from "./NotificationDropdown";
import NotificationSidebar from "./NotificationSidebar";
import { mockNotifications } from "@/lib/mockNotifications";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const { isHydrating, user, logout } = useAuthStore();

  const userName = toNameAndLastName(user?.name || (isHydrating ? "Cargando usuario" : "Alex Carter"));
  const userRole = user?.role || (isHydrating ? "..." : "worker");
  const userInitials = userName.split(" ").map((n) => n[0]).join("");

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error cerrando sesión en Supabase:", error.message);
    }

    clearApiSession();
    logout();
    router.push("/");
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
            {mockNotifications.some((n) => !n.read) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {isDropdownOpen && (
            <NotificationDropdown
              onViewAll={() => setIsSidebarOpen(true)}
              onClose={() => setIsDropdownOpen(false)}
            />
          )}
        </div>

        {isSidebarOpen && (
          <NotificationSidebar onClose={() => setIsSidebarOpen(false)} />
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
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/profile");
                  }}
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
