"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut } from "lucide-react";
import { getCurrentUser, logout as clearApiSession } from "@/lib/api";
import { useAuthStore } from "@/store";
import { supabase } from "@/lib/supabaseClient";
import { mapBackendUserToAuthUser, mapSupabaseUserToAuthUser, toNameAndLastName } from "@/lib/authUser";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const userName = toNameAndLastName(user?.name || "Alex Carter");
  const userRole = user?.role || "worker";
  const userInitials = userName.split(" ").map((n) => n[0]).join("");

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      if (user) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted || !session?.user) {
        return;
      }

      try {
        const backendUser = await getCurrentUser();
        if (!mounted) {
          return;
        }
        setUser(mapBackendUserToAuthUser(backendUser));
      } catch {
        setUser(mapSupabaseUserToAuthUser(session.user));
      }
    };

    syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        localStorage.setItem("access_token", session.access_token);
        syncUser();
        return;
      }

      clearApiSession();
      logout();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [logout, setUser, user]);

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
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

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
