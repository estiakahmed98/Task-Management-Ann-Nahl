// app/api/auth/session/route.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = auth((req) => {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(req.auth);
});

// Add support for the POST method if needed
export const POST = GET;
