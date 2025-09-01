// app/api/role-permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: List all role-permission mappings
export async function GET() {
  try {
    const mappings = await prisma.rolePermission.findMany({
      include: {
        role: { select: { id: true, name: true } },
        permission: { select: { id: true, name: true, description: true } },
      },
    });

    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    console.error("Error fetching role-permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role-permissions" },
      { status: 500 }
    );
  }
}

// POST: Assign a permission to a role
export async function POST(req: NextRequest) {
  try {
    const { roleId, permissionId } = await req.json();

    if (!roleId || !permissionId) {
      return NextResponse.json(
        { success: false, error: "roleId and permissionId are required" },
        { status: 400 }
      );
    }

    const mapping = await prisma.rolePermission.create({
      data: { roleId, permissionId },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error("Error assigning role-permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to assign role-permission" },
      { status: 500 }
    );
  }
}
