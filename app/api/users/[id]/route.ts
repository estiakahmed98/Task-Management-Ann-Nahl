// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const body = await req.json()
    const { name, email, password, phone, address, roleId } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    const data: any = { name, email, phone, address, roleId }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        category: true,
        biography: true,
        status: true,
        roleId: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update user", message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    await prisma.user.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete user", message: error.message },
      { status: 500 }
    )
  }
}
