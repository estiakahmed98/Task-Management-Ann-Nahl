// hooks/useRoster.ts
"use client";
import useSWR from "swr";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export function useRoster(q?: string) {
  const key =
    q && q.length
      ? `/api/chat/roster?q=${encodeURIComponent(q)}`
      : "/api/chat/roster";
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    refreshInterval: 15000,
  });
  return {
    online: data?.online ?? [],
    offline: data?.offline ?? [],
    counts: data?.counts ?? { online: 0, offline: 0 },
    q: data?.q ?? q ?? "",
    isLoading,
    error,
    mutate,
  };
}
