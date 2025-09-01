// hooks/useMessages.ts
import useSWR from "swr";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export function useMessages(conversationId: string, take = 30) {
  const key = conversationId
    ? `/api/chat/conversations/${conversationId}/messages?take=${take}`
    : null;
  const { data, isLoading, error, mutate } = useSWR(key, fetcher);
  return {
    messages: data?.messages ?? [],
    nextCursor: data?.nextCursor ?? null,
    isLoading,
    error,
    mutate,
  };
}
