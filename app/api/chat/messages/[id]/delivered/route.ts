// app/api/chat/messages/[id]/delivered/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: messageId } = await ctx.params;

  // message + conversation
  const msg = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true, senderId: true },
  });
  if (!msg) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // must be a participant
  const isMember = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: msg.conversationId,
        userId: me.id,
      },
    },
    select: { userId: true },
  });
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // ignore delivering your own message
  if (msg.senderId === me.id) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();

  await prisma.messageReceipt.upsert({
    where: { messageId_userId: { messageId, userId: me.id } },
    update: { deliveredAt: now },
    create: { messageId, userId: me.id, deliveredAt: now },
  });

  await pusherServer.trigger(
    `presence-conversation-${msg.conversationId}`,
    "receipt:update",
    {
      updates: [
        {
          messageId,
          userId: me.id,
          deliveredAt: now.toISOString(),
        },
      ],
    }
  );

  return NextResponse.json({ ok: true });
}
