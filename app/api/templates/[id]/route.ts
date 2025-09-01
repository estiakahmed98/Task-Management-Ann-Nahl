// app/api/templates/[id]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SiteAssetType } from "@prisma/client";
import { logActivity } from "@/lib/logActivity";
import { diffChanges } from "@/utils/audit"; // না থাকলে নিচের লোকাল fallback ব্যবহার করো

// --- Fallback (যদি utils/audit না থাকে) ---
// const diffChanges = (before: any, after: any, ignore: string[] = []) => {
//   const changed: Record<string, { from: any; to: any }> = {};
//   const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
//   keys.forEach((k) => {
//     if (ignore.includes(k)) return;
//     const bv = before?.[k];
//     const av = after?.[k];
//     if (JSON.stringify(bv) !== JSON.stringify(av)) changed[k] = { from: bv, to: av };
//   });
//   return changed;
// };

const mapSiteAssetType = (frontendType: string): SiteAssetType => {
  switch (frontendType) {
    case "social_site":
      return SiteAssetType.social_site;
    case "web2_site":
      return SiteAssetType.web2_site;
    case "additional_site":
      return SiteAssetType.other_asset;
    default:
      return SiteAssetType.other_asset;
  }
};

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
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

    const validSitesAssets = sitesAssets
      .filter((asset: any) => asset.name && asset.name.trim())
      .map((asset: any) => ({
        type: mapSiteAssetType(asset.type),
        name: asset.name.trim(),
        url: asset.url?.trim() || null,
        description: asset.description?.trim() || null,
        isRequired: Boolean(asset.isRequired),
        defaultPostingFrequency: Math.max(
          1,
          parseInt(asset.defaultPostingFrequency) || 1
        ),
        defaultIdealDurationMinutes: Math.max(
          1,
          parseInt(asset.defaultIdealDurationMinutes) || 30
        ),
      }));

    const validTeamMembers = teamMembers
      .filter((member: any) => member.agentId && member.role)
      .map((member: any) => ({
        agentId: member.agentId,
        role: member.role.trim(),
        teamId:
          member.teamId && member.teamId !== "none" ? member.teamId : null,
        assignedDate: new Date(),
      }));

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.template.findUnique({
        where: { id: templateId },
        include: {
          _count: {
            select: {
              sitesAssets: true,
              templateTeamMembers: true,
              assignments: true,
            },
          },
        },
      });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const updatedTemplate = await tx.template.update({
        where: { id: templateId },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          status,
          packageId,
          sitesAssets: {
            deleteMany: {}, // Clear old ones
            create: validSitesAssets,
          },
          templateTeamMembers: {
            deleteMany: {}, // Clear old ones
            create: validTeamMembers,
          },
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

      const changes = diffChanges(
        sanitizeTemplate(existing),
        sanitizeTemplate(updatedTemplate),
        ["updatedAt", "createdAt"]
      );

      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Template",
          entityId: updatedTemplate.id,
          userId: actorId,
          action: "update",
          details: { changes },
        },
      });

      return updatedTemplate;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    console.error("Error updating template:", error);

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
        message: "Failed to update template",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any)?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        { message: "Template ID is required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        package: { select: { id: true, name: true } },
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

    if (!template) {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch template",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any)?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params;

  try {
    const actorId =
      (request.headers.get("x-actor-id") as string) ||
      (request.nextUrl.searchParams.get("actorId") as string) ||
      null;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.template.findUnique({
        where: { id: templateId },
        select: { id: true, name: true, packageId: true },
      });
      if (!existing) throw new Error("NOT_FOUND");

      // First, delete dependent records
      // First, delete dependent records (capture counts)
      const [assetsDel, teamDel, assignDel] = await Promise.all([
        tx.templateSiteAsset.deleteMany({ where: { templateId } }),
        tx.templateTeamMember.deleteMany({ where: { templateId } }),
        tx.assignment.deleteMany({ where: { templateId } }),
      ]);

      // Then delete the template
      await tx.template.delete({ where: { id: templateId } });

      // Audit log with child delete counts
      await tx.activityLog.create({
        data: {
          id: crypto.randomUUID(),
          entityType: "Template",
          entityId: existing.id,
          userId: actorId,
          action: "delete",
          details: {
            name: existing.name,
            packageId: existing.packageId ?? null,
            deletedChildren: {
              siteAssets: assetsDel.count,
              teamMembers: teamDel.count,
              assignments: assignDel.count,
            },
          },
        },
      });
    });

    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json(
        { message: "Template not found" },
        { status: 404 }
      );
    }

    console.error("Error deleting template:", error);
    return NextResponse.json(
      {
        message: "Failed to delete template",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any)?.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
