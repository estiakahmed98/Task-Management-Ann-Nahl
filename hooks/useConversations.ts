// hooks/useConversations.ts
import useSWR from "swr";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export function useConversations(filters?: { type?: string; teamId?: string; take?: number; cursor?: string }) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.teamId) params.set("teamId", filters.teamId);
  if (filters?.take) params.set("take", String(filters.take));
  if (filters?.cursor) params.set("cursor", filters.cursor);
  const key = `/api/chat/conversations${params.toString() ? `?${params.toString()}` : ""}`;

  const { data, isLoading, error, mutate } = useSWR(key, fetcher, {
    refreshInterval: 0,
  });
  return { conversations: data ?? [], isLoading, error, mutate };
}
