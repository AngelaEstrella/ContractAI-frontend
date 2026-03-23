"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type AuthUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

const getAuthUser = (sessionUser: {
  email?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}): AuthUser => {
  const metadata = sessionUser.user_metadata ?? {};

  return {
    name: metadata.full_name || metadata.name || "Usuario",
    email: sessionUser.email || "Sin email",
    avatarUrl: metadata.avatar_url || null,
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/auth/callback`;
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
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
          setAuthUser(getAuthUser(session.user));
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

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        setAuthUser(getAuthUser(session.user));
      } else {
        setAuthUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const handleContinue = () => {
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login de prueba con Google + Supabase Auth.
        </p>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Cargando sesión...
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {!authUser && (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningIn ? "Redirigiendo..." : "Continuar con Google"}
              </button>
            )}

            {authUser && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
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
                  onClick={handleContinue}
                  className="mt-4 w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)]"
                >
                  Ir al dashboard
                </button>
              </div>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
