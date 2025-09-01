// app/api/tasks/reassign/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Query params:
 * - page (default 1)
 * - limit (default 20, max 100)
 * - from, to (ISO datetime) -> filter by ActivityLog.timestamp
 * - agentId            -> reassign TO (filters by ActivityLog.userId)
 * - taskId             -> specific task
 * - clientId           -> reassigns for tasks of this client (preload taskIds then IN filter)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1),
      100
    );

    const from = url.searchParams.get("from"); // ISO string
    const to = url.searchParams.get("to"); // ISO string
    const agentId = url.searchParams.get("agentId"); // reassigned TO
    const taskId = url.searchParams.get("taskId");
    const clientId = url.searchParams.get("clientId");

    // Build where for ActivityLog
    const where: any = {
      entityType: "Task",
      action: "task_reassigned",
    };

    // time range
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    if (agentId) where.userId = agentId; // we set userId = "reassignedTo"
    if (taskId) where.entityId = taskId;

    // If clientId provided, prefetch all taskIds for that client and IN-filter
    if (clientId) {
      const clientTaskIds = await prisma.task.findMany({
        where: { clientId },
        select: { id: true },
      });
      const ids = clientTaskIds.map((t) => t.id);
      // If no tasks for client, short-circuit
      if (ids.length === 0) {
        return NextResponse.json({ page, limit, total: 0, items: [] });
      }
      // If taskId also provided, ensure it belongs to client; otherwise empty
      if (taskId && !ids.includes(taskId)) {
        return NextResponse.json({ page, limit, total: 0, items: [] });
      }
      // Apply IN filter (unless a single taskId is already set)
      if (!taskId) where.entityId = { in: ids };
    }

    // Count + page fetch
    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          entityId: true, // Task ID
          userId: true, // reassignedTo
          timestamp: true,
          details: true, // JSON => { clientId, reassignedFrom, reassignedTo, reassignedBy, reassignNotes, ... }
        },
      }),
    ]);

    // Enrichment: collect ids
    const taskIds = Array.from(
      new Set(logs.map((l) => l.entityId).filter(Boolean))
    ) as string[];
    const userIds = new Set<string>();
    logs.forEach((l) => {
      const d = (l.details ?? {}) as any;
      if (l.userId) userIds.add(l.userId); // to
      if (typeof d?.reassignedFrom === "string") userIds.add(d.reassignedFrom);
      if (typeof d?.reassignedBy === "string") userIds.add(d.reassignedBy); // may be id or email; id works here
    });

    const [tasks, users] = await Promise.all([
      taskIds.length
        ? prisma.task.findMany({
            where: { id: { in: taskIds } },
            select: {
              id: true,
              name: true,
              clientId: true,
              assignedToId: true,
              client: { select: { id: true, name: true } },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      userIds.size
        ? prisma.user.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const userMap = new Map(
      users.map((u) => [
        u.id,
        {
          id: u.id,
          name:
            u.name ||
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
            u.email,
          email: u.email,
        },
      ])
    );

    const items = logs.map((l) => {
      const d = (l.details ?? {}) as any;
      const t = taskMap.get(l.entityId);

      const reassignedTo = (d?.reassignedTo ?? l.userId) || null;
      const reassignedFrom = d?.reassignedFrom ?? null;
      const reassignedBy = d?.reassignedBy ?? null;

      return {
        logId: l.id,
        timestamp: l.timestamp,

        // Task info
        task: t
          ? {
              id: t.id,
              name: t.name,
              clientId: t.clientId,
              clientName: t.client?.name ?? null,
              currentAssignedToId: t.assignedToId,
            }
          : {
              id: l.entityId,
              name: null,
              clientId: d?.clientId ?? null,
              clientName: null,
              currentAssignedToId: null,
            },

        // Reassign info
        reassignedFrom,
        reassignedTo,
        reassignedBy,
        reassignNotes: d?.reassignNotes ?? null,

        // Enriched user info (only when IDs were logged)
        toUser: reassignedTo ? userMap.get(reassignedTo) ?? null : null,
        fromUser: reassignedFrom ? userMap.get(reassignedFrom) ?? null : null,
        byUser: reassignedBy ? userMap.get(reassignedBy) ?? null : null,
      };
    });

    return NextResponse.json({ page, limit, total, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch reassign logs" },
      { status: 500 }
    );
  }
}
