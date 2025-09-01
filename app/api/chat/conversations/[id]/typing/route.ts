// app/api/chat/conversations/[id]/typing/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // এই কনভারসেশনের মেম্বার কিনা যাচাই
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // presence channel এ টাইপিং ইভেন্ট পাঠাই
  await pusherServer.trigger(`presence-conversation-${id}`, "typing", {
    userId: me.id,
    name: me.name || me.email || "Someone",
  });

  return NextResponse.json({ ok: true });
}
