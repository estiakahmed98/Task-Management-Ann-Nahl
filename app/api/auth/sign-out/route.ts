// app/api/auth/sign-out/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;
    const originToken = cookieStore.get("impersonation-origin")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "No active session found" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: { userId: true, impersonatedBy: true, expiresAt: true },
    });

    // যদি ইমপারসোনেটেড সেশন হয়, তাহলে stop করে origin এ ফেরত যান
    if (session?.impersonatedBy && originToken) {
      const res = NextResponse.json(
        {
          success: true,
          message: "Ended impersonation and restored original session",
        },
        { status: 200 }
      );

      // বর্তমান টোকেন ডিলিট
      await prisma.session.deleteMany({ where: { token: sessionToken } });

      // origin টোকেন valid হলে restore করুন, না হলে clear
      const originValid = await prisma.session.findUnique({
        where: { token: originToken },
      });
      if (originValid) {
        res.cookies.set("session-token", originToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: Math.max(
            1,
            Math.floor((+originValid.expiresAt - Date.now()) / 1000)
          ),
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
      res.cookies.set("impersonation-origin", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      // (ঐচ্ছিক) lastSeenAt update: যেহেতু আপনি আগেই করছিলেন, রাখতে পারেন

      return res;
    }

    // নরমাল sign-out (আগের লজিক)
    if (session?.userId) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastSeenAt: new Date() },
      });
    }
    await prisma.session.deleteMany({ where: { token: sessionToken } });

    const response = NextResponse.json(
      { success: true, message: "Signed out successfully" },
      { status: 200 }
    );
    response.cookies.set("session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("impersonation-origin", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("❌ Sign-out error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong during sign-out" },
      { status: 500 }
    );
  }
}
