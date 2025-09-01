// app/api/chat/unread-count/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ count: 0 }, { status: 401 });

  // আমি যে সব কনভার্সেশনে আছি + লাস্ট রিড টাইম
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId: me.id },
    select: { conversationId: true, lastReadAt: true },
  });

  if (!parts.length) return NextResponse.json({ count: 0 });

  // প্রতি কনভার্সেশনে unread message গুনে মোট যোগফল
  const counts = await Promise.all(
    parts.map(async (p) => {
      return prisma.chatMessage.count({
        where: {
          conversationId: p.conversationId,
          deletedAt: null,
          // নিজের পাঠানো মেসেজ বাদ
          NOT: { senderId: me.id },
          // lastReadAt-এর পরের মেসেজগুলোই unread
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      });
    })
  );

  const total = counts.reduce((a, b) => a + b, 0);
  return NextResponse.json({ count: total });
}
