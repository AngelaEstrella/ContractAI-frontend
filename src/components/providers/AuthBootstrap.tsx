"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";
import { logout as clearApiSession, setApiAccessToken } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store";
import { resolveSessionUser } from "@/features/auth/lib/resolve-session-user";

type Props = {
  readonly children: React.ReactNode;
};

export default function AuthBootstrap({ children }: Props) {
  const { logout, setHydrating, setSession } = useAuthStore();

  useEffect(() => {
    let mounted = true;
    let syncRun = 0;

    const resetSessionState = () => {
      setApiAccessToken(null);
      logout();
      setHydrating(false);
    };

    const syncSession = async (session: Session | null) => {
      const currentRun = ++syncRun;

      if (!mounted) {
        return;
      }

      setHydrating(true);

      if (!session?.user) {
        if (mounted && currentRun === syncRun) {
          resetSessionState();
        }
        return;
      }

      setApiAccessToken(session.access_token);

      try {
        const authUser = await resolveSessionUser(session);

        if (!mounted || currentRun !== syncRun) {
          return;
        }

        setSession(authUser, session.access_token);
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
          resetSessionState();
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
