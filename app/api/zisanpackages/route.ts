// app/api/zisanpackages/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { diffChanges, sanitizePackage } from "@/utils/audit";

// ============================ GET Packages ============================
export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            clients: true,
            templates: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

// ============================ CREATE Package ============================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorId =
      (typeof body.actorId === "string" && body.actorId) ||
      (typeof (request.headers.get("x-actor-id") || "") === "string" &&
        (request.headers.get("x-actor-id") as string)) ||
      null;

    const { name, description } = body;
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: { name, description: description || null },
      });

      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Package",
          entityId: pkg.id,
          userId: actorId,
          action: "create",
          details: { name: pkg.name, description: pkg.description ?? null },
        },
      });

      return pkg;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
