import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId || userId === me.id) {
    return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
  }

  // exists?
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "dm",
      participants: {
        some: { userId: me.id },
      },
      AND: {
        participants: { some: { userId } },
      },
    },
    select: { id: true },
  });

  if (existing) return NextResponse.json({ id: existing.id });

  // create new DM
  const created = await prisma.conversation.create({
    data: {
      type: "dm",
      createdById: me.id,
      participants: {
        create: [{ userId: me.id }, { userId }],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
