// GET /api/notifications

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  // session
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

  // params
  const u = new URL(req.url);
  const onlyUnread = u.searchParams.get("onlyUnread") === "1"; // backward compat
  const isReadParam = u.searchParams.get("isRead"); // "true" | "false" | null
  const type = u.searchParams.get("type"); // "general" | "performance" | "frequency_missed"
  const q = u.searchParams.get("q")?.trim();
  const dateFrom = u.searchParams.get("from");
  const dateTo = u.searchParams.get("to");
  const take = Number(u.searchParams.get("take") || 50);
  const cursorId = u.searchParams.get("cursorId");
  const sort = (u.searchParams.get("sort") === "asc" ? "asc" : "desc") as
    | "asc"
    | "desc";

  // where condition
  const where: any = { userId: user.id };
  if (onlyUnread) where.isRead = false;
  if (isReadParam === "true") where.isRead = true;
  if (isReadParam === "false") where.isRead = false;
  if (type && ["general", "performance", "frequency_missed"].includes(type))
    where.type = type;
  if (q) where.message = { contains: q, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      // include entire day
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
