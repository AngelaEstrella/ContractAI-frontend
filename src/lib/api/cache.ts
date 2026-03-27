export type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export const createCacheEntry = <T>(data: T): CacheEntry<T> => ({
  data,
  timestamp: Date.now(),
});

export const hasFreshCache = <T>(cache: CacheEntry<T> | null, ttlMs: number): cache is CacheEntry<T> => {
  return cache !== null && Date.now() - cache.timestamp < ttlMs;
};
