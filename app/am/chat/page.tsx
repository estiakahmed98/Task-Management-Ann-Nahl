// app/chat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { createConversation, markRead, openDM } from "@/lib/chatClient";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { useRoster } from "@/hooks/useRoster";
import { useDebounce } from "@/hooks/useDebounce";
import ChatWindow from "@/components/chat/ChatWindow";
import { Search } from "lucide-react";

// helpers (same as before)
function getOtherUser(c: any, myId?: string) {
  if (!c?.participants || !myId) return null;
  return c.participants.find((p: any) => p.user?.id !== myId)?.user || null;
}
function getConversationTitle(c: any, myId?: string) {
  if (c?.type === "dm") {
    const other = getOtherUser(c, myId);
    return other?.name || "Direct Message";
  }
  return c?.title || (c?.type ? c.type.toUpperCase() : "Conversation");
}
function getConversationSubtitle(c: any, myId?: string) {
  if (c?.type === "dm") {
    const other = getOtherUser(c, myId);
    return other?.email || "Direct message";
  }
  return c?.messages?.[0]?.content ? c.messages[0].content : "No messages yet";
}
function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ChatPage() {
  const { user: me } = useUserSession();

  const {
    conversations,
    isLoading: convLoading,
    mutate: refetchConvos,
  } = useConversations();

  const [activeId, setActiveId] = useState<string | null>(null);
  const { messages } = useMessages(activeId ?? undefined);

  // 🔎 search state
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);

  // roster (filtered server-side by q)
  const {
    online,
    offline,
    counts,
    isLoading: rosterLoading,
    mutate: refetchRoster,
  } = useRoster(debounced);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (!activeId) return;
    markRead(activeId).catch(() => {});
  }, [activeId, messages?.length]);

  async function handleCreateDMManual() {
    const otherId = prompt("Enter other userId for DM:");
    if (!otherId) return;
    const conv = await createConversation({ type: "dm", memberIds: [otherId] });
    await refetchConvos();
    setActiveId(conv.id);
  }

  const [opening, setOpening] = useState<string | null>(null);
  async function handleOpenDM(userId: string) {
    try {
      setOpening(userId);
      const { id } = await openDM(userId);
      await refetchConvos();
      setActiveId(id);
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 p-3 flex flex-col gap-4">
        {/* Conversations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Conversations</h2>
            <button
              type="button"
              className="px-2 py-1 text-sm rounded bg-black text-white"
              onClick={handleCreateDMManual}
            >
              + DM
            </button>
          </div>

          {convLoading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <ul className="space-y-1 overflow-auto max-h-[38vh] pr-1">
              {conversations.map((c: any) => {
                const title = getConversationTitle(c, me?.id);
                const subtitle = getConversationSubtitle(c, me?.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        activeId === c.id ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{title}</span>
                        {c.unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {subtitle}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* People */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">People</h2>
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-800"
              onClick={() => refetchRoster()}
            >
              refresh
            </button>
          </div>

          {/* Search input */}
          <div className="relative mb-3">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name/email…"
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black"
              type="text"
            />
          </div>

          {/* Online */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-emerald-700 mb-1">
              Online ({counts.online})
            </div>
            {rosterLoading && !online.length ? (
              <div className="text-xs text-gray-500">Loading…</div>
            ) : online.length ? (
              <ul className="space-y-1 max-h-[22vh] overflow-auto pr-1">
                {online.map((u: any) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenDM(u.id)}
                      disabled={opening === u.id}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {u.name || u.email}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {u.email} • online
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-400">No online users</div>
            )}
          </div>

          {/* Offline */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Offline ({counts.offline})
            </div>
            {offline.length ? (
              <ul className="space-y-1 max-h-[22vh] overflow-auto pr-1">
                {offline.map((u: any) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenDM(u.id)}
                      disabled={opening === u.id}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">
                          {u.name || u.email}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {u.email} • last seen {timeAgo(u.lastSeenAt)}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-400">No offline users</div>
            )}
          </div>
        </div>
      </aside>

      {/* Right: Chat window */}
      <section className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="h-full grid place-items-center text-gray-500">
            Select a conversation or start a DM from People
          </div>
        ) : (
          <ChatWindow conversationId={activeId} />
        )}
      </section>
    </div>
  );
}
