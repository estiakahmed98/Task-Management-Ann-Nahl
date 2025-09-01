// app/api/users/route.ts

import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logActivity } from "@/lib/logActivity"

// ============================ GET Users ============================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          role: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count(),
    ])

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.status || "active",
    }))

    return NextResponse.json({ users: usersWithStatus, total, limit, offset }, { status: 200 })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// ============================ CREATE User ============================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      roleId,
      phone,
      address,
      category,
      status,
      biography,
      actorId, // কে action করল
    } = body

    if (!email || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash,
        roleId,
        phone: phone || null,
        address: address || null,
        biography: biography || null,
        category: category || null,
        status: status || "active",
        emailVerified: false,
        accounts: {
          create: {
            providerId: "credentials",
            accountId: email,
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      include: { role: { select: { id: true, name: true } }, accounts: true },
    })

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: newUser.id,
      userId: actorId || null, // ✅ actorId এখানে যাবে
      action: "create",
      details: { email, roleId, name },
    })

    return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

// ============================ UPDATE User ============================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, password, biography, actorId, ...rest } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: any = {
      ...rest,
      status: rest.status || "active",
      biography: biography || null,
    }

    if (password && password.trim() !== "") {
      const trimmedPassword = password.trim()
      if (trimmedPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
      }
      updateData.passwordHash = await bcrypt.hash(trimmedPassword, 10)

      await prisma.account.updateMany({
        where: {
          userId: id,
          providerId: "credentials",
        },
        data: {
          password: updateData.passwordHash,
          updatedAt: new Date(),
        },
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: { select: { id: true, name: true } } },
    })

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: updatedUser.id,
      userId: actorId || null,
      action: "update",
      details: {
        before: existingUser,
        after: updatedUser,
        passwordChanged: !!password && password.trim() !== "",
      },
    })

    return NextResponse.json({ message: "User updated successfully", user: updatedUser }, { status: 200 })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// ============================ DELETE User ============================
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("id")
    const actorId = searchParams.get("actorId") // যে ডিলিট করল

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: userId } })

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: userToDelete.id,
      userId: actorId || null,
      action: "delete",
      details: { email: userToDelete.email, name: userToDelete.name },
    })

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
