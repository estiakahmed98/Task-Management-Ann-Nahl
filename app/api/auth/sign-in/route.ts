// app/api/auth/sign-in/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1) user + credentials + role + permissions
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: { where: { providerId: "credentials" } },
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const account = user.accounts[0];
    const isPasswordValid = await bcrypt.compare(
      password,
      account.password ?? ""
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2) নতুন session তৈরি
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          null,
        userAgent: req.headers.get("user-agent") ?? null,
      },
    });

    // ✅ 3) lastSeenAt আপডেট (online/last-seen এর জন্য)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    // 4) permissions list
    const permissions =
      user.role?.rolePermissions.map((rp) => rp.permission.name) || [];

    // 5) Response + cookie set
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.name ?? null,
          permissions,
        },
      },
      { status: 200 }
    );

    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
