// app/api/packages/[packageId]/templates/route.ts

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templates = await prisma.template.findMany({
      where: {
        packageId: id,
      },
      include: {
        package: true, // ✅ এটি নতুনভাবে যোগ করুন
        templateTeamMembers: {
          include: {
            agent: true,
          },
        },
        sitesAssets: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch templates for this package" },
      { status: 500 }
    );
  }
}
