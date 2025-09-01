// app/api/tasks/distribute/smart/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client";

const prisma = new PrismaClient();

const ACTIVE: TaskStatus[] = [
  "pending",
  "in_progress",
  "reassigned",
  "overdue",
];
const COMPLETE_LIKE: TaskStatus[] = ["completed", "cancelled", "qc_approved"];

const WEIGHT: Record<TaskPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 1,
};

type SmartPayload = {
  clientId: string;
  taskIds: string[]; // যেগুলো assign করতে চান
  allowedAgentIds?: string[]; // optional: নির্দিষ্ট agent pool
  strategy?: "least_load" | "round_robin_least" | "pure_round_robin";
  putNotes?: Record<string, string>; // per task notes
  reassignedById?: string;
  reassignedByEmail?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SmartPayload;
    const {
      clientId,
      taskIds,
      allowedAgentIds,
      strategy = "round_robin_least",
      putNotes = {},
      reassignedById,
      reassignedByEmail,
    } = body;

    if (!clientId || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { message: "clientId & taskIds required" },
        { status: 400 }
      );
    }

    // who is doing it (optional)
    let reassignedBy: string | null = null;
    if (reassignedById || reassignedByEmail) {
      const u = await prisma.user.findUnique({
        where: reassignedById
          ? { id: reassignedById }
          : { email: reassignedByEmail! },
        select: { id: true, email: true },
      });
      reassignedBy = u?.id ?? u?.email ?? null;
    }

    // candidate agents
    const agents = await prisma.user.findMany({
      where: {
        role: { name: { in: ["agent", "Agent", "AGENT"] } },
        status: "active",
        ...(allowedAgentIds?.length ? { id: { in: allowedAgentIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [{ name: "asc" }],
    });

    if (agents.length === 0) {
      return NextResponse.json({ message: "No agents found" }, { status: 404 });
    }

    const agentIds = agents.map((a) => a.id);

    // current active tasks for load
    const activeTasks = await prisma.task.findMany({
      where: { assignedToId: { in: agentIds }, status: { in: ACTIVE } },
      select: { id: true, assignedToId: true, priority: true },
    });

    // build load buckets
    const load: Record<string, { active: number; weighted: number }> = {};
    agentIds.forEach((id) => (load[id] = { active: 0, weighted: 0 }));

    activeTasks.forEach((t) => {
      if (!t.assignedToId) return;
      load[t.assignedToId].active += 1;
      load[t.assignedToId].weighted += WEIGHT[t.priority];
    });

    // tasks to assign (fetch to apply stable order: urgent→high→medium→low, earliest due first)
    const pendingSet = new Set(taskIds);
    const toAssign = await prisma.task.findMany({
      where: { id: { in: Array.from(pendingSet) } },
      select: { id: true, name: true, dueDate: true, priority: true },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }], // urgent/high আগে
    });

    if (toAssign.length === 0) {
      return NextResponse.json(
        { message: "No tasks found to assign" },
        { status: 404 }
      );
    }

    // pick function
    const sortedAgents = () =>
      agentIds
        .slice()
        .sort(
          (a, b) =>
            load[a].weighted - load[b].weighted ||
            load[a].active - load[b].active ||
            a.localeCompare(b)
        );

    let rrIndex = 0; // pure round robin index

    const picks: { taskId: string; agentId: string }[] = [];

    for (const t of toAssign) {
      let chosen: string;

      if (strategy === "least_load") {
        chosen = sortedAgents()[0];
      } else if (strategy === "pure_round_robin") {
        chosen = agentIds[rrIndex % agentIds.length];
        rrIndex++;
      } else {
        // "round_robin_least": among bottom-k (e.g., 3) least, rotate
        const K = Math.min(3, agentIds.length);
        const bottom = sortedAgents().slice(0, K);
        chosen = bottom[rrIndex % bottom.length];
        rrIndex++;
      }

      picks.push({ taskId: t.id, agentId: chosen });
      // update live load (so পরের টাস্ক বাছাইয়ে প্রভাব ফেলে)
      load[chosen].active += 1;
      load[chosen].weighted += WEIGHT[t.priority];
    }

    // write to DB atomically
    const updated = await prisma.$transaction(async (tx) => {
      // update tasks
      await Promise.all(
        picks.map((p) =>
          tx.task.update({
            where: { id: p.taskId },
            data: {
              assignedToId: p.agentId,
              status: "pending",
              notes: (putNotes[p.taskId] ?? "").trim(),
              actualDurationMinutes: null,
              completionLink: null,
              completedAt: null,
              updatedAt: new Date(),
            },
          })
        )
      );

      // logs
      await Promise.all(
        picks.map((p) =>
          tx.activityLog.create({
            data: {
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
              entityType: "Task",
              entityId: p.taskId,
              userId: p.agentId,
              action: "task_assigned", // প্রথমবার/redistribute উভয় ক্ষেত্রেই কভার
              details: {
                clientId,
                assignedAt: new Date().toISOString(),
                assignedBy: reassignedBy ?? "system",
                strategy,
                loadSnapshot: load[p.agentId],
                note: putNotes[p.taskId] ?? null,
              },
            },
          })
        )
      );

      // ClientTeamMember counters
      const groupedByAgent: Record<string, number> = {};
      picks.forEach(
        (p) =>
          (groupedByAgent[p.agentId] = (groupedByAgent[p.agentId] ?? 0) + 1)
      );

      await Promise.all(
        Object.entries(groupedByAgent).map(async ([agentId, inc]) => {
          const existing = await tx.clientTeamMember.findUnique({
            where: { clientId_agentId: { clientId, agentId } },
            select: { assignedTasks: true },
          });
          if (existing) {
            await tx.clientTeamMember.update({
              where: { clientId_agentId: { clientId, agentId } },
              data: { assignedTasks: (existing.assignedTasks ?? 0) + inc },
            });
          } else {
            await tx.clientTeamMember.create({
              data: {
                clientId,
                agentId,
                assignedTasks: inc,
                assignedDate: new Date(),
              },
            });
          }
        })
      );

      // notifications
      await tx.notification.createMany({
        data: picks.map((p) => ({
          userId: p.agentId,
          taskId: p.taskId,
          type: "general",
          message: `You have been assigned a new task (smart distribution).`,
          createdAt: new Date(),
        })),
      });

      return picks.length;
    });

    return NextResponse.json({
      message: "Smart distribution complete",
      assignedTasks: updated,
      picks,
    });
  } catch (e) {
    console.error("Error in smart distribute:", e);
    return NextResponse.json(
      { error: "Failed to smart distribute" },
      { status: 500 }
    );
  }
}
