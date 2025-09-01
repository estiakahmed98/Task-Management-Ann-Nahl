import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("GET /api/teams - Starting request")

    const teams = await prisma.team.findMany({
      include: {
        clientTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        templateTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    console.log(`GET /api/teams - Found ${teams.length} teams`)

    // Transform the data to include member counts and other useful info
    const transformedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      clientMembersCount: team.clientTeamMembers.length,
      templateMembersCount: team.templateTeamMembers.length,
      totalMembers: team.clientTeamMembers.length + team.templateTeamMembers.length,
      clientTeamMembers: team.clientTeamMembers,
      templateTeamMembers: team.templateTeamMembers,
    }))

    return NextResponse.json(transformedTeams, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/teams:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/teams - Starting request")

    const teamData = await request.json()
    console.log("POST /api/teams - Received data:", teamData)

    if (!teamData.name || !teamData.name.trim()) {
      console.log("POST /api/teams - Missing team name")
      return NextResponse.json({ message: "Team name is required" }, { status: 400 })
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name: teamData.name.trim() },
    })

    if (existingTeam) {
      console.log("POST /api/teams - Team name already exists")
      return NextResponse.json({ message: "Team name already exists" }, { status: 400 })
    }

    // Generate a unique ID from the team name
    const baseId = teamData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 50)

    // Ensure the ID is unique
    let finalTeamId = baseId
    let counter = 1

    while (true) {
      const existingIdTeam = await prisma.team.findUnique({
        where: { id: finalTeamId },
      })

      if (!existingIdTeam) break

      finalTeamId = `${baseId}-${counter}`
      counter++
    }

    console.log("POST /api/teams - Creating team with ID:", finalTeamId)

    const newTeam = await prisma.team.create({
      data: {
        id: finalTeamId,
        name: teamData.name.trim(),
        description: teamData.description?.trim() || null,
      },
      include: {
        clientTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        templateTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    console.log("POST /api/teams - Team created successfully:", newTeam.id)

    const responseData = {
      message: "Team created successfully",
      team: {
        ...newTeam,
        clientMembersCount: newTeam.clientTeamMembers.length,
        templateMembersCount: newTeam.templateTeamMembers.length,
        totalMembers: newTeam.clientTeamMembers.length + newTeam.templateTeamMembers.length,
      },
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/teams:", error)

    if (error.code === "P2002") {
      return NextResponse.json({ message: "Team name already exists" }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    console.log("PUT /api/teams - Starting request")

    const teamData = await request.json()
    console.log("PUT /api/teams - Received data:", teamData)

    if (!teamData.id) {
      return NextResponse.json({ message: "Team ID is required" }, { status: 400 })
    }

    if (!teamData.name || !teamData.name.trim()) {
      return NextResponse.json({ message: "Team name is required" }, { status: 400 })
    }

    // Check if another team with the same name exists (excluding current team)
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: teamData.name.trim(),
        NOT: {
          id: teamData.id,
        },
      },
    })

    if (existingTeam) {
      return NextResponse.json({ message: "Team name already exists" }, { status: 400 })
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamData.id },
      data: {
        name: teamData.name.trim(),
        description: teamData.description?.trim() || null,
      },
      include: {
        clientTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
        templateTeamMembers: {
          include: {
            agent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    console.log("PUT /api/teams - Team updated successfully:", updatedTeam.id)

    return NextResponse.json(
      {
        message: "Team updated successfully",
        team: {
          ...updatedTeam,
          clientMembersCount: updatedTeam.clientTeamMembers.length,
          templateMembersCount: updatedTeam.templateTeamMembers.length,
          totalMembers: updatedTeam.clientTeamMembers.length + updatedTeam.templateTeamMembers.length,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in PUT /api/teams:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Team name already exists" }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    console.log("DELETE /api/teams - Starting request")

    const { id } = await request.json()
    console.log("DELETE /api/teams - Team ID:", id)

    if (!id) {
      return NextResponse.json({ message: "Team ID is required" }, { status: 400 })
    }

    // Check if team has members before deletion
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        clientTeamMembers: true,
        templateTeamMembers: true,
      },
    })

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }

    const totalMembers = team.clientTeamMembers.length + team.templateTeamMembers.length
    if (totalMembers > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete team with ${totalMembers} member(s). Please remove all members first.`,
        },
        { status: 400 },
      )
    }

    await prisma.team.delete({
      where: { id },
    })

    console.log("DELETE /api/teams - Team deleted successfully:", id)

    return NextResponse.json({ message: "Team deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error in DELETE /api/teams:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
