// hooks/useConversations.ts
import useSWR from "swr";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export function useConversations() {
  const { data, isLoading, error, mutate } = useSWR(
    "/api/chat/conversations",
    fetcher,
    {
      refreshInterval: 0,
    }
  );
  return { conversations: data ?? [], isLoading, error, mutate };
}
