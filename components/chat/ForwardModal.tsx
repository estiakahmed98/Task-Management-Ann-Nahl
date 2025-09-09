"use client";

import * as React from "react";
import useSWR from "swr";
import { useConversations } from "@/hooks/useConversations";

type User = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
};

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function ForwardModal({
  open,
  onClose,
  messageId,
}: {
  open: boolean;
  onClose: () => void;
  messageId?: string | null;
}) {
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<"users" | "teams" | "groups">("users");
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set());
  const [selectedTeams, setSelectedTeams] = React.useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = React.useState<Set<string>>(new Set());
  const url = React.useMemo(
    () => `/api/users?limit=20&q=${encodeURIComponent(q)}`,
    [q]
  );

  const { data } = useSWR(open ? url : null, fetcher);
  const users: User[] = data?.users ?? [];

  // Teams
  const { data: teamsResp } = useSWR(open && tab === "teams" ? "/api/teams" : null, fetcher);
  const teams: { id: string; name: string }[] = React.useMemo(() => {
    const rows = teamsResp || [];
    return (rows || []).map((t: any) => ({ id: t.id, name: t.name }));
  }, [teamsResp]);

  // Groups (existing group conversations)
  const { conversations: groupsAll } = useConversations({ type: "group" });
  const groups = React.useMemo(() => groupsAll as any[], [groupsAll]);

  function toggleUser(id: string) {
    setSelectedUsers((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleTeam(id: string) {
    setSelectedTeams((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleGroup(convId: string) {
    setSelectedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(convId)) n.delete(convId);
      else n.add(convId);
      return n;
    });
  }

  async function submit() {
    if (!messageId) return;
    const targetUserIds = Array.from(selectedUsers);
    let targetConversationIds = Array.from(selectedGroups);

    // For selected teams, open/create team conversations, then add their IDs
    if (selectedTeams.size) {
      const teamIds = Array.from(selectedTeams);
      const convIds: string[] = [];
      for (const teamId of teamIds) {
        try {
          const res = await fetch("/api/chat/team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.id) convIds.push(data.id);
          }
        } catch {}
      }
      targetConversationIds = [...targetConversationIds, ...convIds];
    }

    if (!targetUserIds.length && !targetConversationIds.length) return;
    await fetch(`/api/chat/messages/${messageId}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserIds, targetConversationIds }),
    });
    setSelectedUsers(new Set());
    setSelectedTeams(new Set());
    setSelectedGroups(new Set());
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Forward message</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:underline hover:text-red-700"
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-2 flex items-center gap-2 text-sm">
          <button
            className={`px-2 py-1 rounded ${tab === "users" ? "bg-black text-white" : "bg-gray-100"}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`px-2 py-1 rounded ${tab === "teams" ? "bg-black text-white" : "bg-gray-100"}`}
            onClick={() => setTab("teams")}
          >
            Teams
          </button>
          <button
            className={`px-2 py-1 rounded ${tab === "groups" ? "bg-black text-white" : "bg-gray-100"}`}
            onClick={() => setTab("groups")}
          >
            Groups
          </button>
        </div>

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder={
            tab === "users"
              ? "Search users by name, email or phone…"
              : tab === "teams"
              ? "Search teams by name…"
              : "Search groups by title…"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="max-h-72 overflow-auto space-y-1">
          {tab === "users" && (
            <>
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                  />
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                    {u.name?.slice(0, 2) ?? "U"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u.name ?? u.email}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </label>
              ))}
              {!users.length && (
                <div className="text-sm text-gray-500 px-2 py-6 text-center">
                  No users found
                </div>
              )}
            </>
          )}

          {tab === "teams" && (
            <>
              {teams
                .filter((t) => (q ? (t.name || "").toLowerCase().includes(q.toLowerCase()) : true))
                .map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeams.has(t.id)}
                      onChange={() => toggleTeam(t.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-gray-500">Team</div>
                    </div>
                  </label>
                ))}
              {!teams.length && (
                <div className="text-sm text-gray-500 px-2 py-6 text-center">
                  No teams found
                </div>
              )}
            </>
          )}

          {tab === "groups" && (
            <>
              {groups
                .filter((g: any) => (q ? ((g.title || "").toLowerCase().includes(q.toLowerCase())) : true))
                .map((g: any) => (
                  <label
                    key={g.id}
                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.has(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{g.title || "GROUP"}</div>
                      <div className="text-xs text-gray-500">Group</div>
                    </div>
                    {g.unreadCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        {g.unreadCount}
                      </span>
                    )}
                  </label>
                ))}
              {!groups.length && (
                <div className="text-sm text-gray-500 px-2 py-6 text-center">
                  No groups found
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!selectedUsers.size && !selectedTeams.size && !selectedGroups.size}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
          >
            Forward {(() => { const n = selectedUsers.size + selectedTeams.size + selectedGroups.size; return n ? `(${n})` : ""; })()}
          </button>
        </div>
      </div>
    </div>
  );
}
