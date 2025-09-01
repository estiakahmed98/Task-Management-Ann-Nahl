import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function aggregate(recs: { emoji: string; userId: string }[]) {
  const map = new Map<
    string,
    { emoji: string; count: number; userIds: string[] }
  >();
  for (const r of recs) {
    if (!map.has(r.emoji))
      map.set(r.emoji, { emoji: r.emoji, count: 0, userIds: [] });
    const row = map.get(r.emoji)!;
    row.count += 1;
    row.userIds.push(r.userId);
  }
  return Array.from(map.values());
}

// GET → reactions aggregate (optional, initial load)
export async function GET(_req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: messageId } = await ctx.params;

  // membership check via message → conversation
  const msg = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      conversation: {
        select: {
          participants: { select: { userId: true } },
        },
      },
    },
  });
  if (!msg) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const isMember = msg.conversation.participants.some(
    (p) => p.userId === me.id
  );
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const recs = await prisma.messageReaction.findMany({
    where: { messageId },
    select: { emoji: true, userId: true },
  });

  return NextResponse.json({
    messageId,
    reactions: aggregate(recs),
  });
}

// POST → toggle (add if not exists, else remove)
export async function POST(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: messageId } = await ctx.params;
  const { emoji } = await req.json();

  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ message: "Invalid emoji" }, { status: 400 });
  }

  // membership check
  const msg = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      conversation: {
        select: {
          participants: { select: { userId: true } },
        },
      },
    },
  });
  if (!msg) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const isMember = msg.conversation.participants.some(
    (p) => p.userId === me.id
  );
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // toggle
  const where = { messageId_userId_emoji: { messageId, userId: me.id, emoji } };
  const exists = await prisma.messageReaction.findUnique({ where });
  if (exists) {
    await prisma.messageReaction.delete({ where });
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId: me.id, emoji },
    });
  }

  // aggregate + broadcast
  const recs = await prisma.messageReaction.findMany({
    where: { messageId },
    select: { emoji: true, userId: true },
  });
  const payload = { messageId, reactions: aggregate(recs) };

  await pusherServer.trigger(
    `presence-conversation-${msg.conversationId}`,
    "reaction:update",
    payload
  );

  return NextResponse.json(payload);
}
