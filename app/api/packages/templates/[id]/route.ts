import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include");

    const includeOptions: any = {};

    if (include) {
      const includeFields = include.split(",");
      if (includeFields.includes("sitesAssets")) {
        includeOptions.sitesAssets = true;
      }
      if (includeFields.includes("templateTeamMembers")) {
        includeOptions.templateTeamMembers = {
          include: {
            agent: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        };
      }
    }

    const template = await prisma.template.findUnique({
      where: {
        id,
      },
      include: includeOptions,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}
