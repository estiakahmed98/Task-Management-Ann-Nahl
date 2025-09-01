// app/api/chat/conversations/[id]/messages/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";

export const dynamic = "force-dynamic";

// Next.js App Router (async params)
type Ctx = { params: Promise<{ id: string }> };

// -------- helpers --------
function aggregateReactions(
  rows: { emoji: string; userId: string }[]
): { emoji: string; count: number; userIds: string[] }[] {
  const map = new Map<
    string,
    { emoji: string; count: number; userIds: string[] }
  >();
  for (const r of rows) {
    if (!map.has(r.emoji)) {
      map.set(r.emoji, { emoji: r.emoji, count: 0, userIds: [] });
    }
    const row = map.get(r.emoji)!;
    row.count += 1;
    row.userIds.push(r.userId);
  }
  return Array.from(map.values());
}

// ============== GET ==============
// ?take=30&cursor=<oldestMessageIdFromPrevPage>
export async function GET(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // member check
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(
    Math.max(Number(url.searchParams.get("take") ?? 30), 1),
    100
  );
  const cursor = url.searchParams.get("cursor") ?? undefined;

  // Fetch newest -> oldest (desc), then reverse for ASC return
  const items = await prisma.chatMessage.findMany({
    where: { conversationId: id, deletedAt: null },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      reactions: { select: { emoji: true, userId: true } },
      receipts: { select: { userId: true, deliveredAt: true, readAt: true } },
    },
  });

  const nextCursor =
    items.length === take ? items[items.length - 1]?.id ?? null : null;

  const messages = items
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      content: m.content,
      type: m.type,
      createdAt: m.createdAt,
      sender: m.sender,
      attachments: m.attachments,
      reactions: aggregateReactions(m.reactions),
      receipts: m.receipts ?? [],
    }));

  return NextResponse.json({ messages, nextCursor });
}

// ============== POST ==============
// Body: { type?: "text"|"file"|"image"|"system", content?: string, attachments?: any, replyToId?: string }
export async function POST(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await ctx.params;

  // member check
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const type = (body?.type as "text" | "file" | "image" | "system") || "text";
  const content = (body?.content as string | undefined)?.trim() || "";
  const attachments = body?.attachments ?? null;
  const replyToId = (body?.replyToId as string | undefined) || undefined;

  if (type === "text" && !content) {
    return NextResponse.json({ message: "Content required" }, { status: 400 });
  }
  if (!["text", "file", "image", "system"].includes(type)) {
    return NextResponse.json(
      { message: "Invalid message type" },
      { status: 400 }
    );
  }

  // Create message
  const created = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: me.id,
      type,
      content: content || null,
      attachments,
      replyToId,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  const now = new Date();

  // Create self receipt (sender sees own message as delivered+read immediately)
  await prisma.messageReceipt.create({
    data: {
      messageId: created.id,
      userId: me.id,
      deliveredAt: now,
      readAt: now,
    },
  });

  const recs = [{ userId: me.id, deliveredAt: now, readAt: now }];

  const payload = {
    id: created.id,
    content: created.content,
    type: created.type,
    createdAt: created.createdAt,
    sender: created.sender,
    attachments: created.attachments,
    reactions: [] as { emoji: string; count: number; userIds: string[] }[],
    receipts: recs,
  };

  // Realtime: message:new
  await pusherServer.trigger(
    `presence-conversation-${conversationId}`,
    "message:new",
    payload
  );

  // Realtime: initial receipts state (sender)
  await pusherServer.trigger(
    `presence-conversation-${conversationId}`,
    "receipt:update",
    {
      updates: [
        {
          messageId: created.id,
          userId: me.id,
          deliveredAt: now.toISOString(),
          readAt: now.toISOString(),
        },
      ],
    }
  );

  return NextResponse.json({ ok: true, message: payload });
}
