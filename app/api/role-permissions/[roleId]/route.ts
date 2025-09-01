// app/api/role-permissions/[roleId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Get all permissions for a given role
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    const permissions = role.rolePermissions.map((rp) => rp.permission);

    return NextResponse.json({ success: true, role: role.name, permissions });
  } catch (error) {
    console.error("Error fetching permissions for role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions for role" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a specific permission from a role
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { permissionId } = await req.json();

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: "permissionId is required" },
        { status: 400 }
      );
    }

    const { roleId } = await params;
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permission removed from role successfully",
    });
  } catch (error) {
    console.error("Error removing permission from role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove permission from role" },
      { status: 500 }
    );
  }
}
