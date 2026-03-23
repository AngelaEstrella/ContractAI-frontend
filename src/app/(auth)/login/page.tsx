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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--gray-light)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[var(--primary-light)]/20 blur-3xl" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-blue-100 bg-white/95 p-8 shadow-xl shadow-blue-100/50 backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/logo-contractAI-azul.png"
            alt="ContractAI"
            width={38}
            height={38}
            className="rounded-md"
          />
          <div>
            <p className="text-base font-semibold text-slate-900">ContractAI</p>
            <p className="text-xs text-slate-500">Acceso seguro con Google</p>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">
          Accede para continuar con tu panel de contratos.
        </p>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Cargando sesión...
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {!authUser && (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12.23 10.27v3.94h5.57c-.24 1.27-1.71 3.72-5.57 3.72-3.35 0-6.07-2.78-6.07-6.2s2.72-6.2 6.07-6.2c1.9 0 3.18.81 3.91 1.5l2.66-2.56C17.08 2.87 14.9 2 12.23 2 6.93 2 2.63 6.3 2.63 11.73S6.93 21.45 12.23 21.45c6.81 0 9.34-4.78 9.34-7.24 0-.49-.05-.84-.12-1.21H12.23z"
                  />
                </svg>
                {isSigningIn ? "Redirigiendo..." : "Continuar con Google"}
              </button>
            )}

            {authUser && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-sm font-medium text-emerald-700">Sesión activa</p>

                <div className="mt-3 flex items-center gap-3">
                  {authUser.avatarUrl ? (
                    <Image
                      src={authUser.avatarUrl}
                      alt={`Avatar de ${authUser.name}`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                      {authUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-slate-800">{authUser.name}</p>
                    <p className="text-sm text-slate-600">{authUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="mt-4 w-full rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
                >
                  Ir al dashboard
                </button>
              </div>
            )}

            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
