export const ACCESS_TOKEN_STORAGE_KEY = "access_token";

export const TIMEOUTS = {
  AUTH: 10_000,
  DEFAULT: 30_000,
  UPLOAD: 60_000,
  AI: 120_000,
} as const;

export const DOCUMENTS_CACHE_TTL_MS = 15_000;
export const CURRENT_USER_CACHE_TTL_MS = 15_000;

export const getApiBaseUrl = (): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no esta configurada.");
  }

  return apiBaseUrl;
};
