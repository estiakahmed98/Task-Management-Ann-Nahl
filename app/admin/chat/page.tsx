// app/chat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { createConversation, markRead, openDM, openTeam } from "@/lib/chatClient";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { useRoster } from "@/hooks/useRoster";
import { useDebounce } from "@/hooks/useDebounce";
import ChatWindow from "@/components/chat/ChatWindow";
import { Search } from "lucide-react";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Team chat state
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Fetch teams (for admin view)
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((rows) => {
        const list = (rows || []).map((t: any) => ({ id: t.id, name: t.name }));
        setTeams(list);
        if (!selectedTeamId && list.length) setSelectedTeamId(list[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    markRead(activeId).catch(() => { });
  }, [activeId, messages?.length]);

  async function handleCreateDMManual() {
    const otherId = prompt("Enter other userId for DM:");
    if (!otherId) return;
    const conv = await createConversation({ type: "dm", memberIds: [otherId] });
    await refetchConvos();
    setActiveId(conv.id);
  }

  // Group creation modal state
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  function handleCreateGroup() {
    setGroupOpen(true);
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitCreateGroup() {
    const memberIds = Array.from(selectedMembers);
    try {
      const conv = await createConversation({ type: "group", title: groupTitle || undefined, memberIds });
      setGroupOpen(false);
      setGroupTitle("");
      setSelectedMembers(new Set());
      await refetchConvos();
      setActiveId(conv.id);
    } catch (e) {
      // silently fail; API will guard permissions
    }
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

  // Open team conversation
  const [openingTeam, setOpeningTeam] = useState(false);
  async function handleOpenTeam() {
    if (!selectedTeamId) return;
    try {
      setOpeningTeam(true);
      const { id } = await openTeam(selectedTeamId);
      await refetchConvos();
      setActiveId(id);
    } finally {
      setOpeningTeam(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 p-3 flex flex-col gap-4">
        {/* Team Chat Controls */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">Team Chat</div>
          <div className="flex gap-2">
            <select
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <BackgroundGradient>
              <button
                type="button"
                onClick={handleOpenTeam}
                disabled={!selectedTeamId || openingTeam}
                className="px-2 py-1 text-sm rounded bg-transparent text-white disabled:opacity-50"
                title="Open team conversation"
              >
                Open
              </button>
            </BackgroundGradient>
          </div>
          <div className="text-[11px] text-gray-500">
            Shows conversations filtered by selected team.
          </div>
        </div>

        {/* Conversations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Conversations</h2>
            <div className="flex items-center gap-2">
              <BackgroundGradient>
                <button
                  type="button"
                  className="px-2 py-1 text-sm rounded bg-transparent text-white"
                  onClick={handleCreateDMManual}
                >
                  + DM
                </button>
              </BackgroundGradient>
              <BackgroundGradient>
                <button
                  type="button"
                  className="px-2 py-1 text-sm rounded bg-transparent text-white"
                  onClick={handleCreateGroup}
                  title="Create a group chat"
                >
                  + Group
                </button>
              </BackgroundGradient>
            </div>
          </div>

          {convLoading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : (
            <ul className="space-y-1 overflow-auto max-h-[38vh] pr-1">
              {conversations.map((c: any) => {
                const title = getConversationTitle(c, me?.id ?? undefined);
                const subtitle = getConversationSubtitle(c, me?.id ?? undefined);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${activeId === c.id ? "bg-gray-100" : ""
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

      {/* Group creation modal */}
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Group title</label>
              <Input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g. Design Team"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">Select members</div>
              <div className="max-h-64 overflow-auto border rounded p-2 space-y-1">
                {Array.from(
                  new Map(
                    [...online, ...offline].map((u: any) => [u.id, u])
                  ).values()
                ).map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(u.id)}
                      onChange={() => toggleMember(u.id)}
                    />
                    <span className="flex-1 truncate">{u.name || u.email}</span>
                    <span className={`h-2 w-2 rounded-full ${online.some((o: any) => o.id === u.id) ? "bg-emerald-500" : "bg-gray-300"}`} />
                  </label>
                ))}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">You will be added automatically.</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button onClick={submitCreateGroup} disabled={selectedMembers.size === 0}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
