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

type PriorityCounts = {
  low: number;
  medium: number;
  high: number;
  urgent: number;
};

type AssetLite = {
  id: number;
  name: string;
  url: string | null;
  type: string; // SiteAssetType as string
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

const EMPTY_PRIORITY: PriorityCounts = {
  low: 0,
  medium: 0,
  high: 0,
  urgent: 0,
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
      if (status in countsByClient[cid]) {
        (countsByClient[cid][status] as number) += row._count._all;
        countsByClient[cid].total += row._count._all;
      }
    }

    // 3b) Count tasks by priority per client (extra summary for UI widgets)
    const priorityGrouped = await prisma.task.groupBy({
      by: ["clientId", "priority"],
      where: { assignedToId: agentId, clientId: { in: clientIds } },
      _count: { _all: true },
    });

    const priorityCountsByClient: Record<string, PriorityCounts> = {};
    for (const row of priorityGrouped) {
      const cid = row.clientId as string;
      const p = row.priority as keyof PriorityCounts; // low | medium | high | urgent
      if (!priorityCountsByClient[cid]) priorityCountsByClient[cid] = { ...EMPTY_PRIORITY };
      if (p in priorityCountsByClient[cid]) {
        (priorityCountsByClient[cid][p] as number) += row._count._all;
      }
    }

    // 4) Pull latest credentials + completionLink per client (from this agent's tasks)
    const credentialRows = await prisma.task.findMany({
      where: {
        assignedToId: agentId,
        clientId: { in: clientIds },
        OR: [
          { email: { not: null } },
          { username: { not: null } },
          { password: { not: null } },
          { completionLink: { not: null } },
        ],
      },
      orderBy: [{ clientId: "asc" }, { updatedAt: "desc" }],
      select: {
        clientId: true,
        email: true,
        username: true,
        password: true,
        completionLink: true,
        updatedAt: true,
      },
    });

    const latestByClient = new Map<
      string,
      {
        email: string | null;
        username: string | null;
        password: string | null;
        completionLink: string | null;
      }
    >();

    for (const row of credentialRows) {
      const cid = row.clientId as string;
      if (!latestByClient.has(cid)) {
        latestByClient.set(cid, {
          email: row.email ?? null,
          username: row.username ?? null,
          password: row.password ?? null,
          completionLink: row.completionLink ?? null,
        });
      }
    }

    // 5) Pull latest site asset (name/url/type) per client from tasks:
    //    Step A: only from THIS agent's tasks, and only where asset URL exists
    const assetRowsPrimary = await prisma.task.findMany({
      where: {
        assignedToId: agentId,
        clientId: { in: clientIds },
        templateSiteAsset: { is: { url: { not: null } } }, // ensure url exists
      },
      orderBy: [{ clientId: "asc" }, { updatedAt: "desc" }],
      select: {
        clientId: true,
        templateSiteAsset: {
          select: { id: true, name: true, url: true, type: true },
        },
        updatedAt: true,
      },
    });

    const assetByClient = new Map<string, AssetLite>();
    for (const row of assetRowsPrimary) {
      const cid = row.clientId as string;
      const sa = row.templateSiteAsset;
      if (!assetByClient.has(cid) && sa) {
        assetByClient.set(cid, {
          id: sa.id,
          name: sa.name,
          url: sa.url ?? null,
          type: String(sa.type),
        });
      }
    }

    // Step B (fallback): for clients still missing an asset with URL,
    // search ANY task (regardless of assigned agent) for a latest asset with URL.
    const missingClientIds = clients
      .map((c) => c.id)
      .filter((cid) => !assetByClient.has(cid));

    if (missingClientIds.length > 0) {
      const assetRowsFallback = await prisma.task.findMany({
        where: {
          clientId: { in: missingClientIds },
          templateSiteAsset: { is: { url: { not: null } } }, // ensure url exists
        },
        orderBy: [{ clientId: "asc" }, { updatedAt: "desc" }],
        select: {
          clientId: true,
          templateSiteAsset: {
            select: { id: true, name: true, url: true, type: true },
          },
          updatedAt: true,
        },
      });

      for (const row of assetRowsFallback) {
        const cid = row.clientId as string;
        const sa = row.templateSiteAsset;
        if (!assetByClient.has(cid) && sa) {
          assetByClient.set(cid, {
            id: sa.id,
            name: sa.name,
            url: sa.url ?? null,
            type: String(sa.type),
          });
        }
      }
    }

    // 6) Shape response
    const payload = clients.map((c) => {
      const taskCounts = countsByClient[c.id] ?? { ...EMPTY };
      const derived =
        taskCounts.total > 0
          ? Math.round((taskCounts.completed / taskCounts.total) * 100)
          : 0;

      const progress = typeof c.progress === "number" ? c.progress : derived;

      const latest = latestByClient.get(c.id) ?? {
        email: null,
        username: null,
        password: null,
        completionLink: null,
      };

      const asset = assetByClient.get(c.id) ?? null;
      const priorityCounts = priorityCountsByClient[c.id] ?? { ...EMPTY_PRIORITY };

      return {
        // --- Client basics ---
        id: c.id,
        name: c.name,
        company: c.company,
        designation: c.designation,
        avatar: c.avatar,
        status: c.status,
        imageDrivelink: c.imageDrivelink ?? null,
        package: c.package ? { id: c.package.id, name: c.package.name } : null,

        // --- UI summaries ---
        progress,
        taskCounts,                  // status-wise counts (pending, completed, etc.)
        agentTaskCounts: taskCounts, // alias for existing UI
        priorityCounts,              // low/medium/high/urgent

        // --- Credentials + completion link (latest from agent's tasks for this client) ---
        credentials: {
          email: latest.email,
          username: latest.username,
          password: latest.password,
        },
        completionLink: latest.completionLink, // latest completionLink (if any)

        // --- Site asset shortcuts ---
        asset: asset?.name ?? null,
        assetUrl: asset?.url ?? null, // ✅ explicit asset URL
        url: asset?.url ?? null,      // ✅ kept for backward compatibility
        siteAsset: asset
          ? { id: asset.id, name: asset.name, url: asset.url, type: asset.type }
          : null,
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
