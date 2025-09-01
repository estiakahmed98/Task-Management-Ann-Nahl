// app/api/clients/[clientId]/assign-package/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: { params: { clientId: string } }
) {
  const clientId = context.params.clientId;

  try {
    const body = await req.json();
    const { packageId } = body;

    // Check if client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if package exists
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Assign package to client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: { packageId },
      include: { socialLinks: true, package: true },
    });

    return NextResponse.json(
      { message: "Package assigned successfully", client: updatedClient },
      { status: 200 }
    );
  } catch (error) {
    console.error("Assign package error:", error);
    return NextResponse.json(
      { error: "Failed to assign package" },
      { status: 500 }
    );
  }
}
