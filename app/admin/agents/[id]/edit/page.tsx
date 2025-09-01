import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import AgentFormPage from "@/components/agents/agent-form-page";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>; // 👈 params is a Promise now
}) {
  const { id } = await params; // 👈 await it once

  const agent = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      biography: true,
      status: true,
      image: true,
    },
  });

  if (!agent) return notFound();

  // Pull current (most recent) template-team assignment for this agent
  const currentAssignment = await prisma.templateTeamMember.findFirst({
    where: { agentId: id },
    orderBy: { assignedDate: "desc" },
    select: { teamId: true, role: true, templateId: true },
  });

  const initialData = {
    firstName: agent.firstName || "",
    lastName: agent.lastName || "",
    email: agent.email || "",
    phone: agent.phone || "",
    teamId: currentAssignment?.teamId || "",
    role: currentAssignment?.role || "Member",
    address: agent.address || "",
    bio: agent.biography || "",
    status: agent.status || "active",
    templateId: currentAssignment?.templateId || undefined,
  };

  return <AgentFormPage mode="edit" agentId={id} initialData={initialData} />; // 👈 use `id`
}
