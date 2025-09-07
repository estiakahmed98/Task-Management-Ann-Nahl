// PATCH /api/am/notifications/mark-all-read

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

  // Update all unread notifications where the task's client is managed by this AM
  await prisma.notification.updateMany({
    where: {
      isRead: false,
      task: { client: { amId: user.id } },
    },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
