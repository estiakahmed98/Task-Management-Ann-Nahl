import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// PUT: Update role permissions
export async function PUT(req: NextRequest) {
  try {
    const { roleId, permissions } = await req.json()
    if (!roleId || !Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: "Role ID and permissions array are required" }, { status: 400 })
    }

    // First, remove all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    })

    // Then, add the new permissions
    if (permissions.length > 0) {
      const rolePermissions = permissions.map((permissionId) => ({
        roleId,
        permissionId,
      }))

      await prisma.rolePermission.createMany({
        data: rolePermissions,
      })
    }

    return NextResponse.json({ success: true, message: "Role permissions updated successfully" })
  } catch (error) {
    return handleError("updating role permissions", error)
  }
}

// GET: Fetch role permissions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roleId = searchParams.get("roleId")

    if (!roleId) {
      return NextResponse.json({ success: false, error: "Role ID is required" }, { status: 400 })
    }

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: {
        permissionId: true,
      },
    })

    const permissions = rolePermissions.map((rp) => rp.permissionId)
    return NextResponse.json({ success: true, data: permissions })
  } catch (error) {
    return handleError("fetching role permissions", error)
  }
}

// Helper function
function handleError(action: string, error: unknown) {
  console.error(`Error ${action}:`, error)
  return NextResponse.json(
    {
      success: false,
      error: `Failed ${action}`,
      message: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  )
}
