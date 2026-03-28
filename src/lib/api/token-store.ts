import { useAuthStore } from "@/store";
import { ACCESS_TOKEN_STORAGE_KEY } from "./constants";

let accessTokenMemory: string | null = null;

const listeners = new Set<() => void>();

const notifySessionChange = () => {
  listeners.forEach((listener) => listener());
};

const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const onApiSessionChange = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export function setApiAccessToken(token: string | null): void {
  const normalizedToken = token || null;

  if (accessTokenMemory !== normalizedToken) {
    accessTokenMemory = normalizedToken;
    notifySessionChange();
  }

  if (typeof window === "undefined") {
    return;
  }

  if (normalizedToken) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const storeToken = useAuthStore.getState().accessToken;

  if (storeToken) {
    accessTokenMemory = storeToken;
    return storeToken;
  }

  if (accessTokenMemory) {
    return accessTokenMemory;
  }

  const storedToken = getStoredAccessToken();

  if (storedToken) {
    accessTokenMemory = storedToken;
  }

  return storedToken;
}
