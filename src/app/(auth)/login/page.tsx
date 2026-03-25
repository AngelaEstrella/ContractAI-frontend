"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { mapSupabaseUserToAuthUser } from "@/lib/authUser";
import { useAuthStore } from "@/store";

type AuthUserPreview = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserPreview | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return `${window.location.origin}/auth/callback`;
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      try {
        setLoading(true);
        setError(null);

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

        if (session?.user) {
          const normalizedUser = mapSupabaseUserToAuthUser(session.user);
          setUser(normalizedUser);
          setAuthUser({
            name: normalizedUser.name,
            email: normalizedUser.email,
            avatarUrl: normalizedUser.avatarUrl,
          });
        } else {
          setAuthUser(null);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo obtener la sesión");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        const normalizedUser = mapSupabaseUserToAuthUser(session.user);
        setUser(normalizedUser);
        setAuthUser({
          name: normalizedUser.name,
          email: normalizedUser.email,
          avatarUrl: normalizedUser.avatarUrl,
        });
        return;
      }

      setAuthUser(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser]);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google");
      setIsSigningIn(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50/50">
      {/* Nebula Background Effects */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[800px] w-[800px] rounded-full"
        style={{
          background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
          filter: "blur(100px)",
          opacity: 0.2,
        }}
      />
      <div
        className="pointer-events-none absolute -left-20 -top-60 h-[600px] w-[600px] rounded-full"
        style={{
          background: "linear-gradient(180deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
          filter: "blur(90px)",
          opacity: 0.18,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-48 -left-32 h-[750px] w-[750px] rounded-full"
        style={{
          background: "linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
          filter: "blur(100px)",
          opacity: 0.2,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 h-[650px] w-[650px] rounded-full"
        style={{
          background: "linear-gradient(180deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
          filter: "blur(90px)",
          opacity: 0.18,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[350px] w-[350px] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)",
          filter: "blur(70px)",
          opacity: 0.12,
        }}
      />

      {/* Subtle Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(#4f46e5 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Card */}
      <section className="relative z-10 w-full max-w-[480px] px-6">
        <div
          className="flex flex-col items-center rounded-[2rem] border border-indigo-200/60 bg-white/95 px-10 pb-12 pt-20 backdrop-blur-sm"
          style={{
            boxShadow: `
              0 4px 6px -1px rgba(79, 70, 229, 0.08),
              0 10px 15px -3px rgba(79, 70, 229, 0.1),
              0 20px 40px -4px rgba(99, 102, 241, 0.15),
              0 40px 80px -8px rgba(129, 140, 248, 0.12)
            `,
          }}
        >
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/logo-contractAI-azul.png"
              alt="ContractAI"
              width={80}
              height={80}
              className="rounded-xl object-contain"
            />
          </div>

          {/* Branding & Messaging */}
          <div className="mb-14 text-center">
            {/* Gradient Title */}
            <h1 className="mb-4 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              ContractAI
            </h1>
            <h2 className="mb-5 text-xl font-medium text-slate-700">
              Bienvenido de nuevo
            </h2>
            <p className="mx-auto max-w-[300px] text-sm leading-relaxed text-slate-500">
              Automatiza, analiza y optimiza tus contratos con el poder de la inteligencia artificial
            </p>
          </div>

          {/* Authentication Section */}
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-6 py-4">
                <svg
                  className="h-5 w-5 animate-spin text-indigo-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-slate-600">Cargando sesión...</span>
              </div>
            ) : !authUser ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="group flex w-full items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-4 transition-all duration-300 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-lg hover:shadow-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-800">
                    {isSigningIn ? "Redirigiendo..." : "Iniciar sesión con Google"}
                  </span>
                </button>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">Sesión activa</p>
                </div>

                <div className="mb-5 flex items-center gap-4">
                  {authUser.avatarUrl ? (
                    <Image
                      src={authUser.avatarUrl}
                      alt={`Avatar de ${authUser.name}`}
                      width={52}
                      height={52}
                      className="h-13 w-13 rounded-full object-cover shadow-sm ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-sm">
                      {authUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{authUser.name}</p>
                    <p className="text-sm text-slate-500">{authUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  <span>Ir al dashboard</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Trust Footer */}
          <div className="mt-16 flex items-center gap-2 opacity-40">
            <svg
              className="h-4 w-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              Acceso Autorizado
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}