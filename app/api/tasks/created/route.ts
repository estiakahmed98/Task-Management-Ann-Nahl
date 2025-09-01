import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const CAT_SOCIAL_ACTIVITY = "Social Activity";
const CAT_BLOG_POSTING = "Blog Posting";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const status = searchParams.get("status") ?? undefined; // pending | in_progress | completed | overdue | cancelled | reassigned | qc_approved
    const priority = searchParams.get("priority") ?? undefined; // low | medium | high | urgent
    const category = searchParams.get("category") ?? undefined; // Social Activity | Blog Posting
    const q = (searchParams.get("q") ?? "").trim();

    // Base filter: only “posting” categories for this endpoint
    const where: any = {
      category: {
        is: { name: { in: [CAT_SOCIAL_ACTIVITY, CAT_BLOG_POSTING] } },
      },
    };

    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = { is: { name: category } };

    if (q) {
      // Expanded search: name, notes, username, email, completionLink
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { completionLink: { contains: q, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],

      // Return ALL useful scalars + rich relations for the UI
      select: {
        // --- Scalars (everything you likely need on the card) ---
        id: true,
        name: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,

        idealDurationMinutes: true,
        actualDurationMinutes: true,
        performanceRating: true,

        completionLink: true,
        email: true, // ✅ now included
        password: true, // ✅ now included
        username: true, // ✅ already used in UI
        notes: true,
        reassignNotes: true,

        // Foreign keys (optional if you need them)
        assignmentId: true,
        clientId: true,
        categoryId: true,
        assignedToId: true,
        templateSiteAssetId: true,

        // --- Relations for richer UI ---
        category: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
        templateSiteAsset: {
          select: {
            id: true,
            type: true,
            name: true,
            url: true,
            description: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            avatar: true,
            status: true,
            package: { select: { id: true, name: true } },
          },
        },

        // Latest comments (newest first) with author
        comments: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            text: true,
            date: true,
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },

        // Latest reports (newest first) with author
        reports: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            text: true,
            severity: true,
            date: true,
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },

        // Notifications attached to this task (unread state + type)
        notifications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            message: true,
            isRead: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    // Header widgets: quick counts
    const countsByStatus = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});

    const countsByPriority = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] ?? 0) + 1;
      return acc;
    }, {});

    const countsByCategory = tasks.reduce<Record<string, number>>((acc, t) => {
      const c = t.category?.name ?? "Uncategorized";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      tasks,
      summary: {
        total: tasks.length,
        countsByStatus,
        countsByPriority,
        countsByCategory,
      },
    });
  } catch (err: any) {
    console.error("GET /api/tasks/created error:", err);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
