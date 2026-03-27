import type { LoginRequest, LoginResponse, User } from "@/types/api.types";
import { createCacheEntry, hasFreshCache, type CacheEntry } from "./cache";
import { CURRENT_USER_CACHE_TTL_MS, TIMEOUTS } from "./constants";
import { fetchAPI } from "./fetch-client";
import { onApiSessionChange, setApiAccessToken } from "./token-store";

let currentUserCache: CacheEntry<User> | null = null;
let currentUserInFlight: Promise<User> | null = null;

const resetAuthApiState = () => {
  currentUserCache = null;
  currentUserInFlight = null;
};

onApiSessionChange(resetAuthApiState);

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetchAPI<LoginResponse>(
    "/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    TIMEOUTS.AUTH,
    false,
  );

  if (response.access_token) {
    setApiAccessToken(response.access_token);
  }

  return response;
}

export function logout(): void {
  setApiAccessToken(null);
}

export async function getCurrentUser(): Promise<User> {
  if (hasFreshCache(currentUserCache, CURRENT_USER_CACHE_TTL_MS)) {
    return currentUserCache.data;
  }

  if (currentUserInFlight) {
    return currentUserInFlight;
  }

  currentUserInFlight = fetchAPI<User>(
    "/user/me",
    {
      method: "GET",
    },
    TIMEOUTS.DEFAULT,
  )
    .then((user) => {
      currentUserCache = createCacheEntry(user);
      return user;
    })
    .finally(() => {
      currentUserInFlight = null;
    });

  return currentUserInFlight;
}
