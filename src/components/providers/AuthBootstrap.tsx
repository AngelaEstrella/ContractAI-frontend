"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { mapBackendUserToAuthUser, mapSupabaseUserToAuthUser } from "@/lib/authUser";
import { getCurrentUser, logout as clearApiSession, setApiAccessToken } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store";

type Props = {
  readonly children: React.ReactNode;
};

export default function AuthBootstrap({ children }: Props) {
  const { logout, setHydrating, setSession } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    let syncRun = 0;

    const syncSession = async (session: Session | null) => {
      const currentRun = ++syncRun;

      if (!mounted) {
        return;
      }

      setHydrating(true);

      if (!session?.user) {
        setApiAccessToken(null);
        if (mounted && currentRun === syncRun) {
          logout();
          setHydrating(false);
        }
        return;
      }

      setApiAccessToken(session.access_token);

      try {
        const backendUser = await getCurrentUser();
        if (!mounted || currentRun !== syncRun) {
          return;
        }

        setSession(mapBackendUserToAuthUser(backendUser), session.access_token);
      } catch {
        if (!mounted || currentRun !== syncRun) {
          return;
        }

        setSession(mapSupabaseUserToAuthUser(session.user), session.access_token);
      } finally {
        if (mounted && currentRun === syncRun) {
          setHydrating(false);
        }
      }
    };

    const bootstrap = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        await syncSession(session);
      } catch {
        clearApiSession();
        if (mounted) {
          logout();
          setHydrating(false);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [logout, setHydrating, setSession]);

  return <>{children}</>;
}
