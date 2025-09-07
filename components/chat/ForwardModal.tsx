"use client";

import * as React from "react";
import useSWR from "swr";

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
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const url = React.useMemo(
    () => `/api/users?limit=20&q=${encodeURIComponent(q)}`,
    [q]
  );

  const { data } = useSWR(open ? url : null, fetcher);
  const users: User[] = data?.users ?? [];

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!messageId) return;
    const targetUserIds = Array.from(selected);
    if (!targetUserIds.length) return;
    await fetch(`/api/chat/messages/${messageId}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserIds }),
    });
    setSelected(new Set());
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

        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="Search users by name, email or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="max-h-72 overflow-auto space-y-1">
          {users.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggle(u.id)}
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
            disabled={!selected.size}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
          >
            Forward {selected.size ? `(${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
