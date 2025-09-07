// app/api/chat/roster/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

export async function GET(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";

  // If current user is a client, only return their assigned AM in the roster
  const roleName = (me as any)?.role?.name?.toLowerCase?.() || "";
  if (roleName === "client") {
    // Find the client's assigned AM
    const clientId = (me as any)?.clientId || null;
    if (!clientId) {
      return NextResponse.json({ online: [], offline: [], counts: { online: 0, offline: 0 }, q });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { amId: true },
    });

    const amId = client?.amId || null;
    if (!amId) {
      return NextResponse.json({ online: [], offline: [], counts: { online: 0, offline: 0 }, q });
    }

    const am = await prisma.user.findFirst({
      where: {
        id: amId,
        status: "active",
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true, image: true, lastSeenAt: true },
    });

    const now = Date.now();
    const amRow = am
      ? {
          ...am,
          isOnline: !!(
            am.lastSeenAt && now - new Date(am.lastSeenAt).getTime() <= ONLINE_WINDOW_MS
          ),
        }
      : null;

    const online = amRow && amRow.isOnline ? [amRow] : [];
    const offline = amRow && !amRow.isOnline ? [amRow] : [];

    return NextResponse.json({
      online,
      offline,
      counts: { online: online.length, offline: offline.length },
      q,
    });
  }

  // If current user is an Agent, hide AM and Client users from the roster
  if (roleName === "agent") {
    const users = await prisma.user.findMany({
      where: {
        id: { not: me.id },
        status: "active",
        // Exclude AM and Client roles
        NOT: {
          role: { name: { in: ["client", "am", "account manager", "account_manager"] } },
        },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        lastSeenAt: true,
      },
      orderBy: { name: "asc" },
    });

    const now = Date.now();
    const rows = users.map((u) => ({
      ...u,
      isOnline: !!(
        u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() <= ONLINE_WINDOW_MS
      ),
    }));

    const online = rows.filter((r) => r.isOnline);
    const offline = rows.filter((r) => !r.isOnline);

    return NextResponse.json({
      online,
      offline,
      counts: { online: online.length, offline: offline.length },
      q,
    });
  }

  // If current user is an AM (Account Manager), only show admins, managers and AM's clients
  if (["am", "account manager", "account_manager"].includes(roleName)) {
    // fetch clients managed by this AM
    const clients = await prisma.client.findMany({
      where: { amId: me.id },
      select: { id: true },
    });
    const clientIds = clients.map((c) => c.id);

    // admins and managers
    const adminManagerUsers = await prisma.user.findMany({
      where: {
        id: { not: me.id },
        status: "active",
        role: { name: { in: ["admin", "manager"] } },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, email: true, image: true, lastSeenAt: true },
    });

    // AM's clients (users whose clientId belongs to a client managed by this AM)
    const clientUsers = clientIds.length
      ? await prisma.user.findMany({
          where: {
            id: { not: me.id },
            status: "active",
            clientId: { in: clientIds },
            ...(q
              ? {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            lastSeenAt: true,
          },
        })
      : [];

    // merge unique by id
    const map = new Map<string, any>();
    [...adminManagerUsers, ...clientUsers].forEach((u) => map.set(u.id, u));
    const users = Array.from(map.values());

    const now = Date.now();
    const rows = users.map((u) => ({
      ...u,
      isOnline: !!(
        u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() <= ONLINE_WINDOW_MS
      ),
    }));

    const online = rows.filter((r) => r.isOnline);
    const offline = rows.filter((r) => !r.isOnline);

    return NextResponse.json({
      online,
      offline,
      counts: { online: online.length, offline: offline.length },
      q,
    });
  }

  // name/email contains (insensitive); চাইলে inactive-ও আনতে পারেন
  const users = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      status: "active",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      lastSeenAt: true,
    },
    orderBy: { name: "asc" },
  });

  const now = Date.now();
  const rows = users.map((u) => ({
    ...u,
    isOnline: !!(
      u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() <= ONLINE_WINDOW_MS
    ),
  }));

  const online = rows.filter((r) => r.isOnline);
  const offline = rows.filter((r) => !r.isOnline);

  return NextResponse.json({
    online,
    offline,
    counts: { online: online.length, offline: offline.length },
    q,
  });
}
