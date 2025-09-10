import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { agentId, teamId, role = "Member", assignmentType = "template" } = await request.json()
    console.log("Assigning agent to team:", { agentId, teamId, role, assignmentType })

    if (!agentId || !teamId) {
      return NextResponse.json({ message: "Agent ID and Team ID are required" }, { status: 400 })
    }

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 })
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }

    let teamMember

    if (assignmentType === "client") {
      // For client team assignments, you'd need a clientId
      // This is a placeholder - adjust based on your business logic
      return NextResponse.json({ message: "Client team assignment requires clientId" }, { status: 400 })
    } else {
      // For template team assignments
      // First, check if we have any templates, if not create a default one
      let template = await prisma.template.findFirst()

      if (!template) {
        // Create a default template
        template = await prisma.template.create({
          data: {
            id: "default-template",
            name: "Default Template",
            description: "Default template for team assignments",
          },
        })
        console.log("Created default template:", template.id)
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.templateTeamMember.findFirst({
        where: {
          agentId: agentId,
          teamId: teamId,
          templateId: template.id,
        },
      })

      if (existingAssignment) {
        return NextResponse.json({ message: "Agent is already assigned to this team" }, { status: 400 })
      }

      // Create the team assignment
      teamMember = await prisma.templateTeamMember.create({
        data: {
          templateId: template.id,
          agentId: agentId,
          teamId: teamId,
          role: role,
          assignedDate: new Date(),
        },
        include: {
          agent: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          team: {
            select: {
              name: true,
            },
          },
        },
      })
    }

    console.log("Team assignment created successfully")

    return NextResponse.json(
      {
        message: "Agent assigned to team successfully",
        assignment: teamMember,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/agents/assign-team:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { agentId, teamId, assignmentType = "template" } = await request.json()

    if (!agentId || !teamId) {
      return NextResponse.json({ message: "Agent ID and Team ID are required" }, { status: 400 })
    }

    if (assignmentType === "client") {
      await prisma.clientTeamMember.deleteMany({
        where: {
          agentId: agentId,
          teamId: teamId,
        },
      })
    } else {
      await prisma.templateTeamMember.deleteMany({
        where: {
          agentId: agentId,
          teamId: teamId,
        },
      })
    }

    return NextResponse.json({ message: "Team assignment removed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in DELETE /api/agents/assign-team:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      agentId,
      teamId,
      role = "Member",
      assignmentType = "template",
      templateId: bodyTemplateId,   // optional; if not provided we use/find/create default
      clientId,                     // optional for client assignments
    }: {
      agentId: string;
      teamId?: string | null;
      role?: string;
      assignmentType?: "template" | "client";
      templateId?: string;
      clientId?: string;
    } = body;

    if (!agentId) {
      return NextResponse.json({ message: "Agent ID is required" }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ message: "Team ID is required" }, { status: 400 });
    }

    // Verify agent & team exist
    const [agent, team] = await Promise.all([
      prisma.user.findUnique({ where: { id: agentId } }),
      prisma.team.findUnique({ where: { id: teamId } }),
    ]);
    if (!agent) return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    if (!team)  return NextResponse.json({ message: "Team not found" }, { status: 404 });

    // ---------- CLIENT ASSIGNMENT (optional) ----------
    if (assignmentType === "client") {
      if (!clientId) {
        return NextResponse.json(
          { message: "Client team assignment requires clientId" },
          { status: 400 }
        );
      }

      // upsert by composite key @@id([clientId, agentId])
      const clientMember = await prisma.clientTeamMember.upsert({
        where: { clientId_agentId: { clientId, agentId } },
        update: {
          teamId,
          role,
          assignedDate: new Date(),
        },
        create: {
          clientId,
          agentId,
          teamId,
          role,
          assignedDate: new Date(),
        },
        select: {
          clientId: true,
          agentId: true,
          teamId: true,
          role: true,
          assignedDate: true,
          agent: { select: { firstName: true, lastName: true, email: true } },
          team:  { select: { name: true } },
          client:{ select: { id: true, name: true } },
        },
      });

      return NextResponse.json(
        {
          message: "Client team assignment updated successfully",
          assignment: clientMember,
        },
        { status: 200 }
      );
    }

    // ---------- TEMPLATE ASSIGNMENT (default path) ----------
    // Find/ensure a template
    let templateId = bodyTemplateId ?? null;
    if (!templateId) {
      const first = await prisma.template.findFirst({ select: { id: true } });
      if (first) {
        templateId = first.id;
      } else {
        const created = await prisma.template.create({
          data: {
            id: "default-template",
            name: "Default Template",
            description: "Default template for team assignments",
          },
          select: { id: true },
        });
        templateId = created.id;
      }
    }

    // Idempotent update: upsert by composite primary key (templateId + agentId)
    const teamMember = await prisma.templateTeamMember.upsert({
      where: {
        templateId_agentId: { templateId, agentId }, // matches @@id([templateId, agentId])
      },
      update: {
        teamId,
        role,
        assignedDate: new Date(),
      },
      create: {
        templateId,
        agentId,
        teamId,
        role,
        assignedDate: new Date(),
      },
      include: {
        agent: { select: { firstName: true, lastName: true, email: true } },
        team:  { select: { name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Template team assignment updated successfully",
        assignment: teamMember,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // upsert should prevent P2002, but handle just in case
    if (error?.code === "P2002") {
      return NextResponse.json(
        { message: "Assignment already exists. No changes made." },
        { status: 200 }
      );
    }
    console.error("Error in PUT /api/agents/assign-team:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
