import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, TaskStatus, TaskPriority, SiteAssetType, PeriodType } from "@prisma/client";

const prisma = new PrismaClient();

import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        client: true,
        template: {
          include: {
            sitesAssets: true,
            templateTeamMembers: {
              include: {
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: true,
          },
        },
        siteAssetSettings: true,
      },
      orderBy: {
        assignedAt: "desc",
      },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { message: "Failed to fetch assignments", error: errorMessage },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, templateId, status = "pending", agentIds = [] } = body as {
      clientId?: string;
      templateId?: string | null;
      status?: string;
      agentIds?: string[];
    };

    if (!clientId) {
      return NextResponse.json({ message: "Client ID is required" }, { status: 400 });
    }

    // ---- helpers (scoped to this handler) ----
    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy;
    };

    // Prisma enum → TaskCategory.name map (ensure these exact names exist or will be created)
    const CATEGORY_NAME_BY_TYPE: Record<SiteAssetType, string> = {
      social_site: "Social Asset Creation",
      web2_site: "Web 2.0 Asset Creation",
      other_asset: "Additional Asset Creation",
      graphics_design: "Graphics Design",
      content_studio: "Content Studio",
      content_writing: "Content Writing",
      backlinks: "Backlinks",
      completed_com: "Completed Communication",
      youtube_video_optimization: "YouTube Video Optimization",
      monitoring: "Monitoring",
      review_removal: "Review Removal",
      summary_report: "Summary Report",
    };

    const ensureTaskCategories = async () => {
      const names = Array.from(new Set(Object.values(CATEGORY_NAME_BY_TYPE)));
      await prisma.$transaction(
        names.map((name) =>
          prisma.taskCategory.upsert({
            where: { name }, // name is unique in schema
            create: { name },
            update: {},
          })
        )
      );
    };

    // ---- 1) Create assignment ----
    const assignment = await prisma.assignment.create({
      data: {
        id: `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        clientId,
        templateId: !templateId || templateId === "none" ? null : templateId,
        status,
        assignedAt: new Date(),
      },
    });

    // ---- 2) Ensure categories exist + build id map ----
    await ensureTaskCategories();
    const categories = await prisma.taskCategory.findMany();
    const idByName = new Map(categories.map((c) => [c.name, c.id]));

    // ---- 3) If template is attached → create 1 Task per site/asset + setting rows ----
    if (templateId && templateId !== "none") {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: { sitesAssets: true },
      });

      if (!template) {
        return NextResponse.json({ message: "Template not found" }, { status: 404 });
      }

      if (template.sitesAssets.length > 0) {
        const now = new Date();
        const defaultDue = addDays(now, 7);

        const tasksToCreate = template.sitesAssets.map((site) => {
          const duration = site.defaultIdealDurationMinutes ?? 30;
          const type = site.type as SiteAssetType;
          const categoryName = CATEGORY_NAME_BY_TYPE[type] ?? "Other Task";
          const categoryId = idByName.get(categoryName) ?? null;

          return {
            id: randomUUID(),
            name: `${site.name} Task`,
            assignmentId: assignment.id,
            clientId,
            templateSiteAssetId: site.id,
            categoryId,
            dueDate: defaultDue,
            status: TaskStatus.pending,
            priority: TaskPriority.medium,
            idealDurationMinutes: duration,
          };
        });

        const settingsToCreate = template.sitesAssets.map((site) => ({
          assignmentId: assignment.id,
          templateSiteAssetId: site.id,
          requiredFrequency: site.defaultPostingFrequency ?? null,
          period: PeriodType.monthly, // schema default is monthly; set explicitly for clarity
          idealDurationMinutes: site.defaultIdealDurationMinutes ?? null,
        }));

        if (tasksToCreate.length) await prisma.task.createMany({ data: tasksToCreate });
        if (settingsToCreate.length)
          await prisma.assignmentSiteAssetSetting.createMany({ data: settingsToCreate });
      }
    }

    // ---- 4) If agents provided → upsert membership + optional agent personal tasks ----
    if (Array.isArray(agentIds) && agentIds.length > 0) {
      const uniqueAgentIds = Array.from(new Set(agentIds));

      const agents = await prisma.user.findMany({
        where: {
          id: { in: uniqueAgentIds },
          role: { name: { equals: "agent", mode: "insensitive" } },
        },
        select: { id: true, name: true, firstName: true, lastName: true },
      });

      const validAgentIds = agents.map((a) => a.id);

      // upsert client-team memberships (composite PK)
      if (validAgentIds.length > 0) {
        await prisma.$transaction(
          validAgentIds.map((agentId) =>
            prisma.clientTeamMember.upsert({
              where: { clientId_agentId: { clientId, agentId } },
              create: { clientId, agentId, assignedDate: new Date() },
              update: { assignedDate: new Date() },
            })
          )
        );

        // optional: one "personal" task per agent under this assignment
        await prisma.task.createMany({
          data: validAgentIds.map((agentId) => {
            const agent = agents.find((a) => a.id === agentId);
            const label =
              agent?.name ||
              `${(agent?.firstName ?? "").trim()} ${(agent?.lastName ?? "").trim()}`.trim() ||
              `Agent ${agentId}`;
            return {
              id: randomUUID(),
              name: `Task for ${label}`,
              assignmentId: assignment.id,
              clientId,
              assignedToId: agentId,
              status: TaskStatus.pending,
              priority: TaskPriority.medium,
            };
          }),
        });
      }
    }

    // ---- 5) Return full assignment with relations ----
    const completeAssignment = await prisma.assignment.findUnique({
      where: { id: assignment.id },
      include: {
        client: true,
        template: {
          include: {
            sitesAssets: true,
            templateTeamMembers: {
              include: {
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    firstName: true,
                    lastName: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: { assignedTo: true, category: true, templateSiteAsset: true },
          orderBy: { createdAt: "desc" },
        },
        siteAssetSettings: true,
      },
    });

    return NextResponse.json(completeAssignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      {
        message: "Failed to create assignment",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
