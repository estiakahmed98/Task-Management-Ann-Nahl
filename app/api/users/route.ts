// app/api/users/route.ts

import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logActivity } from "@/lib/logActivity"
import { getAuthUser } from "@/lib/getAuthUser"

// ============================ GET Users ============================
// ...top kept same

export async function GET(request: NextRequest) {
  try {
    const me = await getAuthUser()
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const q = (searchParams.get("q") || "").trim()

    const where: any = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}
    const roleName = (me as any)?.role?.name?.toLowerCase?.() || ""

    // If requester is a client, only return their assigned AM
    if (roleName === "client") {
      const clientId = (me as any)?.clientId || null
      if (!clientId) {
        return NextResponse.json({ users: [], total: 0, limit, offset, q }, { status: 200 })
      }

      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { amId: true },
      })
      const amId = client?.amId || null

      if (!amId) {
        return NextResponse.json({ users: [], total: 0, limit, offset, q }, { status: 200 })
      }

      const am = await prisma.user.findMany({
        skip: 0,
        take: 1,
        where: { id: amId, ...(Object.keys(where).length ? where : {}) },
        orderBy: { createdAt: "desc" },
        include: { role: { select: { id: true, name: true } } },
      })

      return NextResponse.json({ users: am, total: am.length, limit, offset, q }, { status: 200 })
    }

    // If requester is an AM, only return admins, managers, and AM's clients
    if (["am", "account manager", "account_manager"].includes(roleName)) {
      // Find clients managed by this AM
      const managed = await prisma.client.findMany({
        where: { amId: me?.id || "" },
        select: { id: true },
      })
      const clientIds = managed.map((c) => c.id)

      const adminManager = await prisma.user.findMany({
        where: {
          role: { name: { in: ["admin", "manager"] } },
          ...(Object.keys(where).length ? where : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { role: { select: { id: true, name: true } } },
      })

      const clientUsers = clientIds.length
        ? await prisma.user.findMany({
            where: {
              clientId: { in: clientIds },
              ...(Object.keys(where).length ? where : {}),
            },
            orderBy: { createdAt: "desc" },
            include: { role: { select: { id: true, name: true } } },
          })
        : []

      const map = new Map<string, any>()
      ;[...adminManager, ...clientUsers].forEach((u) => map.set(u.id, u))
      const result = Array.from(map.values())

      return NextResponse.json({ users: result, total: result.length, limit, offset, q }, { status: 200 })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: { role: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ])

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.status || "active",
    }))

    return NextResponse.json({ users: usersWithStatus, total, limit, offset, q }, { status: 200 })
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
      firstName,
      lastName,
      email,
      password,
      roleId,
      phone,
      address,
      category,
      clientId,
      status,
      biography,
      actorId,
      teamId, // Added teamId to destructuring
    } = body

    if (!email || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Optional: enforce clientId for client role
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } })
      if (role && role.name.toLowerCase() === "client" && !clientId) {
        return NextResponse.json({ error: "clientId is required for users with Client role" }, { status: 400 })
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        firstName,
        lastName,
        email,
        passwordHash,
        roleId,
        phone: phone || null,
        address: address || null,
        biography: biography || null,
        category: category || null,
        clientId: clientId || null,
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

    if (teamId && teamId.trim() !== "") {
      try {
        // Verify team exists
        const team = await prisma.team.findUnique({
          where: { id: teamId },
        })

        if (team) {
          // Find or create default template
          let template = await prisma.template.findFirst()

          if (!template) {
            template = await prisma.template.create({
              data: {
                id: "default-template",
                name: "Default Template",
                description: "Default template for team assignments",
              },
            })
          }

          // Create template team member assignment
          await prisma.templateTeamMember.create({
            data: {
              templateId: template.id,
              agentId: newUser.id,
              teamId: teamId,
              role: "Member",
              assignedDate: new Date(),
            },
          })

          console.log(`User ${newUser.id} assigned to team ${teamId}`)
        } else {
          console.warn(`Team ${teamId} not found, skipping team assignment`)
        }
      } catch (teamError) {
        console.error("Error assigning user to team:", teamError)
        // Don't fail user creation if team assignment fails
      }
    }

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: newUser.id,
      userId: actorId || null,
      action: "create",
      details: { email, roleId, name, teamId: teamId || null }, // Added teamId to audit log
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

    // Whitelist updatable fields to avoid passing unsupported props (e.g. teamId)
    const allowed: any = {}
    if (typeof rest.name !== "undefined") allowed.name = rest.name || null
    if (typeof rest.firstName !== "undefined") allowed.firstName = rest.firstName || null
    if (typeof rest.lastName !== "undefined") allowed.lastName = rest.lastName || null
    if (typeof rest.email !== "undefined") allowed.email = rest.email
    if (typeof rest.roleId !== "undefined") allowed.roleId = rest.roleId
    if (typeof rest.phone !== "undefined") allowed.phone = rest.phone || null
    if (typeof rest.address !== "undefined") allowed.address = rest.address || null
    if (typeof rest.category !== "undefined") allowed.category = rest.category || null
    if (typeof rest.clientId !== "undefined") allowed.clientId = rest.clientId || null
    if (typeof rest.status !== "undefined") allowed.status = rest.status || "active"

    const updateData: any = {
      ...allowed,
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
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    const actorId = searchParams.get("actorId"); // যে ডিলিট করল (optional)

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ---- FK cleanup (আপনার স্কিমা অনুযায়ী অ্যাডজাস্ট করুন) ----
    await prisma.$transaction(async (tx) => {
      // যদি NextAuth ব্যবহার করেন:
      // await tx.session.deleteMany({ where: { userId } });
      // await tx.account.deleteMany({ where: { userId } });

      // আপনার টিম-রিলেটেড ম্যাপিং টেবিল:
      await tx.templateTeamMember.deleteMany({ where: { agentId: userId } });
      await tx.clientTeamMember.deleteMany({ where: { agentId: userId } });

      // অন্য যেসব child টেবিল userId রেফার করে সেগুলো এখানে ডিলিট/ডিটাচ করুন

      // সবশেষে ইউজার ডিলিট
      await tx.user.delete({ where: { id: userId } });
    });

    // ---- Audit Log (নন-ফ্যাটাল) ----
    try {
      await logActivity({
        entityType: "User",
        entityId: userToDelete.id,
        // ⚠️ আপনার logActivity যদি actorId চায়, তাহলে actorId পাঠান:
        actorId: actorId ?? null,
        action: "delete",
        details: { email: userToDelete.email, name: userToDelete.name },
      });
    } catch (e) {
      console.warn("logActivity failed after delete:", e);
      // লগ ফেল করলে ডিলিট সফলতা নষ্ট করব না
    }

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        code: err?.code ?? null,        // e.g. P2003 দেখাবে
        message: err?.message ?? null,  // ডিবাগে আসল মেসেজ দেখুন
      },
      { status: 500 }
    );
  }
}
