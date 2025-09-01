// app/api/chat/conversations/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

// ---------- GET: detail (আগের মতোই) ----------
export async function GET(_req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  // member check
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              lastSeenAt: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(conv);
}

// ---------- DELETE: leave/self or delete/all ----------
export async function DELETE(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "self") as "self" | "all";

  // কনভারসেশন + creator/participants নিন
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { select: { userId: true } },
    },
  });
  if (!conv)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  const amIParticipant = conv.participants.some((p) => p.userId === me.id);
  if (!amIParticipant)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  if (scope === "self") {
    // আপনি conversation থেকে বেরিয়ে যাচ্ছেন
    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId: id, userId: me.id } },
    });

    // কেউ না থাকলে পুরোটা ডিলিট
    const remaining = await prisma.conversationParticipant.count({
      where: { conversationId: id },
    });
    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id } }); // messages, participants cascade
      return NextResponse.json({ ok: true, left: true, deleted: true });
    }
    return NextResponse.json({ ok: true, left: true, deleted: false });
  }

  // scope=all → শুধুমাত্র creator বা admin ডিলিট করতে পারবে
  const meWithRole = await prisma.user.findUnique({
    where: { id: me.id },
    include: { role: true },
  });
  const isAdmin = (meWithRole?.role?.name || "").toLowerCase() === "admin";
  const isCreator = conv.createdById === me.id;

  if (!isAdmin && !isCreator) {
    return NextResponse.json(
      { message: "Only creator or admin can delete for all" },
      { status: 403 }
    );
  }

  await prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
