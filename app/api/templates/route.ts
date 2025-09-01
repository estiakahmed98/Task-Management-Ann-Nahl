// app/api/templates/route.ts

import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SiteAssetType } from "@prisma/client";

// Optional: if you have these helpers, keep them. Otherwise this file works without them.
import { logActivity } from "@/lib/logActivity"; // not used directly below; tx.activityLog used instead
import { diffChanges } from "@/utils/audit"; // not used in POST - left for parity

// --- Helpers -----------------------------------------------------------------

/** Map frontend type string -> Prisma enum (covers ALL types) */
const mapSiteAssetType = (frontendType: string): SiteAssetType => {
  const m: Record<string, SiteAssetType> = {
    social_site: SiteAssetType.social_site,
    web2_site: SiteAssetType.web2_site,
    additional_site: SiteAssetType.other_asset, // front uses 'additional_site' → DB 'other_asset'

    graphics_design: SiteAssetType.graphics_design,
    content_studio: SiteAssetType.content_studio,
    content_writing: SiteAssetType.content_writing,
    backlinks: SiteAssetType.backlinks,
    completed_com: SiteAssetType.completed_com,
    youtube_video_optimization: SiteAssetType.youtube_video_optimization,
    monitoring: SiteAssetType.monitoring,
    review_removal: SiteAssetType.review_removal,
    summary_report: SiteAssetType.summary_report,
  };

  return m[frontendType as keyof typeof m] ?? SiteAssetType.other_asset;
};

/** Minimal template snapshot for logging */
const sanitizeTemplate = (t: any) => {
  if (!t) return t;
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    status: t.status ?? null,
    packageId: t.packageId ?? null,
    counts: t._count
      ? {
          sitesAssets: t._count.sitesAssets ?? 0,
          templateTeamMembers: t._count.templateTeamMembers ?? 0,
          assignments: t._count.assignments ?? 0,
        }
      : undefined,
  };
};

/** Safe int parse with lower-bound */
const clampInt = (val: any, fallback: number, min = 1) => {
  const n = Number.parseInt(String(val), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  return Math.max(min, n);
};

/** Deduplicate by (type, name) to avoid accidental duplicates in payload */
const dedupeByTypeAndName = <T extends { type: string; name: string }>(items: T[]) => {
  const seen = new Set<string>();
  return items.filter((it) => {
    const key = `${it.type}::${it.name.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// --- Route: POST /api/templates ----------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      status = "draft",
      packageId,
      sitesAssets = [],
      teamMembers = [],
      actorId: actorIdInBody,
    } = body;

    const actorId =
      actorIdInBody || (request.headers.get("x-actor-id") as string) || null;

    if (!name?.trim() || !packageId?.trim()) {
      return NextResponse.json(
        { message: "Template name and package ID are required" },
        { status: 400 }
      );
    }

    // Normalize and validate site assets (COVERS ALL TYPES)
    const validSitesAssets = dedupeByTypeAndName(
      (sitesAssets as any[]).filter((a) => a?.name && String(a.name).trim())
    ).map((asset: any) => ({
      type: mapSiteAssetType(String(asset.type ?? "other_asset")),
      name: String(asset.name).trim(),
      url: asset.url?.trim() || null,
      description: asset.description?.trim() || null,
      isRequired: Boolean(asset.isRequired),
      defaultPostingFrequency: clampInt(asset.defaultPostingFrequency, 3, 1),
      defaultIdealDurationMinutes: clampInt(asset.defaultIdealDurationMinutes, 30, 1),
    }));

    // Normalize team members (if provided)
    const validTeamMembers = (teamMembers as any[])
      .filter((member) => member?.agentId && member?.role)
      .map((member) => ({
        agentId: String(member.agentId),
        role: String(member.role).trim(),
        teamId:
          member.teamId && member.teamId !== "none" ? String(member.teamId) : null,
        assignedDate: new Date(),
      }));

    const created = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.template.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          status,
          packageId,
          sitesAssets: { create: validSitesAssets },
          templateTeamMembers: { create: validTeamMembers },
        },
        include: {
          package: true,
          sitesAssets: true,
          templateTeamMembers: {
            include: {
              agent: { select: { id: true, name: true, email: true } },
              team: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: {
              sitesAssets: true,
              templateTeamMembers: true,
              assignments: true,
            },
          },
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Template",
          entityId: newTemplate.id,
          userId: actorId,
          action: "create",
          timestamp: new Date(),
          details: sanitizeTemplate(newTemplate),
        },
      });

      return newTemplate;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating template:", error);

    if (error instanceof Error) {
      if (error.message.includes("Invalid value for argument `type`")) {
        return NextResponse.json(
          { message: "Invalid site asset type provided", error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            message: "Invalid package ID or team member reference",
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Failed to create template",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any)?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
