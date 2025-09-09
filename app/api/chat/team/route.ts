import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";

// POST /api/chat/team  -> Open or create a team conversation (type=team)
// Body: { teamId: string, title?: string }
export async function POST(req: Request) {
  const me = await getAuthUser();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { teamId, title } = await req.json().catch(() => ({}));
  if (!teamId) {
    return NextResponse.json({ message: "teamId is required" }, { status: 400 });
  }

  // Validate team exists
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });

  // Authorization: allow if admin/manager OR the user is a member of the team via client/template membership
  const meWithRole = await prisma.user.findUnique({ where: { id: me.id }, include: { role: true } });
  const roleName = meWithRole?.role?.name?.toLowerCase?.() || "";
  const isAdminOrManager = roleName === "admin" || roleName === "manager";

  let isTeamMember = false;
  if (!isAdminOrManager) {
    const [clientMemberCount, templateMemberCount] = await Promise.all([
      prisma.clientTeamMember.count({ where: { teamId, agentId: me.id } }),
      prisma.templateTeamMember.count({ where: { teamId, agentId: me.id } }),
    ]);
    isTeamMember = clientMemberCount > 0 || templateMemberCount > 0;
  }

  if (!isAdminOrManager && !isTeamMember) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // If a team conversation already exists, return it (and ensure the requester is a participant)
  const existing = await prisma.conversation.findFirst({
    where: { type: "team", teamId },
    include: { participants: true },
  });

  if (existing) {
    const amIParticipant = existing.participants.some((p) => p.userId === me.id);
    if (!amIParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: existing.id, userId: me.id, role: "member" },
      });
    }
    return NextResponse.json({ id: existing.id });
  }

  // Build participant list from team memberships (unique agentIds)
  const [clientMembers, templateMembers] = await Promise.all([
    prisma.clientTeamMember.findMany({ where: { teamId }, select: { agentId: true } }),
    prisma.templateTeamMember.findMany({ where: { teamId }, select: { agentId: true } }),
  ]);
  const memberIds = new Set<string>();
  clientMembers.forEach((m) => memberIds.add(m.agentId));
  templateMembers.forEach((m) => memberIds.add(m.agentId));
  memberIds.add(me.id); // ensure requester is included

  const participantsCreate = Array.from(memberIds).map((uid) => ({
    userId: uid,
    role: uid === me.id ? "owner" : "member",
  }));

  // Create conversation
  const created = await prisma.conversation.create({
    data: {
      type: "team",
      teamId,
      title: title || `Team: ${team.name}`,
      createdById: me.id,
      participants: { create: participantsCreate },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
