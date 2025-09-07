// PATCH /api/am/notifications/mark-read

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
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

  const { id } = await req.json();
  if (!id) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  // Ensure the notification belongs to a task whose client is managed by this AM
  const notif = await prisma.notification.findFirst({
    where: {
      id: Number(id),
      task: { client: { amId: user.id } },
    },
    select: { id: true },
  });

  if (!notif)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  await prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
