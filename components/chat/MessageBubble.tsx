"use client";

import { useMemo, useState } from "react";
import { SmilePlus, Eye, Check, Forward as ForwardIcon } from "lucide-react";

type ReactionAgg = { emoji: string; count: number; userIds: string[] };
type Receipt = {
  userId: string;
  deliveredAt?: string | null;
  readAt?: string | null;
};

export default function MessageBubble({
  meId,
  msg,
  onForward,
  showSenderName = false, // new: show name above bubble (useful for group)
}: {
  meId?: string;
  msg: {
    id: string;
    content?: string | null;
    createdAt: string | Date;
    sender?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
    reactions?: ReactionAgg[];
    receipts?: Receipt[];
    attachments?: any;
  };
  onForward?: (messageId: string) => void;
  showSenderName?: boolean;
}) {
  const mine = meId ? msg?.sender?.id === meId : false;
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayName =
    (msg?.sender?.name && msg.sender.name.trim()) ||
    (msg?.sender?.email && msg.sender.email.trim()) ||
    (mine ? "You" : "User");

  const defaultSet = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👟"];

  async function toggleReaction(emoji: string) {
    setPickerOpen(false);
    try {
      await fetch(`/api/chat/messages/${msg.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // no-op
    }
  }

  // Sort reactions (mine first, then by count)
  const reactions = useMemo(() => {
    const arr = msg.reactions ?? [];
    const myFirst = [...arr].sort((a, b) => {
      const aMine = a.userIds?.includes(meId || "");
      const bMine = b.userIds?.includes(meId || "");
      if (aMine === bMine) return b.count - a.count;
      return aMine ? -1 : 1;
    });
    return myFirst;
  }, [msg.reactions, meId]);

  // Delivery / Read status (for own messages only)
  const status = useMemo(() => {
    if (!mine)
      return null as null | {
        kind: "sent" | "delivered" | "read";
        count?: number;
      };

    const others = (msg.receipts ?? []).filter((r) => r.userId !== meId);

    const readCount = others.filter((r) => !!r.readAt).length;
    if (readCount > 0) return { kind: "read", count: readCount };

    const deliveredCount = others.filter((r) => !!r.deliveredAt).length;
    if (deliveredCount > 0) return { kind: "delivered", count: deliveredCount };

    return { kind: "sent" };
  }, [mine, msg.receipts, meId]);

  const fwdMeta = msg.attachments?._forwarded || null;
  const isForwarded = !!fwdMeta;

  const forwardedByName =
    fwdMeta?.forwardedByName || (mine ? "You" : displayName); // sender is the forwarder
  const originalSenderName = fwdMeta?.originalSenderName || null;

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="flex items-end gap-2 max-w-[75%]">
        {!mine && (
          <div
            className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium"
            aria-hidden
            title={displayName}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="group relative">
          {/* optional sender name above bubble (for non-DM/group) */}
          {showSenderName && !mine && (
            <div className="text-[10px] text-gray-500 mb-0.5">
              {displayName}
            </div>
          )}

          <div
            className={`rounded-2xl px-3 py-2 ${
              mine ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            {isForwarded && (
              <div className="mb-1">
                <div
                  className={`text-[10px] uppercase tracking-wide ${
                    mine ? "text-emerald-300" : "text-emerald-700"
                  }`}
                >
                  Forwarded
                </div>
                <div
                  className={`text-[11px] ${
                    mine ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  by <span className="font-medium">{forwardedByName}</span>
                  {originalSenderName ? (
                    <>
                      {" "}
                      • from{" "}
                      <span className="font-medium">{originalSenderName}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {msg.content}

            {/* time + status */}
            <div
              className={`text-[10px] opacity-60 mt-1 flex items-center gap-2 ${
                mine ? "text-white" : "text-gray-600"
              }`}
            >
              <span>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {mine && status && (
                <>
                  {status.kind === "read" && (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      <span>
                        Seen
                        {typeof status.count === "number"
                          ? ` (${status.count})`
                          : ""}
                      </span>
                    </span>
                  )}

                  {status.kind === "delivered" && (
                    <span className="inline-flex items-center gap-1 text-sky-400">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      <span>
                        Delivered
                        {typeof status.count === "number"
                          ? ` (${status.count})`
                          : ""}
                      </span>
                    </span>
                  )}

                  {status.kind === "sent" && <span>sent</span>}
                </>
              )}
            </div>
          </div>

          {/* Reaction bar + Forward button */}
          <div className="mt-1 flex items-center gap-1">
            {reactions.map((r) => {
              const iReacted = !!meId && r.userIds?.includes(meId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => toggleReaction(r.emoji)}
                  className={`text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                    iReacted
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  title={
                    iReacted
                      ? `You and ${Math.max(0, r.count - 1)} other(s)`
                      : `${r.count} reaction(s)`
                  }
                >
                  <span className="mr-1">{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              );
            })}

            {/* Forward button (if handler provided) */}
            {onForward && (
              <button
                onClick={() => onForward(msg.id)}
                className="h-7 px-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow transition"
                title="Forward"
                aria-label="Forward message"
              >
                <ForwardIcon className="h-3.5 w-3.5" />
                <span className="text-xs">Forward</span>
              </button>
            )}

            {/* Emoji picker trigger */}
            <div className="relative">
              <button
                onClick={() => setPickerOpen((v) => !v)}
                className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow transition"
                title="Add reaction"
                aria-label="Add reaction"
              >
                <SmilePlus className="h-4 w-4" />
              </button>

              {pickerOpen && (
                <div
                  className="absolute z-20 mt-1 p-1 bg-white border border-gray-200 rounded-lg shadow-lg"
                  onMouseLeave={() => setPickerOpen(false)}
                >
                  <div className="flex gap-1">
                    {defaultSet.map((e) => (
                      <button
                        key={e}
                        onClick={() => toggleReaction(e)}
                        className="text-base hover:bg-gray-100 rounded px-1"
                        title={`React ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* end Reaction bar */}
        </div>
      </div>
    </div>
  );
}
