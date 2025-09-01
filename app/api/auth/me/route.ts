// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session-token")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const session = await prisma.session.findUnique({
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

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = session.user;
    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.name) || [];

    // যদি impersonatedBy থাকে, real admin info (lightweight) টেনে আনুন
    let realAdmin: { id: string; name: string | null; email: string } | null =
      null;
    if (session.impersonatedBy) {
      const admin = await prisma.user.findUnique({
        where: { id: session.impersonatedBy },
        select: { id: true, name: true, email: true },
      });
      if (admin) realAdmin = admin;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name ?? null,
        permissions,
      },
      impersonation: {
        isImpersonating: !!session.impersonatedBy,
        realAdmin, // who started it
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
