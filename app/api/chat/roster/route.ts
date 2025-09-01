// app/api/chat/roster/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export async function GET(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  // name/email contains (insensitive); চাইলে inactive-ও আনতে পারেন
  const users = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      status: "active",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      lastSeenAt: true,
    },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const rows = users.map((u) => ({
    ...u,
    isOnline: !!(
      u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() <= ONLINE_WINDOW_MS
    ),
  }));

  const online = rows.filter((r) => r.isOnline);
  const offline = rows.filter((r) => !r.isOnline);

  return NextResponse.json({
    online,
    offline,
    counts: { online: online.length, offline: offline.length },
    q,
  });
}
