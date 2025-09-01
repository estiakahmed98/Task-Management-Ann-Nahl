// app/api/impersonate/stop/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const currentToken = req.cookies.get("session-token")?.value || null;
    const originToken = req.cookies.get("impersonation-origin")?.value || null;

    if (!currentToken) {
      return NextResponse.json({ error: "No active session" }, { status: 400 });
    }

    // বর্তমান সেশনটা সত্যি ইমপারসোনেশন কি না যাচাই
    const session = await prisma.session.findUnique({
      where: { token: currentToken },
      select: { userId: true, impersonatedBy: true },
    });

    if (!session?.impersonatedBy) {
      return NextResponse.json({ error: "Not impersonating" }, { status: 400 });
    }

    // অডিট লগ
    await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        entityType: "auth",
        entityId: session.userId,
        userId: session.impersonatedBy,
        action: "impersonate_stop",
        details: {},
      },
    });

    // ইমপারসোনেটেড সেশন মুছে দিন
    await prisma.session.deleteMany({ where: { token: currentToken } });

    const res = NextResponse.json(
      { success: true, message: "Impersonation ended" },
      { status: 200 }
    );

    // যদি অরিজিন সেশন থাকে এবং বৈধ হয়, সেটায় ফিরে যান; না হলে সেশন ক্লিয়ার
    if (originToken) {
      const origin = await prisma.session.findUnique({
        where: { token: originToken },
        select: { expiresAt: true },
      });

      if (origin) {
        const seconds = Math.max(
          1,
          Math.floor((origin.expiresAt.getTime() - Date.now()) / 1000)
        );
        res.cookies.set("session-token", originToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: seconds,
        });
      } else {
        res.cookies.set("session-token", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }
    } else {
      res.cookies.set("session-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }

    // অরিজিন টোকেন কুকি ক্লিয়ার
    res.cookies.set("impersonation-origin", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (e) {
    console.error("impersonate/stop error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
