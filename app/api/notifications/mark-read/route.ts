// app/api/notifications/unread-count/route.ts

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

  await prisma.notification.updateMany({
    where: { id: Number(id), userId: user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
