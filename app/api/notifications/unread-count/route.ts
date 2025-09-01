// app/api/notifications/unread-count/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
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

  const count = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ count });
}
