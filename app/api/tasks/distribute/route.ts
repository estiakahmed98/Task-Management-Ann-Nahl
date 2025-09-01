import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      clientId,
      assignments,
    }: {
      clientId: string
      // UI sends the same ISO date for each item, but we accept per-assignment dueDate
      assignments: { taskId: string; agentId: string; note?: string; dueDate?: string }[]
    } = body

    if (!clientId || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 })
    }

    // Run everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1) Update each task (agent/status/notes/dueDate)
      const updatePromises = assignments.map(({ taskId, agentId, note, dueDate }) => {
        let parsedDue: Date | null = null
        if (dueDate) {
          const d = new Date(dueDate)
          if (!isNaN(d.getTime())) parsedDue = d
        }

        return tx.task.update({
          where: { id: taskId },
          data: {
            assignedToId: agentId,
            status: "pending",           // reset when (re)assigning
            notes: note || "",
            ...(parsedDue ? { dueDate: parsedDue } : {}), // ✅ write due date
            updatedAt: new Date(),
          },
        })
      })

      const updatedTasks = await Promise.all(updatePromises)

      // 2) Activity logs (include due date for traceability)
      const activityLogPromises = assignments.map(({ taskId, agentId, dueDate }) =>
        tx.activityLog.create({
          data: {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            entityType: "Task",
            entityId: taskId,
            userId: agentId,
            action: "task_assigned",
            details: {
              clientId,
              assignedAt: new Date().toISOString(),
              assignedBy: "system",
              ...(dueDate ? { dueDate } : {}),
            },
          },
        }),
      )
      await Promise.all(activityLogPromises)

      // 3) Update/initialize ClientTeamMember counters
      const agentIds = [...new Set(assignments.map(({ agentId }) => agentId))]
      for (const agentId of agentIds) {
        const countForAgent = assignments.filter((a) => a.agentId === agentId).length

        const existing = await tx.clientTeamMember.findUnique({
          where: { clientId_agentId: { clientId, agentId } },
        })

        if (existing) {
          await tx.clientTeamMember.update({
            where: { clientId_agentId: { clientId, agentId } },
            data: { assignedTasks: { increment: countForAgent } },
          })
        } else {
          await tx.clientTeamMember.create({
            data: {
              clientId,
              agentId,
              assignedTasks: countForAgent,
              assignedDate: new Date(),
            },
          })
        }
      }

      return updatedTasks
    })

    // 4) Notifications (mention due date if present)
    const notificationPromises = assignments.map(({ taskId, agentId, dueDate }) =>
      prisma.notification.create({
        data: {
          userId: agentId,
          taskId,
          type: "general",
          message: `You have been assigned a new task${
            dueDate ? ` (due ${new Date(dueDate).toLocaleDateString()})` : ""
          }.`,
          createdAt: new Date(),
        },
      }),
    )
    await Promise.all(notificationPromises)

    return NextResponse.json({
      message: "Tasks distributed successfully",
      assignedTasks: result.length,
      assignments,
    })
  } catch (error) {
    console.error("Error distributing tasks:", error)
    return NextResponse.json(
      {
        message: "Failed to distribute tasks",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // ---------- who is doing it (optional) ----------
    let reassignedBy: string | null = null
    if (body.reassignedById || body.reassignedByEmail) {
      const user = await prisma.user.findUnique({
        where: body.reassignedById ? { id: body.reassignedById } : { email: body.reassignedByEmail },
        select: { id: true, email: true },
      })
      reassignedBy = user?.id ?? user?.email ?? null
    }

    // ---------- SINGLE-TASK SHAPE ----------
    if (body.taskId && body.newAgentId) {
      const { taskId, newAgentId, reassignNotes } = body as {
        taskId: string
        newAgentId: string
        reassignNotes?: string
      }

      // load the task to know fromAgent & clientId
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, assignedToId: true, clientId: true, cycleId: true },
      })
      if (!task) {
        return NextResponse.json({ message: "Task not found" }, { status: 404 })
      }

      const fromAgentId = task.assignedToId
      const toAgentId = newAgentId
      const clientId = task.clientId

      await prisma.$transaction(async (tx) => {
        // update task
        await tx.task.update({
          where: { id: taskId },
          data: {
            assignedToId: toAgentId,
            status: "pending",
            reassignNotes: reassignNotes ?? "",
            actualDurationMinutes: null,
            completionLink: null,
            completedAt: null,
            updatedAt: new Date(),
          },
        })

        if (task.cycleId) {
          const existingAssignment = await tx.assignment.findFirst({
            where: {
              taskId,
              cycleId: task.cycleId,
            },
          })

          if (existingAssignment) {
            await tx.assignment.update({
              where: { id: existingAssignment.id },
              data: {
                agentId: toAgentId,
                assignedAt: new Date(),
              },
            })
          }
        }

        // activity log
        await tx.activityLog.create({
          data: {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            entityType: "Task",
            entityId: taskId,
            userId: toAgentId,
            action: "task_reassigned",
            details: {
              clientId,
              cycleId: task.cycleId, // Include cycle info
              reassignedAt: new Date().toISOString(),
              reassignedTo: toAgentId,
              reassignedFrom: fromAgentId ?? null,
              reassignedBy: reassignedBy ?? "system",
              reassignNotes: reassignNotes ?? null,
            },
          },
        })

        // ... existing counter logic ...
        if (clientId) {
          if (fromAgentId && fromAgentId !== toAgentId) {
            const existing = await tx.clientTeamMember.findUnique({
              where: { clientId_agentId: { clientId, agentId: fromAgentId } },
              select: { assignedTasks: true },
            })
            if (existing) {
              await tx.clientTeamMember.update({
                where: { clientId_agentId: { clientId, agentId: fromAgentId } },
                data: {
                  assignedTasks: Math.max(0, (existing.assignedTasks ?? 0) - 1),
                },
              })
            }
          }
          const dest = await tx.clientTeamMember.findUnique({
            where: { clientId_agentId: { clientId, agentId: toAgentId } },
            select: { assignedTasks: true },
          })
          if (dest) {
            await tx.clientTeamMember.update({
              where: { clientId_agentId: { clientId, agentId: toAgentId } },
              data: { assignedTasks: (dest.assignedTasks ?? 0) + 1 },
            })
          } else {
            await tx.clientTeamMember.create({
              data: {
                clientId,
                agentId: toAgentId,
                assignedTasks: 1,
                assignedDate: new Date(),
              },
            })
          }
        }
      })

      // ... existing notification logic ...
      const notifs: Promise<any>[] = [
        prisma.notification.create({
          data: {
            userId: toAgentId,
            taskId,
            type: "general",
            message: "A task has been reassigned to you.",
            createdAt: new Date(),
          },
        }),
      ]
      if (fromAgentId && fromAgentId !== toAgentId) {
        notifs.push(
          prisma.notification.create({
            data: {
              userId: fromAgentId,
              taskId,
              type: "general",
              message: "A task previously assigned to you has been reassigned.",
              createdAt: new Date(),
            },
          }),
        )
      }
      await Promise.all(notifs)

      return NextResponse.json({
        message: "Task reassigned",
        taskId,
        reassignedFrom: fromAgentId ?? null,
        reassignedTo: toAgentId,
      })
    }

    // ---------- BULK SHAPE ----------
    if (Array.isArray(body.reassignments) && body.reassignments.length) {
      const { clientId, reassignments } = body as {
        clientId: string
        reassignments: {
          taskId: string
          toAgentId: string
          reassignNotes?: string
        }[]
      }

      // ... existing bulk reassignment logic remains the same ...
      const taskIds = [...new Set(reassignments.map((r) => r.taskId))]
      const existingTasks = await prisma.task.findMany({
        where: { id: { in: taskIds } },
        select: { id: true, assignedToId: true, cycleId: true },
      })
      const map = new Map(existingTasks.map((t) => [t.id, t.assignedToId]))
      const cycleMap = new Map(existingTasks.map((t) => [t.id, t.cycleId]))

      await prisma.$transaction(async (tx) => {
        // update tasks
        await Promise.all(
          reassignments.map(({ taskId, toAgentId, reassignNotes }) =>
            tx.task.update({
              where: { id: taskId },
              data: {
                assignedToId: toAgentId,
                status: "pending",
                reassignNotes: reassignNotes ?? "",
                actualDurationMinutes: null,
                completionLink: null,
                completedAt: null,
                updatedAt: new Date(),
              },
            }),
          ),
        )

        await Promise.all(
          reassignments.map(async ({ taskId, toAgentId }) => {
            const cycleId = cycleMap.get(taskId)
            if (cycleId) {
              const existingAssignment = await tx.assignment.findFirst({
                where: { taskId, cycleId },
              })
              if (existingAssignment) {
                await tx.assignment.update({
                  where: { id: existingAssignment.id },
                  data: {
                    agentId: toAgentId,
                    assignedAt: new Date(),
                  },
                })
              }
            }
          }),
        )

        // logs
        await Promise.all(
          reassignments.map(({ taskId, toAgentId, reassignNotes }) =>
            tx.activityLog.create({
              data: {
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                entityType: "Task",
                entityId: taskId,
                userId: toAgentId,
                action: "task_reassigned",
                details: {
                  clientId,
                  cycleId: cycleMap.get(taskId) || null, // Include cycle info
                  reassignedAt: new Date().toISOString(),
                  reassignedTo: toAgentId,
                  reassignedFrom: map.get(taskId) ?? null,
                  reassignedBy: reassignedBy ?? "system",
                  reassignNotes: reassignNotes ?? null,
                },
              },
            }),
          ),
        )
      })

      return NextResponse.json({
        message: "Tasks re-distributed",
        summary: { updatedTasks: reassignments.length },
      })
    }

    // shape didn't match
    return NextResponse.json({ message: "Invalid request data" }, { status: 400 })
  } catch (err) {
    console.error("Error re-distributing tasks:", err)
    return NextResponse.json(
      {
        message: "Failed to re-distribute tasks",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
