// app/api/zisanpackages/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ============================ GET Packages ============================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get("include") === "stats";

    const packages = await prisma.package.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        totalMonths: true, // ✅ include new field
        createdAt: true, // ✅ for UI "Created" line
        updatedAt: true,
        ...(includeStats
          ? {
              _count: {
                select: { clients: true, templates: true },
              },
            }
          : {}), // if not requested, you can skip counts (lighter)
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

    const headerActor = request.headers.get("x-actor-id");
    const actorId =
      (typeof body.actorId === "string" && body.actorId) ||
      (typeof headerActor === "string" && headerActor) ||
      null;

    let { name, description, totalMonths } = body as {
      name?: string;
      description?: string | null;
      totalMonths?: number | string | null;
    };

    // Basic validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    // Coerce totalMonths to number if string; allow null/undefined
    if (
      totalMonths !== undefined &&
      totalMonths !== null &&
      totalMonths !== ""
    ) {
      const coerced = Number(totalMonths);
      if (
        !Number.isFinite(coerced) ||
        coerced <= 0 ||
        !Number.isInteger(coerced)
      ) {
        return NextResponse.json(
          { error: "totalMonths must be a positive integer" },
          { status: 400 }
        );
      }
      totalMonths = coerced;
    } else {
      totalMonths = null;
    }

    const created = await prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          totalMonths: totalMonths as number | null, // ✅ save new field
        },
      });

      // Minimal activity log (if you have a table/model for this)
      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Package",
          entityId: pkg.id,
          userId: actorId,
          action: "create",
          details: {
            name: pkg.name,
            description: pkg.description ?? null,
            totalMonths: pkg.totalMonths ?? null, // ✅ include in log
          },
        },
      });

      return pkg;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // Handle Prisma unique errors for `name` (if unique)
    if (error?.code === "P2002" || error?.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "Package name must be unique" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
