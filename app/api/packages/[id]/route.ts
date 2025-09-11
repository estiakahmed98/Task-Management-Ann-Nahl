// app/api/packages/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";

// ছোট হেল্পার: ইউজারের পারমিশন লিস্ট বের করি
function getPermissionNames(user: any): string[] {
  const rps = user?.role?.rolePermissions ?? [];
  return rps.map((rp: any) => rp?.permission?.name).filter(Boolean);
}

// GET: Single package with templates (+sitesAssets)
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pkg = await prisma.package.findUnique({
      where: { id: params.id },
      include: {
        templates: {
          include: { sitesAssets: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(pkg, { status: 200 });
  } catch (error) {
    console.error("GET /api/packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// PUT: Update package (name/description + optional template linking)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Session → user
    const cookieStore = await cookies();
    const token = cookieStore.get("session-token")?.value;
    const user = token ? await getAuthUser() : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const permissions = getPermissionNames(user);
    if (!permissions.includes("package_edit")) {
      return NextResponse.json(
        { error: "You do not have permission to edit packages" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, templateIds } = body ?? {};

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    // templates connect/disconnect কেবল যখন templateIds পাঠানো হয়
    let templatesUpdate:
      | {
          connect?: { id: string }[];
          disconnect?: { id: string }[];
        }
      | undefined;

    if (typeof templateIds !== "undefined") {
      if (!Array.isArray(templateIds)) {
        return NextResponse.json(
          { error: "Template IDs must be an array" },
          { status: 400 }
        );
      }

      const current = await prisma.package.findUnique({
        where: { id: params.id },
        include: { templates: true },
      });
      if (!current) {
        return NextResponse.json(
          { error: "Package not found" },
          { status: 404 }
        );
      }

      const currentIds = current.templates.map((t) => t.id);
      const newIds: string[] = templateIds;

      const toConnect = newIds.filter((id) => !currentIds.includes(id));
      const toDisconnect = currentIds.filter((id) => !newIds.includes(id));

      templatesUpdate = {
        ...(toConnect.length
          ? { connect: toConnect.map((id) => ({ id })) }
          : {}),
        ...(toDisconnect.length
          ? { disconnect: toDisconnect.map((id) => ({ id })) }
          : {}),
      };
    }

    const updated = await prisma.package.update({
      where: { id: params.id },
      data: {
        name,
        description,
        ...(templatesUpdate ? { templates: templatesUpdate } : {}),
      },
      include: {
        templates: { include: { sitesAssets: true } },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PUT /api/packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE: Guarded delete (disconnect templates, ensure no clients)
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session-token")?.value;
    const user = token ? await getAuthUser() : null;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const permissions = getPermissionNames(user);
    if (!permissions.includes("package_delete")) {
      return NextResponse.json(
        { error: "You do not have permission to delete packages" },
        { status: 403 }
      );
    }

    const existing = await prisma.package.findUnique({
      where: { id: params.id },
      include: { templates: true, clients: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    if ((existing.clients?.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete package that is assigned to clients" },
        { status: 400 }
      );
    }

    // disconnect templates first
    if ((existing.templates?.length ?? 0) > 0) {
      await prisma.package.update({
        where: { id: params.id },
        data: { templates: { set: [] } },
      });
    }

    await prisma.package.delete({ where: { id: params.id } });
    return NextResponse.json(
      { message: "Package deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/packages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
