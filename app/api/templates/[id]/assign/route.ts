// File: app/api/templates/[id]/assign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, TaskPriority, TaskStatus } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const body = await req.json();
    const { clientId, teamMembers } = body;

    if (!templateId || !clientId || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return NextResponse.json({ message: "Missing templateId, clientId, or team members" }, { status: 400 });
    }

    // 1. ✅ Create TemplateTeamMembers
    await prisma.templateTeamMember.createMany({
      data: teamMembers.map((m: any) => ({
        templateId,
        agentId: m.agentId,
        role: m.role,
        teamId: m.teamId || null,
        assignedDate: new Date(),
      })),
      skipDuplicates: true,
    });

    // 2. ✅ Create Assignment
    const assignment = await prisma.assignment.create({
      data: {
        id: randomUUID(),
        templateId,
        clientId,
        status: "active",
      },
    });

    // 3. ✅ Generate Tasks for each team member × asset
    const assets = await prisma.templateSiteAsset.findMany({
      where: { templateId },
    });

    const tasks = [];
    for (const member of teamMembers) {
      for (const asset of assets) {
        tasks.push({
          id: randomUUID(),
          assignmentId: assignment.id,
          clientId,
          templateSiteAssetId: asset.id,
          name: `${asset.name} Task`,
          assignedToId: member.agentId,
          status: TaskStatus.pending,
          priority: TaskPriority.medium,
          idealDurationMinutes: asset.defaultIdealDurationMinutes || 30,
        });
      }
    }

    await prisma.task.createMany({ data: tasks });

    return NextResponse.json({ assignmentId: assignment.id, taskCount: tasks.length }, { status: 201 });
  } catch (err) {
    console.error("Assign Template Error:", err);
    return NextResponse.json({ message: "Failed to assign template" }, { status: 500 });
  }
}
