// GET /api/am/notifications

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  // Get current session user (AM)
  const url = new URL("/api/auth/get-session", req.url);
  const sesRes = await fetch(url, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!sesRes.ok)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { user } = await sesRes.json();
  if (!user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Params
  const u = new URL(req.url);
  const onlyUnread = u.searchParams.get("onlyUnread") === "1"; // backward compat
  const isReadParam = u.searchParams.get("isRead"); // "true" | "false" | null
  const type = u.searchParams.get("type");
  const q = u.searchParams.get("q")?.trim();
  const dateFrom = u.searchParams.get("from");
  const dateTo = u.searchParams.get("to");
  const take = Number(u.searchParams.get("take") || 50);
  const cursorId = u.searchParams.get("cursorId");
  const sort = (u.searchParams.get("sort") === "asc" ? "asc" : "desc") as
    | "asc"
    | "desc";

  // where condition: notifications of tasks whose client is managed by this AM
  const where: any = {
    task: {
      client: {
        amId: user.id,
      },
    },
  };
  if (onlyUnread) where.isRead = false;
  if (isReadParam === "true") where.isRead = true;
  if (isReadParam === "false") where.isRead = false;
  if (type && ["general", "performance", "frequency_missed"].includes(type))
    where.type = type as any;
  if (q) where.message = { contains: q, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const data = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: sort },
    take,
    ...(cursorId ? { skip: 1, cursor: { id: Number(cursorId) } } : {}),
  });

  return NextResponse.json(data);
}
