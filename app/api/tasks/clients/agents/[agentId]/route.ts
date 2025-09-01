// app/api/tasks/clients/agents/[agentId]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma"; // shared instance

type Counts = {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
  cancelled: number;
  reassigned: number;
  qc_approved: number;
};

const EMPTY: Counts = {
  total: 0,
  pending: 0,
  in_progress: 0,
  completed: 0,
  overdue: 0,
  cancelled: 0,
  reassigned: 0,
  qc_approved: 0,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    // 1) Which clients have tasks assigned to this agent?
    const distinctClientIds = await prisma.task.findMany({
      where: { assignedToId: agentId, clientId: { not: null } },
      select: { clientId: true },
      distinct: ["clientId"],
    });

    const clientIds = distinctClientIds
      .map((r) => r.clientId)
      .filter((id): id is string => Boolean(id));

    if (clientIds.length === 0) {
      return NextResponse.json([]); // nothing assigned to this agent yet
    }

    // 2) Fetch basic client info for those ids
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: {
        id: true,
        name: true,
        company: true,
        designation: true,
        avatar: true,
        status: true,
        progress: true, // overall saved progress (may be null)
        imageDrivelink: true,
        package: { select: { id: true, name: true } },
      },
    });

    // 3) Count tasks by status per client (only tasks assigned to this agent)
    const grouped = await prisma.task.groupBy({
      by: ["clientId", "status"],
      where: { assignedToId: agentId, clientId: { in: clientIds } },
      _count: { _all: true },
    });

    const countsByClient: Record<string, Counts> = {};
    for (const row of grouped) {
      const cid = row.clientId as string;
      const status = row.status as keyof Counts;
      if (!countsByClient[cid]) countsByClient[cid] = { ...EMPTY };
      // increment the specific status & total
      if (status in countsByClient[cid]) {
        (countsByClient[cid][status] as number) += row._count._all;
        countsByClient[cid].total += row._count._all;
      }
    }

    // 4) Shape response exactly how your AgentDashboard expects
    const payload = clients.map((c) => {
      const taskCounts = countsByClient[c.id] ?? { ...EMPTY };
      const derived =
        taskCounts.total > 0
          ? Math.round((taskCounts.completed / taskCounts.total) * 100)
          : 0;

      const progress =
        typeof c.progress === "number" ? c.progress : derived;

      return {
        id: c.id,
        name: c.name,
        company: c.company,
        designation: c.designation,
        avatar: c.avatar,
        status: c.status,
        imageDrivelink: c.imageDrivelink ?? null,
        package: c.package ? { id: c.package.id, name: c.package.name } : null,

        // ✅ what your UI uses
        progress,
        taskCounts,          // full, normalized counts
        agentTaskCounts: taskCounts, // (kept for compatibility)
      };
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Error fetching agent clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent clients", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
