// app/api/tasks/[id]/reassign/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, PerformanceRating } from "@prisma/client"; // ✅ enum import
const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { toAgentId, reassignNotes, reassignedById, reassignedByEmail } =
      await req.json();

    // কে reassign করছে (optional)
    let reassignedBy: string | null = null;
    if (reassignedById || reassignedByEmail) {
      const u = await prisma.user.findUnique({
        where: reassignedById
          ? { id: reassignedById }
          : { email: reassignedByEmail },
        select: { id: true, email: true },
      });
      reassignedBy = u?.id ?? u?.email ?? null;
    }

    // টাস্ক লোড (previous rating audit করার জন্য)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        assignedToId: true,
        clientId: true,
        performanceRating: true, // audit only
      },
    });
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const fromAgentId = task.assignedToId;
    const toId = toAgentId ?? fromAgentId; // current agent default

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          assignedToId: toId,
          status: "reassigned",
          reassignNotes: reassignNotes ?? "",
          // resets:
          actualDurationMinutes: null,
          completionLink: null,
          completedAt: null,
          performanceRating: PerformanceRating.Poor, // ✅ সবসময় Poor
          updatedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          entityType: "Task",
          entityId: taskId,
          userId: toId,
          action: "task_reassigned",
          details: {
            clientId: task.clientId,
            reassignedAt: new Date().toISOString(),
            reassignedTo: toId,
            reassignedFrom: fromAgentId ?? null,
            reassignedBy: reassignedBy ?? "system",
            reassignNotes: reassignNotes ?? null,
            previousPerformance: task.performanceRating ?? null, // 📝 audit
            newPerformance: PerformanceRating.Poor, // 📝 audit
          },
        },
      });

      // counters update (from != to হলে)
      if (task.clientId && fromAgentId && fromAgentId !== toId) {
        const existing = await tx.clientTeamMember.findUnique({
          where: {
            clientId_agentId: { clientId: task.clientId, agentId: fromAgentId },
          },
          select: { assignedTasks: true },
        });
        if (existing) {
          await tx.clientTeamMember.update({
            where: {
              clientId_agentId: {
                clientId: task.clientId,
                agentId: fromAgentId,
              },
            },
            data: {
              assignedTasks: Math.max(0, (existing.assignedTasks ?? 0) - 1),
            },
          });
        }
        const dest = await tx.clientTeamMember.findUnique({
          where: {
            clientId_agentId: { clientId: task.clientId, agentId: toId },
          },
          select: { assignedTasks: true },
        });
        if (dest) {
          await tx.clientTeamMember.update({
            where: {
              clientId_agentId: { clientId: task.clientId, agentId: toId },
            },
            data: { assignedTasks: (dest.assignedTasks ?? 0) + 1 },
          });
        } else {
          await tx.clientTeamMember.create({
            data: {
              clientId: task.clientId,
              agentId: toId,
              assignedTasks: 1,
              assignedDate: new Date(),
            },
          });
        }
      }
    });

    // notifications
    const notifs: Promise<any>[] = [
      prisma.notification.create({
        data: {
          userId: toId,
          taskId,
          type: "general",
          message: "A task has been reassigned to you.",
          createdAt: new Date(),
        },
      }),
    ];
    if (fromAgentId && fromAgentId !== toId) {
      notifs.push(
        prisma.notification.create({
          data: {
            userId: fromAgentId,
            taskId,
            type: "general",
            message: "A task previously assigned to you has been reassigned.",
            createdAt: new Date(),
          },
        })
      );
    }
    await Promise.all(notifs);

    return NextResponse.json({
      message: "Task reassigned",
      taskId,
      reassignedFrom: fromAgentId ?? null,
      reassignedTo: toId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to reassign" },
      { status: 500 }
    );
  }
}
