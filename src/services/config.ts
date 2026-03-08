export const SWR_DEFAULTS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  suspense: false,
  errorRetryCount: 2,
  dedupingInterval: 5000,
} as const;

export const SWR_SLOW_POLL = {
  ...SWR_DEFAULTS,
  refreshInterval: 60000,
} as const;

// Mihomo API data: keep retrying until core is ready, re-fetch stale data
export const SWR_MIHOMO = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  suspense: false,
  dedupingInterval: 1500,
  errorRetryInterval: 1000,
};

export const SWR_EXTERNAL_API = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  suspense: false,
  shouldRetryOnError: true,
  errorRetryCount: 1,
  errorRetryInterval: 30_000,
  dedupingInterval: 1500,
} as const;
