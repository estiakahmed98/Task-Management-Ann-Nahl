// app/api/tasks/create-posting-tasks/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import type { TaskPriority, TaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { calculateTaskDueDate, extractCycleNumber } from "@/utils/working-days";

// ---------- Constants ----------
const ALLOWED_ASSET_TYPES = [
  "social_site",
  "web2_site",
  "other_asset",
] as const;
const CAT_SOCIAL_ACTIVITY = "Social Activity";
const CAT_BLOG_POSTING = "Blog Posting";

// ---------- Helpers ----------
function normalizeTaskPriority(v: unknown): TaskPriority {
  switch (String(v ?? "").toLowerCase()) {
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    case "urgent":
      return "urgent";
    default:
      return "medium";
  }
}

function resolveCategoryFromType(assetType?: string): string {
  if (!assetType) return CAT_SOCIAL_ACTIVITY;
  if (assetType === "web2_site") return CAT_BLOG_POSTING;
  return CAT_SOCIAL_ACTIVITY; // social_site + other_asset
}

function baseNameOf(name: string): string {
  return String(name)
    .replace(/\s*-\s*\d+$/i, "")
    .trim();
}

function getFrequency(opts: {
  required?: number | null | undefined;
  defaultFreq?: number | null | undefined;
}): number {
  const fromRequired = Number(opts.required);
  if (Number.isFinite(fromRequired) && fromRequired! > 0)
    return Math.floor(fromRequired);
  const fromDefault = Number(opts.defaultFreq);
  if (Number.isFinite(fromDefault) && fromDefault! > 0)
    return Math.floor(fromDefault);
  return 1;
}

function countByStatus(tasks: { status: TaskStatus }[]) {
  const base: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    reassigned: 0,
    qc_approved: 0,
    paused: 0,
    data_entered: 0,
  };
  for (const t of tasks) base[t.status] += 1;
  return base;
}

function safeErr(err: unknown) {
  const anyErr = err as any;
  return {
    name: anyErr?.name ?? null,
    code: anyErr?.code ?? null,
    message: anyErr?.message ?? String(anyErr),
    meta: anyErr?.meta ?? null,
  };
}

function fail(stage: string, err: unknown, http = 500) {
  const e = safeErr(err);
  console.error(`[create-posting-tasks] ${stage} ERROR:`, err);
  return NextResponse.json(
    { message: "Internal Server Error", stage, error: e },
    { status: http }
  );
}

// Node 18+ has global crypto.randomUUID()
const makeId = () =>
  `task_${Date.now()}_${
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  }`;

