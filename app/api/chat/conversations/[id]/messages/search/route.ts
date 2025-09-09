// app/api/chat/conversations/[id]/messages/search/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/chat/conversations/:id/messages/search?q=...&take=20&cursor=<messageId>&from=ISO&to=ISO
export async function GET(req: Request, ctx: Ctx) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") || "").trim();
  const take = Math.min(Math.max(Number(u.searchParams.get("take") || 20), 1), 100);
  const cursor = u.searchParams.get("cursor") || undefined; // messageId to continue older
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");

  // membership check
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const where: any = { conversationId: id, deletedAt: null };
  if (q) where.content = { contains: q, mode: "insensitive" };
  if (from || to) {
    where.createdAt = {} as any;
    if (from) (where.createdAt as any).gte = new Date(from);
    if (to) {
      const dt = new Date(to);
      dt.setHours(23, 59, 59, 999);
      (where.createdAt as any).lte = dt;
    }
  }

  const rows = await prisma.chatMessage.findMany({
    where,
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const nextCursor = rows.length === take ? rows[rows.length - 1]?.id ?? null : null;

  return NextResponse.json({
    results: rows,
    nextCursor,
  });
}
