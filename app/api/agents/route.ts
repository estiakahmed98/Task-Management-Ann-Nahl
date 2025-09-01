import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        // Assuming agents have a specific role or can be identified by having category field
        category: {
          not: null,
        },
        role: {
          name: "agent", // ✅ only users with 'agent' role
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        category: true,
        address: true,
        biography: true,
        status: true,
        createdAt: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the expected format
    const transformedAgents = agents.map((agent) => ({
      id: agent.id,
      firstName: agent.firstName || "",
      lastName: agent.lastName || "",
      email: agent.email,
      phone: agent.phone || "",
      category: agent.category || "",
      address: agent.address || "",
      bio: agent.biography || "",
      status: agent.status.toLowerCase(),
      createdAt: agent.createdAt.toISOString(),
      image: agent.image,
      role: agent.role?.name,
    }));

    return NextResponse.json(transformedAgents, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/agents:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const agentData = await request.json();
    console.log("Creating agent with data:", agentData);

    if (
      !agentData.firstName ||
      !agentData.lastName ||
      !agentData.email ||
      !agentData.password ||
      !agentData.teamId
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: agentData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    // Verify the team exists
    const team = await prisma.team.findUnique({
      where: { id: agentData.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { message: "Selected team not found" },
        { status: 400 }
      );
    }

    // ✅ Get or fallback create the 'agent' role
    const agentRole = await prisma.role.findUnique({
      where: { name: "agent" },
    });
    if (!agentRole) {
      return NextResponse.json(
        { message: "Agent role not found in DB. Please seed roles first." },
        { status: 500 }
      );
    }

    // ---- Hash password ----
    const passwordHash = await bcrypt.hash(agentData.password, 10);

    // Create the agent
    const newAgent = await prisma.user.create({
      data: {
        firstName: agentData.firstName,
        lastName: agentData.lastName,
        email: agentData.email,
        passwordHash, // Ensure this is hashed in your actual implementation
        phone: agentData.phone || null,
        category: team.name, // Set category to team name for backward compatibility
        address: agentData.address || null,
        biography: agentData.bio || null,
        status: agentData.status === "active" ? "active" : "inactive",
        emailVerified: false,
        name: `${agentData.firstName} ${agentData.lastName}`,
        roleId: agentRole.id,
        // Credentials account (same pattern as your first user route)
        accounts: {
          create: {
            providerId: "credentials",
            accountId: agentData.email,
            password: passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        accounts: true,
      },
    });

    console.log("Agent created successfully:", newAgent.id);

    // For now, we'll just create the agent without team assignment
    // You can later implement proper team assignment logic based on your business requirements

    return NextResponse.json(
      {
        message: "Agent created successfully",
        agent: {
          id: newAgent.id,
          firstName: newAgent.firstName,
          lastName: newAgent.lastName,
          email: newAgent.email,
          phone: newAgent.phone,
          category: newAgent.category,
          address: newAgent.address,
          bio: newAgent.biography,
          status: newAgent.status.toLowerCase(),
          createdAt: newAgent.createdAt.toISOString(),
          teamId: agentData.teamId,
          teamName: team.name,
          role: agentData.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/agents:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Missing agent ID" },
        { status: 400 }
      );
    }

    // First, remove the agent from all teams (if any exist)
    try {
      await prisma.clientTeamMember.deleteMany({
        where: { agentId: id },
      });

      await prisma.templateTeamMember.deleteMany({
        where: { agentId: id },
      });
    } catch (teamDeleteError) {
      console.log(
        "No team memberships to delete or error deleting:",
        teamDeleteError
      );
    }

    // Then delete the agent
    const deletedAgent = await prisma.user.delete({
      where: { id },
    });

    if (!deletedAgent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Agent deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/agents:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      address,
      biography,   // preferred key from client
      bio,         // fallback key
      status,      // "active" | "inactive"
      teamId,      // ✅ optional: map to category
      password,    // optional: update if provided
    } = body;

    if (!id) {
      return NextResponse.json({ message: "Missing agent ID" }, { status: 400 });
    }

    // Ensure the user exists (and get current values for comparisons)
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    // If email is changing, enforce uniqueness
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ message: "Email already exists" }, { status: 400 });
      }
    }

    // If teamId provided, map to legacy `category` (team name)
    let categoryUpdate: string | undefined;
    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) {
        return NextResponse.json({ message: "Selected team not found" }, { status: 400 });
      }
      categoryUpdate = team.name;
    }

    // Optional password update
    let passwordHashUpdate: string | undefined;
    if (typeof password === "string" && password.trim()) {
      const bcrypt = (await import("bcryptjs")).default;
      passwordHashUpdate = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        address: address ?? null,
        biography: (biography ?? bio) ?? null,
        status: status === "active" ? "active" : "inactive",
        name: `${firstName ?? existing.firstName ?? ""} ${lastName ?? existing.lastName ?? ""}`.trim(),
        ...(categoryUpdate ? { category: categoryUpdate } : {}),
        ...(passwordHashUpdate ? { passwordHash: passwordHashUpdate } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        category: true,
        address: true,
        biography: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Agent updated successfully",
        agent: {
          ...updated,
          bio: updated.biography,
          status: updated.status.toLowerCase(),
          createdAt: updated.createdAt.toISOString(),
          teamId, // echo back what was sent (useful for the UI)
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in PUT /api/agents:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
