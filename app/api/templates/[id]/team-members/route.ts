//api/templates/[id]/team-members/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET: Fetch all team members for a specific template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  try {
    const members = await prisma.templateTeamMember.findMany({
      where: { templateId },
      include: {
        agent: {
          select: { id: true, name: true, email: true, image: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch template team members:", error);
    return NextResponse.json(
      { message: "Error fetching team members" },
      { status: 500 }
    );
  }
}

// ✅ POST: Add multiple team members to the template
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  try {
    const body = await req.json();
    const { teamMembers } = body;

    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
      return NextResponse.json(
        { message: "No team members provided" },
        { status: 400 }
      );
    }

    const data = teamMembers
      .filter((m) => m.agentId)
      .map((m) => ({
        templateId,
        agentId: m.agentId,
        role: m.role || null,
        teamId: m.teamId || null,
        assignedDate: new Date(),
      }));

    await prisma.templateTeamMember.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json(
      { message: "Team members added" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add team members:", error);
    return NextResponse.json(
      { message: "Error adding team members", error },
      { status: 500 }
    );
  }
}
