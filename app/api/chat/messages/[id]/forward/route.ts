import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";
import { getOrCreateDm } from "@/lib/chat/dm";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id: sourceMessageId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  let targetUserIds: string[] = Array.isArray(body?.targetUserIds)
    ? body.targetUserIds
    : [];
  let targetConversationIds: string[] = Array.isArray(
    body?.targetConversationIds
  )
    ? body.targetConversationIds
    : [];

  if (!targetUserIds.length && !targetConversationIds.length) {
    return NextResponse.json({ message: "No targets" }, { status: 400 });
  }

  // 1) Load the source message + membership check
  const src = await prisma.chatMessage.findUnique({
    where: { id: sourceMessageId },
    include: {
      conversation: {
        select: { id: true, participants: { select: { userId: true } } },
      },
      sender: { select: { id: true, name: true } },
    },
  });
  if (!src)
    return NextResponse.json({ message: "Source not found" }, { status: 404 });

  const isMember = src.conversation.participants.some(
    (p) => p.userId === me.id
  );
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // Policy: If the forwarder is a client, only allow forwarding to their assigned AM
  const roleName = (me as any)?.role?.name?.toLowerCase?.() || "";
  if (roleName === "client") {
    const meClientId = (me as any)?.clientId || null;
    if (!meClientId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const client = await prisma.client.findUnique({
      where: { id: meClientId },
      select: { amId: true },
    });
    const amId = client?.amId || null;
    if (!amId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Filter targets: only the AM user allowed
    targetUserIds = targetUserIds.filter((uid) => uid === amId);

    // Only allow conversation targets that are DM between client and AM
    if (targetConversationIds.length) {
      const convs = await prisma.conversation.findMany({
        where: { id: { in: targetConversationIds } },
        select: { id: true, type: true, participants: { select: { userId: true } } },
      });
      const allowed = convs
        .filter((c) => {
          const ids = new Set(c.participants.map((p) => p.userId));
          return c.type === "dm" && ids.size === 2 && ids.has(me.id) && ids.has(amId);
        })
        .map((c) => c.id);
      targetConversationIds = targetConversationIds.filter((cid) => allowed.includes(cid));
    }

    if (!targetUserIds.length && !targetConversationIds.length) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  // 2) Compose forwarded payload
  const forwardedMeta = {
    forwardedFromMessageId: src.id,
    forwardedFromConversationId: src.conversationId,
    forwardedById: me.id,
    originalSenderId: src.senderId,
  };

  const prefix = `↪️ Forwarded${
    src.sender?.name ? ` from ${src.sender.name}` : ""
  }: `;
  const content = `${prefix}${src.content ?? ""}`.trim();

  const results: { conversationId: string; messageId: string }[] = [];

  // 3) forward to target users (DMs)
  for (const uid of targetUserIds) {
    if (uid === me.id) continue;
    const dm = await getOrCreateDm(me.id, uid);
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: dm.id,
        senderId: me.id,
        type: src.type,
        content,
        attachments: mergeAttachments(src.attachments, forwardedMeta),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });
    results.push({ conversationId: dm.id, messageId: msg.id });
    await pusherServer.trigger(
      `presence-conversation-${dm.id}`,
      "message:new",
      serialize(msg)
    );
  }

  // 4) forward to target conversations (must be a participant)
  for (const cid of targetConversationIds) {
    const membership = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: cid, userId: me.id } },
      select: { userId: true },
    });
    if (!membership) continue;

    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: cid,
        senderId: me.id,
        type: src.type,
        content,
        attachments: mergeAttachments(src.attachments, forwardedMeta),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });
    results.push({ conversationId: cid, messageId: msg.id });
    await pusherServer.trigger(
      `presence-conversation-${cid}`,
      "message:new",
      serialize(msg)
    );
  }

  return NextResponse.json({ ok: true, forwarded: results });
}

function mergeAttachments(existing: any, meta: any) {
  try {
    const o = existing && typeof existing === "object" ? existing : {};
    return { ...o, _forwarded: meta };
  } catch {
    return { _forwarded: meta };
  }
}

function serialize(m: any) {
  // shape compatible with ChatWindow expectations
  return {
    id: m.id,
    content: m.content,
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    type: m.type,
    sender: m.sender,
    attachments: m.attachments,
    receipts: [], // receiver will mark delivered/read
  };
}
