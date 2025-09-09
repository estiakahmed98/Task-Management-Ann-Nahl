"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Send } from "lucide-react";
import { pusherClient } from "@/lib/pusher/client";
import { useUserSession } from "@/lib/hooks/use-user-session";
import MessageBubble from "./MessageBubble";
import ForwardModal from "./ForwardModal";
import { BackgroundGradient } from "../ui/background-gradient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRoster } from "@/hooks/useRoster";
import { Search } from "lucide-react";

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
  sender?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  attachments?: any;
  receipts?: Receipt[];
  reactions?: { emoji: string; count: number; userIds: string[] }[];
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

  // Conversation detail
  const { data: convDetail, mutate: mutateConv } = useSWR(
    `/api/chat/conversations/${conversationId}`,
    fetcher
  );

  // participants (for read pointers)
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

  // other user (dm)
  const otherUser = useMemo(() => {
    if (convDetail?.type !== "dm") return null;
    const arr = convDetail?.participants?.map((p: any) => p.user) || [];
    return arr.find((u: any) => u.id !== user?.id) || null;
  }, [convDetail, user?.id]);

  // presence
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const isOtherOnline = !!(otherUser && onlineIds.has(otherUser.id));
  const lastSeenText = otherUser?.lastSeenAt
    ? new Date(otherUser.lastSeenAt).toLocaleString()
    : null;

  // typing
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

    // Reactions: live update aggregated reactions on a message
    const onReactionUpdate = (d: { messageId: string; reactions: { emoji: string; count: number; userIds: string[] }[] }) => {
      if (!d?.messageId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === d.messageId ? { ...m, reactions: d.reactions || [] } : m))
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
      // update local participants
      setParticipants((prev) => {
        const copy = [...prev];
        const i = copy.findIndex((p) => p.userId === d.userId);
        if (i !== -1) copy[i] = { ...copy[i], lastReadAt: d.lastReadAt };
        return copy;
      });

      // Apply readAt locally on msgs up to cutoff
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
    channel.bind("reaction:update", onReactionUpdate);
    channel.bind("conversation:read", onConvRead);
    channel.bind("pusher:subscription_succeeded", onSub);
    channel.bind("pusher:member_added", onAdd);
    channel.bind("pusher:member_removed", onRem);

    return () => {
      channel.unbind("message:new", onNew);
      channel.unbind("typing", onTyping);
      channel.unbind("receipt:update", onReceiptUpdate);
      channel.unbind("reaction:update", onReactionUpdate);
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
      sender: user?.id
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        : null,
      type: "text",
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

  // ---- Forward modal wiring
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMsgId, setForwardMsgId] = useState<string | null>(null);

  // ---- Members dialog state
  const [membersOpen, setMembersOpen] = useState(false);

  // ---- Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);

  function openForward(messageId: string) {
    setForwardMsgId(messageId);
    setForwardOpen(true);
  }

  const isDM = convDetail?.type === "dm";

  // Optimistic reaction toggling
  async function handleToggleReaction(messageId: string, emoji: string) {
    const meId = user?.id;
    if (!meId) return;
    // compute optimistic next reactions
    setMessages((prev) => {
      return prev.map((m) => {
        if (m.id !== messageId) return m;
        const list = m.reactions ? [...m.reactions] : [];
        const i = list.findIndex((r) => r.emoji === emoji);
        if (i === -1) {
          // add new emoji with me
          list.push({ emoji, count: 1, userIds: [meId] });
        } else {
          const r = list[i];
          const hasMe = r.userIds.includes(meId);
          const nextUserIds = hasMe
            ? r.userIds.filter((id) => id !== meId)
            : [...r.userIds, meId];
          const nextCount = Math.max(0, (hasMe ? r.count - 1 : r.count + 1));
          const next = { ...r, userIds: nextUserIds, count: nextCount };
          if (next.count === 0) list.splice(i, 1);
          else list[i] = next;
        }
        return { ...m, reactions: list };
      });
    });

    // send to server; pusher will reconcile authoritative aggregate
    try {
      await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // on error, revert by toggling again optimistically (best-effort)
      setMessages((prev) => {
        return prev.map((m) => {
          if (m.id !== messageId) return m;
          const list = m.reactions ? [...m.reactions] : [];
          const i = list.findIndex((r) => r.emoji === emoji);
          if (i === -1) return m; // nothing to revert
          const r = list[i];
          const hasMe = r.userIds.includes(meId);
          const nextUserIds = hasMe
            ? r.userIds.filter((id) => id !== meId)
            : [...r.userIds, meId];
          const nextCount = Math.max(0, (hasMe ? r.count - 1 : r.count + 1));
          const next = { ...r, userIds: nextUserIds, count: nextCount };
          if (next.count === 0) list.splice(i, 1);
          else list[i] = next;
          return { ...m, reactions: list };
        });
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="font-semibold">
          {isDM
            ? `Chat with ${
                otherUser?.name || otherUser?.email
              }`
            : convDetail?.title || "Conversation"}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <BackgroundGradient>
            <button
              className="px-2 py-1 text-xs rounded bg-transparent text-white inline-flex items-center gap-1"
              onClick={() => setSearchOpen(true)}
              title="Search messages"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
          </BackgroundGradient>
          {isDM ? (
            <div className="text-xs">
              {isOtherOnline ? (
                <span className="text-emerald-600">● Online</span>
              ) : (
                <span className="text-gray-500">
                  {lastSeenText ? `last seen ${lastSeenText}` : "Offline"}
                </span>
              )}
            </div>
          ) : null}

          {/* Members management for group/team */}
          {convDetail?.type !== "dm" && (
            <BackgroundGradient>
              <button
                className="px-2 py-1 text-xs rounded bg-transparent text-white"
                onClick={() => setMembersOpen(true)}
              >
                Members
              </button>
            </BackgroundGradient>
          )}
        </div>
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
          <div id={`msg-${m.id}`} key={m.id}>
            <MessageBubble
              msg={m}
              meId={user?.id ?? undefined}
              onForward={openForward}
              showSenderName={!isDM}
              participants={(convDetail?.participants || []).map((p: any) => p.user)}
              onToggleReaction={(emoji: string) => handleToggleReaction(m.id, emoji)}
            />
          </div>
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
        <BackgroundGradient>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-4 py-2 rounded bg-transparent text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </BackgroundGradient>
      </div>

      {/* Forward Modal */}
      <ForwardModal
        open={forwardOpen}
        messageId={forwardMsgId}
        onClose={() => {
          setForwardOpen(false);
          setForwardMsgId(null);
        }}
      />

      {/* Members Modal */}
      <MembersDialog
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        conversationId={conversationId}
        convParticipants={convDetail?.participants || []}
        onChanged={() => mutateConv()}
      />

      {/* Search Modal */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        conversationId={conversationId}
        onJump={(id: string) => goToMessage(id)}
      />
    </div>
  );
}

// ---- Members dialog component ----
function MembersDialog({
  open,
  onClose,
  conversationId,
  convParticipants,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  convParticipants: any[];
  onChanged: () => void;
}) {
  const { online, offline } = useRoster();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const existingIds = new Set(
    (convParticipants || []).map((p: any) => p.user?.id).filter(Boolean)
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function addMembers() {
    const userIds = Array.from(selected).filter((id) => !existingIds.has(id));
    if (!userIds.length) return;
    await fetch(`/api/chat/conversations/${conversationId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    }).catch(() => {});
    setSelected(new Set());
    onChanged();
  }

  async function removeMember(userId: string) {
    await fetch(`/api/chat/conversations/${conversationId}/participants`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
    onChanged();
  }

  const rosterMap = new Map<string, any>();
  [...online, ...offline].forEach((u: any) => rosterMap.set(u.id, u));

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Group members</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Current members */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Current</div>
            <div className="max-h-64 overflow-auto border rounded p-2 space-y-1">
              {(convParticipants || []).map((p: any) => (
                <div key={p.userId} className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-gray-50">
                  <div className="flex-1 truncate">{p.user?.name || p.user?.email}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeMember(p.userId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Add members</div>
            <div className="max-h-64 overflow-auto border rounded p-2 space-y-1">
              {Array.from(rosterMap.values())
                .filter((u: any) => !existingIds.has(u.id))
                .map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggle(u.id)}
                    />
                    <span className="flex-1 truncate">{u.name || u.email}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={addMembers} disabled={!selected.size}>Add Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Search dialog component ----
function SearchDialog({
  open,
  onClose,
  conversationId,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  onJump: (messageId: string) => void | Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{
    id: string;
    content: string | null;
    createdAt: string;
    sender?: { id: string; name?: string | null; email?: string | null } | null;
  }[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<any>(null);

  async function runSearch(reset = true) {
    if (!q.trim()) {
      setResults([]);
      setNextCursor(null);
      return;
    }
    setLoading(true);
    try {
      const url = new URL(`/api/chat/conversations/${conversationId}/messages/search`, location.origin);
      url.searchParams.set("q", q.trim());
      url.searchParams.set("take", "25");
      if (!reset && nextCursor) url.searchParams.set("cursor", nextCursor);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      const items = (data?.results || []) as any[];
      setResults((prev) => (reset ? items : [...prev, ...items]));
      setNextCursor(data?.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }

  // auto-search on Enter
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") runSearch(true);
  }

  // live search (debounced)
  useEffect(() => {
    if (!open) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      if (q.trim()) runSearch(true);
      else {
        setResults([]);
        setNextCursor(null);
      }
    }, 300);
    setDebounceTimer(t);
    return () => clearTimeout(t);
  }, [q, open]);

  function highlight(text: string | null | undefined, query: string) {
    const str = text || "";
    if (!query.trim()) return str;
    const idx = str.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return str;
    const before = str.slice(0, idx);
    const match = str.slice(idx, idx + query.length);
    const after = str.slice(idx + query.length);
    return (
      <>
        {before}
        <span className="bg-yellow-200 text-black rounded px-0.5">{match}</span>
        {after}
      </>
    );
  }

  async function jumpTo(id: string) {
    await onJump(id);
    onClose();
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Search messages</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Type keywords and press Enter…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
          />

          <div className="max-h-80 overflow-auto divide-y border rounded">
            {results.map((r) => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => jumpTo(r.id)}
                title={new Date(r.createdAt).toLocaleString()}
              >
                <div className="text-sm font-medium truncate">{highlight(r.content, q)}</div>
                <div className="text-[11px] text-gray-500">
                  {r.sender?.name || r.sender?.email || "User"} • {new Date(r.createdAt).toLocaleString()}
                </div>
              </button>
            ))}
            {!results.length && !loading && (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                {q.trim() ? "No results" : "Type a query to search"}
              </div>
            )}
          </div>

          {nextCursor && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => runSearch(false)} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => runSearch(true)} disabled={!q.trim() || loading}>Search</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