// ---------- GET: preview ----------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId") ?? undefined;
    const templateIdRaw = searchParams.get("templateId") ?? undefined;
    const onlyType = searchParams.get("onlyType") ?? undefined;

    if (!clientId)
      return NextResponse.json(
        { message: "clientId is required" },
        { status: 400 }
      );

    // Quick DB preflight (surfaces P1001/P1017 immediately)
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      return fail("GET.db-preflight", e);
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        package: { select: { totalMonths: true } },
      },
    });

    if (!client)
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );

    // months = normalized package months (min 1; capped to avoid accidents)
    const packageTotalMonthsRaw = Number(client.package?.totalMonths ?? 1);
    const packageTotalMonths =
      Number.isFinite(packageTotalMonthsRaw) && packageTotalMonthsRaw > 0
        ? Math.min(Math.floor(packageTotalMonthsRaw), 120)
        : 1;

    const templateId =
      templateIdRaw === "none" || templateIdRaw === "" ? null : templateIdRaw;
    const assignment = await prisma.assignment.findFirst({
      where: {
        clientId,
        ...(templateIdRaw !== undefined
          ? { templateId: templateId ?? undefined }
          : {}),
      },
      orderBy: { assignedAt: "desc" },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json(
        {
          message:
            "No existing assignment found for this client. Please create one first.",
        },
        { status: 404 }
      );
    }

    const sourceTasks = await prisma.task.findMany({
      where: {
        assignmentId: assignment.id,
        templateSiteAsset: {
          is: {
            ...(onlyType
              ? { type: onlyType as any }
              : { type: { in: ALLOWED_ASSET_TYPES as unknown as string[] } }),
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        idealDurationMinutes: true,
        completionLink: true,
        email: true,
        password: true,
        username: true,
        notes: true,
        templateSiteAsset: {
          select: { id: true, type: true, defaultPostingFrequency: true },
        },
      },
    });

    const countsByStatus = countByStatus(sourceTasks as any);
    const allApproved =
      sourceTasks.length > 0 &&
      sourceTasks.every((t) => t.status === "qc_approved");

    const assetIds = Array.from(
      new Set(
        sourceTasks
          .map((s) => s.templateSiteAsset?.id)
          .filter((v): v is number => typeof v === "number")
      )
    );
    const settings = assetIds.length
      ? await prisma.assignmentSiteAssetSetting.findMany({
          where: {
            assignmentId: assignment.id,
            templateSiteAssetId: { in: assetIds },
          },
          select: { templateSiteAssetId: true, requiredFrequency: true },
        })
      : [];
    const requiredByAssetId = new Map<number, number | null | undefined>();
    for (const s of settings)
      requiredByAssetId.set(s.templateSiteAssetId, s.requiredFrequency);

    const tasks = sourceTasks.map((src) => {
      const assetId = src.templateSiteAsset?.id;
      const freq = getFrequency({
        required: assetId ? requiredByAssetId.get(assetId) : undefined,
        defaultFreq: src.templateSiteAsset?.defaultPostingFrequency,
      });
      const assetType = src.templateSiteAsset?.type;
      return {
        id: src.id,
        name: src.name,
        baseName: baseNameOf(src.name),
        status: src.status,
        priority: src.priority,
        assetType,
        // 👇 multiply original frequency by package months
        frequency: freq * packageTotalMonths,
        categoryName: resolveCategoryFromType(assetType),
      };
    });

    const totalWillCreate = tasks.reduce(
      (acc, t) => acc + (t.frequency ?? 1),
      0
    );

    return NextResponse.json({
      message: "Preview of source tasks for copying.",
      assignmentId: assignment.id,
      tasks,
      countsByStatus,
      allApproved,
      totalWillCreate,
      packageTotalMonths, // 👈 added
      runtime: "nodejs",
    });
  } catch (err) {
    return fail("GET.catch", err);
  }
}

// ---------- POST: create ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId: string | undefined = body?.clientId;
    const templateIdRaw: string | undefined = body?.templateId;
    const onlyType: string | undefined = body?.onlyType;

    if (!clientId)
      return NextResponse.json(
        { message: "clientId is required" },
        { status: 400 }
      );

    // DB preflight
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      return fail("POST.db-preflight", e);
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        package: { select: { totalMonths: true } },
      },
    });

    if (!client)
      return NextResponse.json(
        { message: "Client not found" },
        { status: 404 }
      );

    // months = normalized package months (min 1; capped)
    const monthsRaw = Number(client.package?.totalMonths ?? 1);
    const months =
      Number.isFinite(monthsRaw) && monthsRaw > 0
        ? Math.min(Math.floor(monthsRaw), 120)
        : 1;

    const templateId = templateIdRaw === "none" ? null : templateIdRaw;
    const assignment = await prisma.assignment.findFirst({
      where: {
        clientId,
        ...(templateId !== undefined
          ? { templateId: templateId ?? undefined }
          : {}),
      },
      orderBy: { assignedAt: "desc" },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json(
        {
          message:
            "No existing assignment found for this client. Please create one first.",
        },
        { status: 404 }
      );
    }

    const sourceTasks = await prisma.task.findMany({
      where: {
        assignmentId: assignment.id,
        templateSiteAsset: {
          is: {
            ...(onlyType
              ? { type: onlyType as any }
              : { type: { in: ALLOWED_ASSET_TYPES as unknown as string[] } }),
          },
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        idealDurationMinutes: true,
        completionLink: true,
        email: true,
        password: true,
        username: true,
        notes: true,
        createdAt: true,
        templateSiteAsset: {
          select: { id: true, type: true, defaultPostingFrequency: true },
        },
      },
    });

    if (!sourceTasks.length) {
      return NextResponse.json(
        { message: "No source tasks found to copy.", tasks: [] },
        { status: 200 }
      );
    }

    // QC gate
    const notApproved = sourceTasks.filter((t) => t.status !== "qc_approved");
    if (notApproved.length) {
      return NextResponse.json(
        {
          message:
            "All source tasks must be 'qc_approved' before creating posting tasks.",
          notApprovedTaskIds: notApproved.map((t) => t.id),
          countsByStatus: countByStatus(sourceTasks as any),
        },
        { status: 400 }
      );
    }

    // per-asset frequency overrides
    const assetIds = Array.from(
      new Set(
        sourceTasks
          .map((s) => s.templateSiteAsset?.id)
          .filter((v): v is number => typeof v === "number")
      )
    );
    const settings = assetIds.length
      ? await prisma.assignmentSiteAssetSetting.findMany({
          where: {
            assignmentId: assignment.id,
            templateSiteAssetId: { in: assetIds },
          },
          select: { templateSiteAssetId: true, requiredFrequency: true },
        })
      : [];
    const requiredByAssetId = new Map<number, number | null | undefined>();
    for (const s of settings)
      requiredByAssetId.set(s.templateSiteAssetId, s.requiredFrequency);

    // Ensure categories WITHOUT relying on unique(name)
    const ensureCategory = async (name: string) => {
      const found = await prisma.taskCategory.findFirst({
        where: { name },
        select: { id: true, name: true },
      });
      if (found) return found;
      try {
        return await prisma.taskCategory.create({
          data: { name },
          select: { id: true, name: true },
        });
      } catch (e) {
        // In case two lambdas race-create, fetch again
        const again = await prisma.taskCategory.findFirst({
          where: { name },
          select: { id: true, name: true },
        });
        if (again) return again;
        throw e;
      }
    };

    const [socialCat, blogCat] = await Promise.all([
      ensureCategory(CAT_SOCIAL_ACTIVITY),
      ensureCategory(CAT_BLOG_POSTING),
    ]);
    const categoryIdByName = new Map<string, string>([
      [socialCat.name, socialCat.id],
      [blogCat.name, blogCat.id],
    ]);

    // Expand copies: (per-asset frequency) × (package months)
    const expandedCopies: {
      src: (typeof sourceTasks)[number];
      name: string;
      catName: string;
    }[] = [];

    for (const src of sourceTasks) {
      const assetType = src.templateSiteAsset?.type;
      const assetId = src.templateSiteAsset?.id;

      // original frequency for this asset
      const freq = getFrequency({
        required: assetId ? requiredByAssetId.get(assetId) : undefined,
        defaultFreq: src.templateSiteAsset?.defaultPostingFrequency,
      });

      const catName = resolveCategoryFromType(assetType);
      const base = baseNameOf(src.name);

      // total copies = freq * months
      const totalCopies = Math.max(1, freq * months);
      for (let i = 1; i <= totalCopies; i++) {
        expandedCopies.push({ src, catName, name: `${base} -${i}` });
      }
    }

    // De-dup by name within target cats
    const namesToCheck = Array.from(new Set(expandedCopies.map((e) => e.name)));
    const existingCopies = await prisma.task.findMany({
      where: {
        assignmentId: assignment.id,
        name: { in: namesToCheck },
        category: {
          is: { name: { in: [CAT_SOCIAL_ACTIVITY, CAT_BLOG_POSTING] } },
        },
      },
      select: { name: true },
    });
    const skipNameSet = new Set(existingCopies.map((t) => t.name));

    const overridePriority = body?.priority
      ? normalizeTaskPriority(body?.priority)
      : undefined;

    type TaskCreate = Parameters<typeof prisma.task.create>[0]["data"];
    const payloads: TaskCreate[] = [];

    for (const item of expandedCopies) {
      if (skipNameSet.has(item.name)) continue;

      const src = item.src;
      const catId = categoryIdByName.get(item.catName)!;

      const n = extractCycleNumber(item.name);
      const cycleNumber = Number.isFinite(n) && n > 0 ? n : 1;

      const assetCreatedAt = src.createdAt || new Date();
      const dueDate = calculateTaskDueDate(assetCreatedAt, cycleNumber);

      payloads.push({
        id: makeId(),
        name: item.name,
        status: "pending",
        priority: overridePriority ?? src.priority,
        idealDurationMinutes: src.idealDurationMinutes ?? undefined,
        dueDate: dueDate.toISOString(),
        completionLink: src.completionLink ?? undefined,
        email: src.email ?? undefined,
        password: src.password ?? undefined,
        username: src.username ?? undefined,
        notes: src.notes ?? undefined,
        assignment: { connect: { id: assignment.id } },
        client: { connect: { id: clientId } },
        category: { connect: { id: catId } },
      } as TaskCreate);
    }

    if (!payloads.length) {
      return NextResponse.json(
        {
          message:
            "All frequency-based copies already exist under 'Social Activity' / 'Blog Posting'.",
          created: 0,
          skipped: expandedCopies.length,
          assignmentId: assignment.id,
          tasks: [],
        },
        { status: 200 }
      );
    }

    // Create inside a transaction (can chunk if very large)
    const created = await prisma.$transaction((tx) =>
      Promise.all(
        payloads.map((data) =>
          tx.task.create({
            data,
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              createdAt: true,
              dueDate: true,
              idealDurationMinutes: true,
              completionLink: true,
              email: true,
              password: true,
              username: true,
              notes: true,
              assignment: { select: { id: true } },
              category: { select: { id: true, name: true } },
              templateSiteAsset: {
                select: { id: true, name: true, type: true },
              },
            },
          })
        )
      )
    );

    return NextResponse.json(
      {
        message: `Created ${created.length} frequency-based task copy/copies (pending, unlinked) with calculated due dates.`,
        created: created.length,
        skipped: skipNameSet.size,
        assignmentId: assignment.id,
        tasks: created,
        runtime: "nodejs",
      },
      { status: 201 }
    );
  } catch (err) {
    return fail("POST.catch", err);
  }
}
