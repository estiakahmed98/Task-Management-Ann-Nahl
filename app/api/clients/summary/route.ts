// app/api/clients/summary/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("packageId");
  const amId = searchParams.get("amId");
  const limitUpcoming = Number(searchParams.get("limitUpcoming") ?? "8");

  const where: any = {
    packageId: packageId || undefined,
    amId: amId || undefined,
  };

  const now = new Date();
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);

  // অ্যাগ্রিগেট কুয়েরিগুলো প্যারালাল চালাই
  const [
    totalClients,
    activeClients,
    avgAgg,
    dueIn7Days,
    statusGroups,
    // নিচের দুইটা JS-সাইডে bucket/month হিসাবের জন্য লাইট ডাটা
    clientsLite,
    upcomingDueRaw,
  ] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.count({
      where: {
        ...where,
        status: { equals: "active", mode: "insensitive" },
      },
    }),
    prisma.client.aggregate({
      where,
      _avg: { progress: true },
    }),
    prisma.client.count({
      where: {
        ...where,
        dueDate: { gte: now, lte: in7 },
      },
    }),
    prisma.client.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.client.findMany({
      where,
      select: { progress: true, startDate: true },
    }),
    prisma.client.findMany({
      where: { ...where, dueDate: { not: null, gte: now } },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        packageId: true,
        dueDate: true,
      },
      orderBy: { dueDate: "asc" },
      take: limitUpcoming,
    }),
  ]);

  // statusCounts
  const statusCounts: Record<string, number> = {};
  for (const g of statusGroups) {
    const key = (g.status ?? "unknown").toString().toLowerCase();
    statusCounts[key] = g._count._all;
  }

  // progressBuckets (0–20, 21–40, 41–60, 61–80, 81–100)
  const bucketDefs = [
    { label: "0–20%", min: 0, max: 20 },
    { label: "21–40%", min: 21, max: 40 },
    { label: "41–60%", min: 41, max: 60 },
    { label: "61–80%", min: 61, max: 80 },
    { label: "81–100%", min: 81, max: 100 },
  ];
  const progressBuckets = bucketDefs.map((b) => ({ label: b.label, count: 0 }));
  for (const c of clientsLite) {
    const p = Number(c.progress ?? 0);
    const idx = bucketDefs.findIndex((b) => p >= b.min && p <= b.max);
    if (idx >= 0) progressBuckets[idx].count += 1;
  }

  // startsByMonth (last 6 months)
  const months: { key: string; label: string; count: number }[] = [];
  const d = new Date(now);
  for (let i = 5; i >= 0; i--) {
    const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${temp.getFullYear()}-${String(temp.getMonth() + 1).padStart(2, "0")}`;
    const label = temp.toLocaleString("en-US", { month: "short" });
    months.push({ key, label, count: 0 });
  }
  for (const c of clientsLite) {
    if (!c.startDate) continue;
    const sd = new Date(c.startDate);
    const k = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}`;
    const row = months.find((m) => m.key === k);
    if (row) row.count += 1;
  }

  const avgProgress = Math.round(Number(avgAgg._avg.progress ?? 0));

  return NextResponse.json({
    totalClients,
    activeClients,
    avgProgress,
    dueIn7Days,
    statusCounts,
    progressBuckets,
    startsByMonth: months,
    upcomingDueList: upcomingDueRaw,
  });
}
