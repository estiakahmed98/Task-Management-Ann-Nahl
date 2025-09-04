// app/api/users/route.ts

import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/logActivity";

// ============================ GET Users ============================
// ...top kept same

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const offset = Number.parseInt(searchParams.get("offset") || "0");
    const q = (searchParams.get("q") || "").trim();

    const where: any = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: { role: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.status || "active",
    }));

    return NextResponse.json(
      { users: usersWithStatus, total, limit, offset, q },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// ============================ CREATE User ============================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
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
    } = body;

    if (!email || !password || !roleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Optional: enforce clientId for client role
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (role && role.name.toLowerCase() === "client" && !clientId) {
        return NextResponse.json(
          { error: "clientId is required for users with Client role" },
          { status: 400 }
        );
      }
    }

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
    });

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: newUser.id,
      userId: actorId || null,
      action: "create",
      details: { email, roleId, name },
    });

    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// ============================ UPDATE User ============================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password, biography, actorId, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Whitelist updatable fields to avoid passing unsupported props (e.g. teamId)
    const allowed: any = {};
    if (typeof rest.name !== "undefined") allowed.name = rest.name || null;
    if (typeof rest.email !== "undefined") allowed.email = rest.email;
    if (typeof rest.roleId !== "undefined") allowed.roleId = rest.roleId;
    if (typeof rest.phone !== "undefined") allowed.phone = rest.phone || null;
    if (typeof rest.address !== "undefined")
      allowed.address = rest.address || null;
    if (typeof rest.category !== "undefined")
      allowed.category = rest.category || null;
    if (typeof rest.clientId !== "undefined")
      allowed.clientId = rest.clientId || null;
    if (typeof rest.status !== "undefined")
      allowed.status = rest.status || "active";

    const updateData: any = {
      ...allowed,
      biography: biography || null,
    };

    if (password && password.trim() !== "") {
      const trimmedPassword = password.trim();
      if (trimmedPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(trimmedPassword, 10);

      await prisma.account.updateMany({
        where: {
          userId: id,
          providerId: "credentials",
        },
        data: {
          password: updateData.passwordHash,
          updatedAt: new Date(),
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: { select: { id: true, name: true } } },
    });

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
    });

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// ============================ DELETE User ============================
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get("id");
    const actorIdParam = searchParams.get("actorId"); // যে ডিলিট করল

    if (!userIdParam) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const userId: string = userIdParam;
    const actorId: string | undefined = actorIdParam ?? undefined;

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: userId } });

    // 🔹 Audit Log
    await logActivity({
      entityType: "User",
      entityId: userToDelete.id,
      userId: actorId,
      action: "delete",
      details: { email: userToDelete.email, name: userToDelete.name },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
