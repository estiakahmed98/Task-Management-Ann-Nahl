// app/api/dev/backfill-last-seen/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function POST() {
  await prisma.user.updateMany({
    where: { lastSeenAt: null },
    data: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
