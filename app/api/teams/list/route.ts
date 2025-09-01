import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log("GET /api/teams/list - Fetching teams for dropdown")

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    console.log(`GET /api/teams/list - Found ${teams.length} teams`)

    return NextResponse.json(teams, { status: 200 })
  } catch (error) {
    console.error("Error in GET /api/teams/list:", error)
    return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 })
  }
}
