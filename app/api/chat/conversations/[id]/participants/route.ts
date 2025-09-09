// app/api/chat/conversations/[id]/participants/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET: list participants with basic user info
export async function GET(_req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  // must be participant to view
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const conv = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      createdById: true,
      participants: {
        select: {
          userId: true,
          role: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
  return NextResponse.json(conv?.participants ?? []);
}

function isAdminOrManager(roleName: string) {
  const r = (roleName || "").toLowerCase();
  return r === "admin" || r === "manager";
}

async function ensureCanModify(conversationId: string, userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  const roleName = me?.role?.name || "";

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { createdById: true },
  });
  const isCreator = conv?.createdById === userId;
  const isAdminMgr = isAdminOrManager(roleName);
  if (!isCreator && !isAdminMgr) return false;
  return true;
}

// POST: add members { userIds: string[] }
export async function POST(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];
  if (!userIds.length) return NextResponse.json({ message: "userIds required" }, { status: 400 });

  // must be allowed to modify
  const allowed = await ensureCanModify(id, me.id);
  if (!allowed) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // Add unique users not already in participants
  const existing = await prisma.conversationParticipant.findMany({
    where: { conversationId: id },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((p) => p.userId));
  const toAdd = Array.from(new Set(userIds)).filter((uid) => uid && !existingIds.has(uid));
  if (!toAdd.length) return NextResponse.json({ ok: true, added: 0 });

  await prisma.conversationParticipant.createMany({
    data: toAdd.map((uid) => ({ conversationId: id, userId: uid, role: "member" })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, added: toAdd.length });
}

// DELETE: remove member (self-protection: cannot remove creator)
// Body: { userId: string }
export async function DELETE(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ message: "userId required" }, { status: 400 });

  const allowed = await ensureCanModify(id, me.id);
  if (!allowed) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // prevent deleting creator
  const conv = await prisma.conversation.findUnique({ where: { id }, select: { createdById: true } });
  if (conv?.createdById === userId) {
    return NextResponse.json({ message: "Cannot remove conversation owner" }, { status: 400 });
  }

  await prisma.conversationParticipant.delete({
    where: { conversationId_userId: { conversationId: id, userId } },
  }).catch(() => {});

  return NextResponse.json({ ok: true, removed: userId });
}
