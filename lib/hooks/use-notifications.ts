// lib/hooks/use-notifications.ts
"use client";

import useSWR from "swr";

// --- Types (ঐচ্ছিক কিন্তু সহায়ক) ---
export interface NotificationItem {
  id: number;
  userId: string;
  taskId?: string | null;
  type: "frequency_missed" | "performance" | "general";
  message: string;
  createdAt: string; // ISO
  isRead: boolean;
  targetPath?: string | null; // থাকলে ডিপ-লিংক
}

type UnreadCountResp = { count: number };

// --- SWR fetcher ---
const fetcher = async <T = any>(url: string): Promise<T> => {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    // 401 হলে null/empty রিটার্ন করে UI-তে নরমালি হ্যান্ডেল করা সহজ
    if (res.status === 401) return null as unknown as T;
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
};

// --- Unread count (badge) ---
export function useUnreadCount() {
  const { data, error, isLoading, mutate } = useSWR<UnreadCountResp>(
    "/api/notifications/unread-count",
    fetcher,
    {
      refreshInterval: 8000, // poll
      revalidateOnFocus: true, // ট্যাব ফোকাসে রিফেচ
      dedupingInterval: 4000, // ডুপ রিকোয়েস্ট কমায়
    }
  );

  return {
    count: data?.count ?? 0,
    error,
    isLoading,
    refresh: mutate,
  };
}

// --- Notification list ---
/**
 * params উদাহরণ: "onlyUnread=1&take=20" বা "onlyUnread=0&take=50"
 */
export function useNotifications(params = "onlyUnread=0&take=20") {
  const key = `/api/notifications?${params}`;
  const { data, error, isLoading, mutate } = useSWR<NotificationItem[]>(
    key,
    fetcher
  );

  return {
    list: data ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}

// --- Actions ---
export async function markOneRead(id: number) {
  await fetch("/api/notifications/mark-read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id }),
  });
}

// সবগুলো রিড
export async function markAllRead() {
  await fetch("/api/notifications/mark-all-read", {
    method: "PATCH",
    credentials: "include",
  });
}

// একটাকে আনরেড (UI টগল দরকার হলে)
export async function markUnread(id: number) {
  await fetch(`/api/notifications/${id}/mark-unread`, {
    method: "PATCH",
    credentials: "include",
  });
}
