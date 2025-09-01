// app/api/tasks/agents/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId") ?? undefined;     // e.g., "asset-team" / "social-team"
    const teamName = searchParams.get("teamName") ?? undefined; // optional alternative

    // Base filter: only users with Agent role (case variants)
    const baseWhere: any = {
      role: {
        name: { in: ["agent", "Agent", "AGENT"] },
      },
    };

    // Optional team filter across either membership table
    if (teamId || teamName) {
      const teamFilter = teamId
        ? { teamId } // exact id match
        : { team: { name: { equals: teamName!, mode: "insensitive" } } }; // name match

      baseWhere.OR = [
        { templateTeamMemberships: { some: teamFilter } }, // TemplateTeamMember
        { clientTeamMemberships: { some: teamFilter } },   // ClientTeamMember
      ];
    }

    const agents = await prisma.user.findMany({
      where: baseWhere,
      include: {
        role: { select: { name: true } },
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
