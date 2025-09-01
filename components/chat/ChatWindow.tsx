// components/chat/ChatWindow.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Send } from "lucide-react";
import { pusherClient } from "@/lib/pusher/client";
import { useUserSession } from "@/lib/hooks/use-user-session";
import MessageBubble from "./MessageBubble";

function near(aIso: string, bIso: string, ms = 8000) {
  return Math.abs(new Date(aIso).getTime() - new Date(bIso).getTime()) <= ms;
}

type Receipt = {
  userId: string;
  deliveredAt?: string | null;
  readAt?: string | null;
};
type Msg = {
  id: string;
  content?: string | null;
  createdAt: string;
  type?: "text" | "file" | "image" | "system";
  sender?: { id: string; name?: string | null; image?: string | null } | null;
  attachments?: any;
  receipts?: Receipt[];
};

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useUserSession();

  const take = 30;
  const baseKey = `/api/chat/conversations/${conversationId}/messages?take=${take}`;
  const { data, isLoading } = useSWR(baseKey, fetcher);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Conversation detail (for header/presence & lastReadAt)
  const { data: convDetail } = useSWR(
    `/api/chat/conversations/${conversationId}`,
    fetcher
  );

  // Local mirror of participants (userId + lastReadAt) for live read state
  const [participants, setParticipants] = useState<
    { userId: string; lastReadAt: string | null }[]
  >([]);
  useEffect(() => {
    const arr =
      convDetail?.participants?.map((p: any) => ({
        userId: p.userId,
        lastReadAt: p.lastReadAt || null,
      })) || [];
    setParticipants(arr);
  }, [convDetail]);

  // Figure other user for header
  const otherUser = useMemo(() => {
    if (convDetail?.type !== "dm") return null;
    const arr = convDetail?.participants?.map((p: any) => p.user) || [];
    return arr.find((u: any) => u.id !== user?.id) || null;
  }, [convDetail, user?.id]);

  // Presence (optional)
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const isOtherOnline = !!(otherUser && onlineIds.has(otherUser.id));
  const lastSeenText = otherUser?.lastSeenAt
    ? new Date(otherUser.lastSeenAt).toLocaleString()
    : null;

  // Typing
  const [typingMap, setTypingMap] = useState<
    Record<string, { name?: string; until: number }>
  >({});
  const typingText = useMemo(() => {
    const now = Date.now();
    const active = Object.entries(typingMap)
      .filter(([uid, v]) => v.until > now && uid !== user?.id)
      .map(([_, v]) => v.name || "Someone");
    if (!active.length) return "";
    if (active.length === 1) return `${active[0]} is typing…`;
    if (active.length === 2) return `${active[0]} and ${active[1]} are typing…`;
    return `${active.slice(0, 2).join(", ")} and ${
      active.length - 2
    } others are typing…`;
  }, [typingMap, user?.id]);

  const listRef = useRef<HTMLDivElement>(null);
  const topSentinel = useRef<HTMLDivElement>(null);
  const bottomSentinel = useRef<HTMLDivElement>(null);

  // SWR -> local
  useEffect(() => {
    if (!data) return;
    setMessages(data.messages ?? []);
    setNextCursor(data.nextCursor ?? null);
    requestAnimationFrame(() =>
      bottomSentinel.current?.scrollIntoView({ block: "end" })
    );
  }, [data]);

  // Mark read (this user)
  useEffect(() => {
    if (!conversationId) return;
    fetch(`/api/chat/conversations/${conversationId}/read`, {
      method: "POST",
    }).catch(() => {});
  }, [conversationId, messages?.length]);

  // Infinite scroll
  useEffect(() => {
    if (!topSentinel.current) return;
    const el = topSentinel.current;

    const io = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && nextCursor) {
          const container = listRef.current;
          const prevHeight = container?.scrollHeight ?? 0;

          const older = await fetch(
            `${baseKey}&cursor=${encodeURIComponent(nextCursor)}`
          ).then((r) => r.json());

          setMessages((prev) => [...(older.messages ?? []), ...prev]);
          setNextCursor(older.nextCursor ?? null);

          requestAnimationFrame(() => {
            if (!container) return;
            const diff = container.scrollHeight - prevHeight;
            container.scrollTop = diff;
          });
        }
      },
      { root: listRef.current as any, threshold: 1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, baseKey]);

  // --- Real-time
  useEffect(() => {
    if (!conversationId) return;
    const channelName = `presence-conversation-${conversationId}`;
    const channel = pusherClient.subscribe(channelName);

    // message:new (+ optimistic replace)
    const onNew = (payload: Msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        const isMine = payload.sender?.id === user?.id;
        if (isMine) {
          const idx = prev.findIndex(
            (m) =>
              m.id.startsWith("opt-") &&
              m.sender?.id === user?.id &&
              m.content === payload.content &&
              near(m.createdAt, payload.createdAt, 8000)
          );
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = payload;
            return copy;
          }
        }
        return [...prev, payload];
      });

      // Receiver acknowledges delivered
      if (payload.sender?.id !== user?.id) {
        fetch(`/api/chat/messages/${payload.id}/delivered`, {
          method: "POST",
        }).catch(() => {});
      }

      requestAnimationFrame(() =>
        bottomSentinel.current?.scrollIntoView({ block: "end" })
      );
    };

    // typing
    const onTyping = (d: { userId: string; name?: string }) => {
      setTypingMap((prev) => ({
        ...prev,
        [d.userId]: { name: d.name, until: Date.now() + 2500 },
      }));
    };

    // Unified receipt updates (delivered/read)
    const onReceiptUpdate = (d: any) => {
      // shapes: { updates: [{messageId,userId,deliveredAt?,readAt?}...] }
      // or legacy: { messageId, receipts: [...] }
      const updates: {
        messageId: string;
        userId: string;
        deliveredAt?: string;
        readAt?: string;
      }[] = Array.isArray(d?.updates)
        ? d.updates
        : d?.messageId && Array.isArray(d?.receipts)
        ? d.receipts.map((r: any) => ({
            messageId: d.messageId,
            userId: r.userId,
            deliveredAt: r.deliveredAt,
            readAt: r.readAt,
          }))
        : [];

      if (!updates.length) return;

      setMessages((prev) => {
        const byMsg = new Map<string, typeof updates>();
        for (const u of updates) {
          if (!byMsg.has(u.messageId)) byMsg.set(u.messageId, []);
          byMsg.get(u.messageId)!.push(u);
        }
        return prev.map((m) => {
          const ups = byMsg.get(m.id);
          if (!ups) return m;
          const recMap = new Map((m.receipts ?? []).map((r) => [r.userId, r]));
          ups.forEach(({ userId, deliveredAt, readAt }) => {
            const existed = recMap.get(userId) || {
              userId,
              deliveredAt: null,
              readAt: null,
            };
            recMap.set(userId, {
              ...existed,
              deliveredAt: deliveredAt ?? existed.deliveredAt,
              readAt: readAt ?? existed.readAt,
            });
          });
          return { ...m, receipts: Array.from(recMap.values()) };
        });
      });
    };

    // Conversation-level read pointer
    const onConvRead = (d: { userId: string; lastReadAt: string }) => {
      setParticipants((prev) => {
        const copy = [...prev];
        const i = copy.findIndex((p) => p.userId === d.userId);
        if (i !== -1) copy[i] = { ...copy[i], lastReadAt: d.lastReadAt };
        return copy;
      });

      // Apply readAt to all messages up to lastReadAt for that user (client-side)
      const cutoff = new Date(d.lastReadAt).getTime();
      setMessages((prev) =>
        prev.map((m) => {
          const created = new Date(m.createdAt).getTime();
          if (created > cutoff) return m;
          const list = m.receipts ?? [];
          const idx = list.findIndex((r) => r.userId === d.userId);
          if (idx !== -1) {
            if (!list[idx].readAt) {
              const copy = [...list];
              copy[idx] = { ...copy[idx], readAt: d.lastReadAt };
              return { ...m, receipts: copy };
            }
            return m;
          }
          return {
            ...m,
            receipts: [
              ...list,
              { userId: d.userId, deliveredAt: null, readAt: d.lastReadAt },
            ],
          };
        })
      );
    };

    // presence list
    const onSub = (members: any) => {
      const s = new Set<string>();
      members.each((m: any) => s.add(m.id));
      setOnlineIds(s);
    };
    const onAdd = (m: any) =>
      setOnlineIds((prev) => {
        const n = new Set(prev);
        n.add(m.id);
        return n;
      });
    const onRem = (m: any) =>
      setOnlineIds((prev) => {
        const n = new Set(prev);
        n.delete(m.id);
        return n;
      });

    channel.bind("message:new", onNew);
    channel.bind("typing", onTyping);
    channel.bind("receipt:update", onReceiptUpdate);
    channel.bind("conversation:read", onConvRead);
    channel.bind("pusher:subscription_succeeded", onSub);
    channel.bind("pusher:member_added", onAdd);
    channel.bind("pusher:member_removed", onRem);

    return () => {
      channel.unbind("message:new", onNew);
      channel.unbind("typing", onTyping);
      channel.unbind("receipt:update", onReceiptUpdate);
      channel.unbind("conversation:read", onConvRead);
      channel.unbind("pusher:subscription_succeeded", onSub);
      channel.unbind("pusher:member_added", onAdd);
      channel.unbind("pusher:member_removed", onRem);
      pusherClient.unsubscribe(channelName);
    };
  }, [conversationId, user?.id]);

  // typing expiry
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        const next: typeof prev = {};
        for (const [k, v] of Object.entries(prev))
          if (v.until > now) next[k] = v;
        return next;
      });
    }, 800);
    return () => clearInterval(t);
  }, []);

  // send (optimistic)
  const [text, setText] = useState("");
  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setText("");

    const nowIso = new Date().toISOString();
    const optimistic: Msg = {
      id: `opt-${Date.now()}`,
      content,
      createdAt: nowIso,
      sender: user
        ? { id: user.id, name: user.name, image: user.image }
        : undefined,
      type: "text",
      // show self-receipt immediately
      receipts: user?.id
        ? [{ userId: user.id, deliveredAt: nowIso, readAt: nowIso }]
        : [],
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", content }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      requestAnimationFrame(() =>
        bottomSentinel.current?.scrollIntoView({ block: "end" })
      );
    }
  }

  // typing ping
  const lastTypingSentAt = useRef(0);
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSentAt.current > 1200) {
      lastTypingSentAt.current = now;
      fetch(`/api/chat/conversations/${conversationId}/typing`, {
        method: "POST",
      }).catch(() => {});
    }
  }

  useEffect(() => {
    if (!typingText) return;
    requestAnimationFrame(() =>
      bottomSentinel.current?.scrollIntoView({ block: "end" })
    );
  }, [typingText]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">
          {convDetail?.type === "dm"
            ? `Chat with ${otherUser?.name || "Direct Message"}`
            : "Conversation"}
        </div>
        {convDetail?.type === "dm" && (
          <div className="text-xs">
            {isOtherOnline ? (
              <span className="text-emerald-600">● Online</span>
            ) : (
              <span className="text-gray-500">
                {lastSeenText ? `last seen ${lastSeenText}` : "Offline"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto px-4 py-3 space-y-2">
        <div ref={topSentinel} />

        {isLoading && !messages.length && (
          <div className="text-center text-sm text-gray-500 mt-10">
            Loading…
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} meId={user?.id} />
        ))}

        {!!typingText && (
          <div className="flex justify-start">
            <div className="mt-1 inline-flex items-center gap-1 rounded-2xl bg-green-50 text-green-700 px-3 py-1 text-xs shadow-sm">
              <span className="animate-pulse">●</span>
              {typingText}
            </div>
          </div>
        )}

        <div ref={bottomSentinel} />
      </div>

      {/* Composer */}
      <div className="border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 outline-none focus:ring-1 focus:ring-black"
          placeholder="Write a message…"
          value={text}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </div>
    </div>
  );
}
