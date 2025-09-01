// app/api/permissions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get a single permission by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return NextResponse.json(
        { success: false, error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: permission });
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permission" },
      { status: 500 }
    );
  }
}

// PUT: Update a permission by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, description } = await req.json();

    const { id } = await params;
    const updated = await prisma.permission.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update permission" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a permission by ID
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.permission.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete permission" },
      { status: 500 }
    );
  }
}
