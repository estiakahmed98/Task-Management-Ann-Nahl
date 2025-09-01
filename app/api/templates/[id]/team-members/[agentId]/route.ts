// app/api/templates/[id]/team-members/[agentId]/route.ts

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; agentId: string }> }
) {
  const { id: templateId, agentId } = await params;

  try {
    await prisma.templateTeamMember.delete({
      where: {
        templateId_agentId: {
          templateId,
          agentId,
        },
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove team member", details: error },
      { status: 500 }
    );
  }
}
