// app/api/impersonate/start/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

function ip(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

async function currentSessionWithAuth(token: string | undefined) {
  if (!token) return null;
  return prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });
}

function hasImpersonatePermission(
  session: Awaited<ReturnType<typeof currentSessionWithAuth>>
) {
  if (!session?.user) return false;
  const roleName = session.user.role?.name?.toLowerCase();
  if (roleName === "admin") return true; // shortcut
  const perms =
    session.user.role?.rolePermissions.map((rp) => rp.permission.name) || [];
  return perms.includes("user_impersonate");
}

export async function POST(req: NextRequest) {
  try {
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const adminToken = req.cookies.get("session-token")?.value;
    const adminSession = await currentSessionWithAuth(adminToken);

    if (!adminSession) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!hasImpersonatePermission(adminSession)) {
      return NextResponse.json(
        { error: "Not allowed to impersonate" },
        { status: 403 }
      );
    }
    if (adminSession.userId === targetUserId) {
      return NextResponse.json(
        { error: "You are already this user" },
        { status: 400 }
      );
    }

    // Target user موجود কি না
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // নতুন "impersonated" সেশন: userId = target, impersonatedBy = admin
    const impersonatedToken = randomUUID();
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3h limit (আপনার ইচ্ছামতো)

    await prisma.session.create({
      data: {
        token: impersonatedToken,
        userId: target.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: ip(req),
        userAgent: req.headers.get("user-agent") ?? null,
        impersonatedBy: adminSession.userId,
      },
    });

    // Audit log (ঐচ্ছিক কিন্তু ভাল)
    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        entityType: "auth",
        entityId: target.id,
        userId: adminSession.userId,
        action: "impersonate_start",
        details: { targetUserId: target.id },
      },
    });

    const res = NextResponse.json(
      {
        success: true,
        message: `Now impersonating ${target.email || target.id}`,
        actingUser: { id: target.id, name: target.name, email: target.email },
      },
      { status: 200 }
    );

    // মূল এডমিন টোকেন সেফ রাখতে আলাদা কুকি
    res.cookies.set("impersonation-origin", adminToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3 * 60 * 60, // 3h
    });

    // ব্রাউজারে এখন থেকে টার্গেট ইউজারের সেশন চলবে
    res.cookies.set("session-token", impersonatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3 * 60 * 60,
    });

    return res;
  } catch (e) {
    console.error("impersonate/start error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
