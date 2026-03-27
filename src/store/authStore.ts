import { create } from "zustand";
import type { AuthDisplayUser } from "@/lib/authUser";

interface AuthState {
  user: AuthDisplayUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setHydrating: (isHydrating: boolean) => void;
  setUser: (user: AuthDisplayUser) => void;
  setSession: (user: AuthDisplayUser, accessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrating: true,
  setHydrating: (isHydrating) => set({ isHydrating }),
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: true,
      accessToken: state.accessToken,
    })),
  setSession: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isHydrating: false,
    }),
  logout: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: false,
    }),
}));
