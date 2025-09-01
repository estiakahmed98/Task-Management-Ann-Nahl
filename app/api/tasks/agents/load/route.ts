// app/api/tasks/agents/load/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TaskStatus, TaskPriority } from "@prisma/client";

const prisma = new PrismaClient();

// কোন status গুলোকে "active workload" ধরা হবে
const ACTIVE: TaskStatus[] = [
  "pending",
  "in_progress",
  "reassigned",
  "overdue",
];

// Priority → weight ম্যাপ
const WEIGHT: Record<TaskPriority, number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 1,
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // ঐচ্ছিক ফিল্টার: category / team / client ইত্যাদি
    const category = url.searchParams.get("category") || undefined;
    const clientId = url.searchParams.get("clientId") || undefined;

    // 1) agents লোড করি (role = agent)
    const agents = await prisma.user.findMany({
      where: {
        role: { name: { in: ["agent", "Agent", "AGENT"] } },
        ...(category ? { category } : {}),
        status: "active",
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        category: true,
        image: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (agents.length === 0) {
      return NextResponse.json([]);
    }

    const agentIds = agents.map((a) => a.id);

    // 2) agents-এর active tasks ফেচ করি (clientId থাকলে সেটার মধ্যে সীমাবদ্ধ)
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: { in: agentIds },
        status: { in: ACTIVE },
        ...(clientId ? { clientId } : {}),
      },
      select: { id: true, assignedToId: true, priority: true, status: true },
    });

    // 3) সংখ্যা + weighted score হিসাব
    const statMap: Record<
      string,
      { active: number; weighted: number; byStatus: Record<string, number> }
    > = {};
    agentIds.forEach(
      (id) => (statMap[id] = { active: 0, weighted: 0, byStatus: {} as any })
    );

    tasks.forEach((t) => {
      const bucket = statMap[t.assignedToId!];
      if (!bucket) return;
      bucket.active += 1;
      bucket.weighted += WEIGHT[t.priority];
      bucket.byStatus[t.status] = (bucket.byStatus[t.status] || 0) + 1;
    });

    const result = agents.map((a) => {
      const s = statMap[a.id] || {
        active: 0,
        weighted: 0,
        byStatus: {} as any,
      };
      const displayName =
        a.name || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email;
      return {
        agent: {
          id: a.id,
          name: displayName,
          email: a.email,
          category: a.category,
          image: a.image,
        },
        load: {
          activeCount: s.active,
          weightedScore: s.weighted,
          byStatus: s.byStatus,
        },
      };
    });

    // কম লোড → আগে
    result.sort(
      (x, y) =>
        x.load.weightedScore - y.load.weightedScore ||
        x.load.activeCount - y.load.activeCount
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error computing agent load:", e);
    return NextResponse.json(
      { error: "Failed to compute agent load" },
      { status: 500 }
    );
  }
}
