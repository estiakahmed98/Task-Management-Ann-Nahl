import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/tasks/clients - Get all clients with task stats
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get("packageId");
  const includeTasks = searchParams.get("includeTasks") === "true";

  const clients = await prisma.client.findMany({
    where: {
      packageId: packageId || undefined,
    },
    include: {
      socialMedias: true,
      tasks: {
        include: {
          templateSiteAsset: true,
          category: true,
          assignedTo: true,
        },
      },
      package: { select: { name: true } }, // for UI badge
    },
  });

  const clientsWithTaskStats = clients.map((client) => {
    const tasksByCategory: Record<
      string,
      { total: number; completed: number }
    > = {};
    const tasksByAssetType: Record<
      string,
      { total: number; completed: number }
    > = {};

    // ---- Buckets ----
    const assetCreationTasks = client.tasks.filter(
      (task) =>
        task.templateSiteAsset &&
        ["social_site", "web2_site", "other_asset"].includes(
          (task.templateSiteAsset.type as unknown as string) ?? ""
        )
    );

    const postingTasks = client.tasks.filter(
      (task) =>
        task.category &&
        ["Social Activity", "Blog Posting"].includes(task.category.name)
    );

    // ---- Asset Creation stats (by category & asset type) ----
    assetCreationTasks.forEach((task) => {
      // Category-level
      if (task.category) {
        if (!tasksByCategory[task.category.name]) {
          tasksByCategory[task.category.name] = { total: 0, completed: 0 };
        }
        tasksByCategory[task.category.name].total += 1;
        if (task.status === "qc_approved") {
          tasksByCategory[task.category.name].completed += 1;
        }
      }

      // Asset-type level
      if (task.templateSiteAsset) {
        const assetType = String(task.templateSiteAsset.type);
        if (!tasksByAssetType[assetType]) {
          tasksByAssetType[assetType] = { total: 0, completed: 0 };
        }
        tasksByAssetType[assetType].total += 1;
        if (task.status === "qc_approved") {
          tasksByAssetType[assetType].completed += 1;
        }
      }
    });

    // ---- Posting stats (mirrors "Required Assets" UI) ----
    const postingByCategory: Record<
      string,
      { total: number; completed: number }
    > = {};
    postingTasks.forEach((task) => {
      const cat = task.category?.name;
      if (!cat) return;

      if (!postingByCategory[cat]) {
        postingByCategory[cat] = { total: 0, completed: 0 };
      }
      postingByCategory[cat].total += 1;

      // treat both "completed" and "qc_approved" as done for posting
      if (task.status === "completed" || task.status === "qc_approved") {
        postingByCategory[cat].completed += 1;
      }
    });

    const totalPostingTasks = postingTasks.length;
    const completedPostingTasks = postingTasks.filter(
      (t) => t.status === "completed" || t.status === "qc_approved"
    ).length;
    const isAllPostingCompleted =
      totalPostingTasks > 0 && completedPostingTasks === totalPostingTasks;

    // ---- Gate for creating posting tasks: all required asset types complete ----
    const requiredAssetTypes = ["social_site", "web2_site", "other_asset"];
    const isReadyForTaskCreation = requiredAssetTypes.every((assetType) => {
      const stats = tasksByAssetType[assetType];
      return stats && stats.total > 0 && stats.completed === stats.total;
    });

    // ---- Top-level convenience flags for UI ----
    const existingPostingTasksCount = totalPostingTasks;
    const postingTasksCreated = existingPostingTasksCount > 0;

    return {
      // keep payload lean and consistent
      id: client.id,
      name: client.name ?? null,
      company: client.company ?? null,
      status: client.status ?? null,
      package: client.package ? { name: client.package.name } : null,
      avatar: client.avatar ?? null,
      socialMedias: client.socialMedias,

      // top-level flags used in client cards
      postingTasksCreated,
      existingPostingTasksCount,

      taskStats: {
        // Asset creation (required assets)
        categories: tasksByCategory,
        assetTypes: tasksByAssetType,
        isReadyForTaskCreation,
        totalTasks: assetCreationTasks.length,
        completedTasks: assetCreationTasks.filter(
          (t) => t.status === "qc_approved"
        ).length,

        // Posting block (mirrors UI)
        posting: {
          categories: postingByCategory,
          totalPostingTasks,
          completedPostingTasks,
          isAllPostingCompleted,
        },

        // Optional: include posting task list details for drawers/tables
        ...(includeTasks && {
          createdTasks: postingTasks.map((task) => ({
            id: task.id,
            name: task.name,
            status: task.status,
            dueDate: task.dueDate,
            assignedTo: task.assignedTo
              ? { name: task.assignedTo.name, email: task.assignedTo.email }
              : undefined,
            category: task.category ? { name: task.category.name } : undefined,
          })),
        }),
      },

      // strip heavy tasks array from output
      tasks: undefined as unknown as undefined,
    };
  });

  return NextResponse.json({ clients: clientsWithTaskStats });
}

// POST /api/tasks/clients - Create new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      birthdate,
      company,
      designation,
      location,
      website,
      website2,
      website3,
      companywebsite,
      companyaddress,
      biography,
      imageDrivelink,
      avatar,
      progress,
      status,
      packageId,
      startDate,
      dueDate,
      socialLinks = [],
    } = body;

    const normalizePlatform = (input: unknown): string => {
      const raw = String(input ?? "").trim();
      return raw || "OTHER";
    };

    const client = await prisma.client.create({
      data: {
        name,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        company,
        designation,
        location,
        website,
        website2,
        website3,
        companywebsite,
        companyaddress,
        biography,
        imageDrivelink,
        avatar,
        progress,
        status,
        packageId,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        socialMedias: {
          create: Array.isArray(socialLinks)
            ? socialLinks
                .filter((l: any) => l && l.platform && l.url)
                .map((l: any) => ({
                  platform: normalizePlatform(l.platform) as any,
                  url: l.url as string,
                  username: l.username ?? null,
                  email: l.email ?? null,
                  phone: l.phone ?? null,
                  password: l.password ?? null,
                  notes: l.notes ?? null,
                }))
            : [],
        },
      } as any,
      include: { socialMedias: true },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
