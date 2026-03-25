"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { mapBackendUserToAuthUser } from "@/lib/authUser";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { setUser, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      try {
        setError(null);

        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) {
          return;
        }

        if (session) {
          localStorage.setItem("access_token", session.access_token);
          const backendUser = await getCurrentUser();
          setUser(mapBackendUserToAuthUser(backendUser));
          router.replace("/dashboard");
          return;
        }

        router.replace("/login");
      } catch (err) {
        await supabase.auth.signOut();
        localStorage.removeItem("access_token");
        logout();
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Error al completar la autenticación");
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [logout, router, setUser]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Procesando inicio de sesión</h1>
        <p className="mt-2 text-sm text-slate-600">Espera un momento mientras validamos tu sesión.</p>
        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
