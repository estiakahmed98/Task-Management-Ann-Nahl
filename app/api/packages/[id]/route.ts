//app/api/packages/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getUserFromSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// GET single package with templates
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const packageData = await prisma.package.findUnique({
      where: { id },
      include: {
        templates: {
          include: {
            sitesAssets: true, // Include site assets for templates
          },
        },
      },
    });

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(packageData);
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// PUT update package
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 🔑 session থেকে user আনুন
  const token =
    request.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session-token="))
      ?.split("=")[1] || "";

  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await hasPermission(user.id, "package_edit");
  if (!allowed) {
    return NextResponse.json(
      { error: "You do not have permission to edit packages" },
      { status: 403 }
    );
  }

  try {
    const { name, description, templateIds } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Package name is required" },
        { status: 400 }
      );
    }

    // Validate templateIds if provided
    if (templateIds && !Array.isArray(templateIds)) {
      return NextResponse.json(
        { error: "Template IDs must be an array" },
        { status: 400 }
      );
    }

    // First get current package with templates
    const currentPackage = await prisma.package.findUnique({
      where: { id: (await context.params).id },
      include: { templates: true },
    });

    if (!currentPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Get current template IDs
    const currentTemplateIds = currentPackage.templates.map((t) => t.id);
    const newTemplateIds = templateIds || [];

    // Determine templates to connect/disconnect
    const templatesToConnect = newTemplateIds.filter(
      (id: string) => !currentTemplateIds.includes(id)
    );
    const templatesToDisconnect = currentTemplateIds.filter(
      (id) => !newTemplateIds.includes(id)
    );

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE package
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // 🔑 session থেকে user আনুন
  const token =
    request.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session-token="))
      ?.split("=")[1] || "";

  const user = await getUserFromSession(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await hasPermission(user.id, "package_delete");
  if (!allowed) {
    return NextResponse.json(
      { error: "You do not have permission to delete packages" },
      { status: 403 }
    );
  }

  try {
    // Check if package exists
    const existingPackage = await prisma.package.findUnique({
      where: { id: (await context.params).id },
      include: {
        templates: true,
        clients: true, // Check if package is being used by clients
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package is being used by clients
    if (existingPackage.clients.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete package that is assigned to clients" },
        { status: 400 }
      );
    }

    // First disconnect all templates
    await prisma.package.update({
      where: { id: (await context.params).id },
      data: {
        templates: {
          set: [],
        },
      },
    });

    // Then delete the package
    await prisma.package.delete({
      where: { id: (await context.params).id },
    });

    return NextResponse.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
    