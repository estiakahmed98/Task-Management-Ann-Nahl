import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/tasks/data-entry-reports
 *
 * Query params:
 * - userId:        string     -> filter by dataEntryReport.completedByUserId
 * - clientId:      string     -> filter by Task.clientId
 * - assignedToId:  string     -> filter by Task.assignedToId
 * - status:        string     -> filter by dataEntryReport.status (case-insensitive)
 * - from:          string ISO or YYYY-MM-DD -> filter by dataEntryReport.completedAt >= from
 * - to:            string ISO or YYYY-MM-DD -> filter by dataEntryReport.completedAt <= to
 * - page:          number     -> default 1
 * - pageSize:      number     -> default 25
 * - sort:          "reportDate" | "taskDate" -> default "reportDate"
 * - order:         "asc" | "desc" -> default "desc"
 *
 * Returns:
 * { total, page, pageSize, data: ReportRow[] }
 *
 * Notes:
 * - We fetch tasks where dataEntryReport is NOT NULL, then apply JSON-based filters in JS (portable and safe).
 * - If you need DB-level JSON-key filtering later, switch to $queryRaw with JSONB operators.
 */

type ReportRow = {
  taskId: string;
  taskName: string;
  clientId: string | null;
  clientName: string | null;
  category: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  taskStatus: string;
  taskPriority: string;
  taskCompletedAt: string | null; // ISO
  dataEntryStatus: string | null;
  dataEntryCompletedAt: string | null; // ISO
  dataEntryCompletedByUserId: string | null;
  dataEntryCompletedByName: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || undefined;
    const clientId = url.searchParams.get("clientId") || undefined;
    const assignedToId = url.searchParams.get("assignedToId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const fromStr = url.searchParams.get("from") || undefined;
    const toStr = url.searchParams.get("to") || undefined;

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)));

    const sort = (url.searchParams.get("sort") || "reportDate") as "reportDate" | "taskDate";
    const order = (url.searchParams.get("order") || "desc") as "asc" | "desc";

    // Base where: dataEntryReport is NOT NULL
    const where: Prisma.TaskWhereInput = {
      dataEntryReport: {
        not: Prisma.AnyNull
      },
      ...(clientId ? { clientId } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    // Pull all candidates first (we’ll filter JSON values in JS)
    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: true,
        category: true,
        assignedTo: true,
      },
    });

    // Helper: parse date param (ISO or YYYY-MM-DD) into Date (UTC)
    const parseDate = (s?: string | null) => {
      if (!s) return undefined;
      // Accept YYYY-MM-DD and ISO strings
      const iso = /^\d{4}-\d{2}-\d{2}$/g.test(s) ? new Date(`${s}T00:00:00.000Z`) : new Date(s);
      return isNaN(iso.getTime()) ? undefined : iso;
    };

    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    const norm = (val?: string | null) => (typeof val === "string" ? val.trim().toLowerCase() : "");

    // Map to flattened rows & filter by JSON fields
    let rows: ReportRow[] = tasks
      .map((t) => {
        const rep = (t.dataEntryReport ?? {}) as Record<string, any>;

        const row: ReportRow = {
          taskId: t.id,
          taskName: t.name,
          clientId: t.clientId ?? null,
          clientName: t.client?.name ?? null,
          category: t.category?.name ?? null,
          assignedToId: t.assignedToId ?? null,
          assignedToName: t.assignedTo?.name ?? null,
          taskStatus: String(t.status),
          taskPriority: String(t.priority),
          taskCompletedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,

          dataEntryStatus: typeof rep.status === "string" ? rep.status : null,
          dataEntryCompletedAt: typeof rep.completedAt === "string" ? rep.completedAt : null,
          dataEntryCompletedByUserId: typeof rep.completedByUserId === "string" ? rep.completedByUserId : null,
          dataEntryCompletedByName: typeof rep.completedByName === "string" ? rep.completedByName : null,
        };

        return row;
      })
      .filter((row) => {
        // Must have a valid data entry completion payload
        if (!row.dataEntryCompletedByUserId || !row.dataEntryStatus || !row.dataEntryCompletedAt) return false;

        // Filter by report user
        if (userId && row.dataEntryCompletedByUserId !== userId) return false;

        // Filter by report status (case-insensitive)
        if (status && norm(row.dataEntryStatus) !== norm(status)) return false;

        // Filter by report date range
        if (from || to) {
          const repDate = new Date(row.dataEntryCompletedAt);
          if (isNaN(repDate.getTime())) return false;
          if (from && repDate < from) return false;
          if (to && repDate > to) return false;
        }

        return true;
      });

    // Sorting
    rows.sort((a, b) => {
      const getKey = (r: ReportRow) =>
        sort === "taskDate"
          ? (r.taskCompletedAt ? new Date(r.taskCompletedAt).getTime() : 0)
          : (r.dataEntryCompletedAt ? new Date(r.dataEntryCompletedAt).getTime() : 0);

      const av = getKey(a);
      const bv = getKey(b);
      if (av === bv) return 0;
      return order === "asc" ? av - bv : bv - av;
    });

    // Pagination
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paged = rows.slice(start, end);

    return NextResponse.json({
      total,
      page,
      pageSize,
      data: paged,
    });
  } catch (err) {
    console.error("GET /api/tasks/data-entry-reports error:", err);
    return NextResponse.json({ error: "Failed to fetch data entry reports" }, { status: 500 });
  }
}
