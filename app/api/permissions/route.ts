// app/api/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all permissions
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// POST: Create a new permission
export async function POST(req: NextRequest) {
  try {
    const { id, name, description } = await req.json();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "id and name are required" },
        { status: 400 }
      );
    }

    const newPermission = await prisma.permission.create({
      data: { id, name, description },
    });

    return NextResponse.json({ success: true, data: newPermission });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create permission" },
      { status: 500 }
    );
  }
}
