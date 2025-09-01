// app/api/chat/conversations/[id]/read/route.ts
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

  const { id } = await ctx.params;

  // member check
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Update participant level lastReadAt
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    data: { lastReadAt: now },
  });

  // Mark message receipts as read for this user in this conversation (only existing receipts)
  const toRead = await prisma.messageReceipt.findMany({
    where: {
      userId: me.id,
      readAt: null,
      message: { conversationId: id },
    },
    select: { messageId: true },
  });

  if (toRead.length) {
    await prisma.messageReceipt.updateMany({
      where: {
        userId: me.id,
        readAt: null,
        message: { conversationId: id },
      },
      data: { readAt: now },
    });

    // Notify clients to paint read ticks
    await pusherServer.trigger(
      `presence-conversation-${id}`,
      "receipt:update",
      {
        updates: toRead.map(({ messageId }) => ({
          messageId,
          userId: me.id,
          readAt: now.toISOString(),
        })),
      }
    );
  }

  // Also broadcast conversation-level pointer
  await pusherServer.trigger(
    `presence-conversation-${id}`,
    "conversation:read",
    {
      userId: me.id,
      lastReadAt: now.toISOString(),
    }
  );

  return NextResponse.json({ ok: true, at: now.toISOString() });
}
