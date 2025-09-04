import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  try {
    const { agentId } = params;
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100) || 100, 500);
    const dateField = url.searchParams.get("date") === "created" ? "createdAt" : "updatedAt";

    // ✅ status filter: default = qc_approved,completed
    const statusParam = (url.searchParams.get("status") || "qc_approved,completed")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const allowed = new Set(["qc_approved", "completed"]);
    const statuses = statusParam.filter((s) => allowed.has(s));
    // যদি অবৈধ বা খালি হয়, ডিফল্টে ফিরো
    const statusIn = statuses.length ? statuses : ["qc_approved", "completed"];

    // ✅ name filter (partial, case-insensitive). q অথবা name যে-কোনোটাই কাজ করবে
    const q = url.searchParams.get("q") ?? url.searchParams.get("name") ?? "";

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: agentId,
        status: { in: statusIn as any[] },
        ...(q
          ? {
              name: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { [dateField]: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        client: { select: { name: true } },

        // extra metrics
        performanceRating: true,
        idealDurationMinutes: true,
        actualDurationMinutes: true,
      },
    });

    const toNum = (v: unknown) =>
      v == null
        ? null
        : typeof v === "object" && v !== null && "toNumber" in (v as any)
        ? (v as any).toNumber()
        : (v as number);

    const rows = tasks.map((t) => ({
      id: String(t.id),
      name: t.name ?? "(Untitled Task)",
      clientName: t.client?.name ?? "-",
      status: String(t.status),
      date: (dateField === "createdAt" ? t.createdAt : t.updatedAt).toISOString(),

      performanceRating: toNum(t.performanceRating),
      idealDurationMinutes: toNum(t.idealDurationMinutes),
      actualDurationMinutes: toNum(t.actualDurationMinutes),
    }));

    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("QC history error:", e);
    return NextResponse.json(
      { error: "Failed to fetch task history", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}
