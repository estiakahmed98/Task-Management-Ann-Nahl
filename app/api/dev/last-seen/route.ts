// app/api/dev/last-seen/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, lastSeenAt: true },
  });
  return NextResponse.json(users);
}
