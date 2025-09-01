// app/api/presence/heartbeat/route.ts

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: me.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
