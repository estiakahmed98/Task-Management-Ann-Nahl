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

  const roleName = (me as any)?.role?.name?.toLowerCase?.() || "";

  // Enforce: clients can only DM their assigned AM
  if (roleName === "client") {
    const clientId = (me as any)?.clientId || null;
    if (!clientId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { amId: true },
    });
    const amId = client?.amId || null;
    if (!amId || amId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  // Enforce: AM can only DM admins, managers, or AM's clients
  if (["am", "account manager", "account_manager"].includes(roleName)) {
    // load target user
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!target) {
      return NextResponse.json({ message: "Invalid user" }, { status: 400 });
    }

    const targetRole = target.role?.name?.toLowerCase?.() || "";
    let allowed = targetRole === "admin" || targetRole === "manager";
    if (!allowed) {
      // if target is a client user, ensure that user's clientId is managed by this AM
      const tClientId = (target as any)?.clientId || null;
      if (tClientId) {
        const count = await prisma.client.count({ where: { id: tClientId, amId: me.id } });
        allowed = count > 0;
      }
    }
    if (!allowed) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
  }

  // Enforce: agents cannot DM AMs or Clients
  if (roleName === "agent") {
    const target = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    const targetRole = target?.role?.name?.toLowerCase?.() || "";
    if (["client", "am", "account manager", "account_manager"].includes(targetRole)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
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
