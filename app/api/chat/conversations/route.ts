// app/api/chat/conversations/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

// POST /api/chat/conversations  → create
export async function POST(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const {
    type = "dm",
    title,
    memberIds = [],
    clientId,
    teamId,
    assignmentId,
    taskId,
  } = (await req.json()) || {};

  // Enforce: clients may only create a DM with their assigned AM
  const roleName = (me as any)?.role?.name?.toLowerCase?.() || "";
  if (roleName === "client") {
    // fetch client's AM
    const myClientId = (me as any)?.clientId || null;
    if (!myClientId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const client = await prisma.client.findUnique({
      where: { id: myClientId },
      select: { amId: true },
    });
    const amId = client?.amId || null;
    // Only allowed if: type === 'dm' and memberIds contain only AM (besides me)
    const others = (Array.isArray(memberIds) ? memberIds : []).filter(
      (id: string) => id && id !== me.id
    );
    const onlyAM = others.length === 1 && amId && others[0] === amId;
    if (type !== "dm" || !onlyAM) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  const uniqueMemberIds = Array.from(new Set([...memberIds, me.id]));

  const conv = await prisma.conversation.create({
    data: {
      type,
      title: title || null,
      createdById: me.id,
      clientId: clientId || null,
      teamId: teamId || null,
      assignmentId: assignmentId || null,
      taskId: taskId || null,
      participants: {
        create: uniqueMemberIds.map((uid) => ({
          userId: uid,
          role: uid === me.id ? "owner" : "member",
        })),
      },
    },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return NextResponse.json(conv, { status: 201 });
}

// GET /api/chat/conversations  → my list
export async function GET(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const u = new URL(req.url);
  const take = Number(u.searchParams.get("take") || 30);
  const cursor = u.searchParams.get("cursor") || undefined;

  const cps = await prisma.conversationParticipant.findMany({
    where: { userId: me.id },
    take,
    ...(cursor
      ? {
          skip: 1,
          cursor: {
            conversationId_userId: { conversationId: cursor, userId: me.id },
          },
        }
      : {}),
    select: { conversationId: true, lastReadAt: true },
    orderBy: { joinedAt: "desc" },
  });

  const convIds = cps.map((c) => c.conversationId);
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: convIds } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });

  const lastReadBy: Record<string, Date | null> = {};
  cps.forEach((c) => (lastReadBy[c.conversationId] = c.lastReadAt ?? null));

  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const lastReadAt = lastReadBy[conv.id] ?? new Date(0);
      const unreadCount = await prisma.chatMessage.count({
        where: {
          conversationId: conv.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: me.id },
          deletedAt: null,
        },
      });
      return { ...conv, unreadCount };
    })
  );

  return NextResponse.json(withUnread);
}
