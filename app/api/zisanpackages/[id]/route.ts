// app/api/zisanpackages/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { diffChanges, sanitizePackage } from "@/utils/audit";

// ✅ GET Package by ID (no audit)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const pkg = await prisma.package.findUnique({
      where: { id },
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
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update Package (with audit log)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const { name, description } = body;
    const actorId =
      (typeof body.actorId === "string" && body.actorId) ||
      (typeof (req.headers.get("x-actor-id") || "") === "string" &&
        (req.headers.get("x-actor-id") as string)) ||
      null;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.package.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const pkg = await tx.package.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined
            ? { description: description || null }
            : {}),
        },
      });

      // diff only changed fields
      const changes = diffChanges(
        sanitizePackage(existing),
        sanitizePackage(pkg),
        ["updatedAt", "createdAt"]
      );

      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Package",
          entityId: pkg.id,
          userId: actorId,
          action: "update",
          details: { changes },
        },
      });

      return pkg;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    console.error("Update failed", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ✅ DELETE - Delete Package (with audit log)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const actorId =
      (typeof (req.nextUrl.searchParams.get("actorId") || "") === "string" &&
        (req.nextUrl.searchParams.get("actorId") as string)) ||
      (typeof (req.headers.get("x-actor-id") || "") === "string" &&
        (req.headers.get("x-actor-id") as string)) ||
      null;

    const ok = await prisma.$transaction(async (tx) => {
      const existing = await tx.package.findUnique({ where: { id } });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const count = await tx.package.findUnique({
        where: { id },
        select: {
          _count: { select: { clients: true, templates: true } },
        },
      });

      if (count && (count._count.clients > 0 || count._count.templates > 0)) {
        throw new Error("HAS_RELATIONS");
      }

      await tx.package.delete({ where: { id } });

      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Package",
          entityId: existing.id,
          userId: actorId,
          action: "delete",
          details: {
            name: existing.name,
            description: existing.description ?? null,
          },
        },
      });

      return true;
    });

    return NextResponse.json({ message: "Package deleted successfully." });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Package not found." },
        { status: 404 }
      );
    }
    if (error?.message === "HAS_RELATIONS") {
      return NextResponse.json(
        { error: "Cannot delete a package with related clients or templates." },
        { status: 409 }
      );
    }
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete package." },
      { status: 500 }
    );
  }
}
