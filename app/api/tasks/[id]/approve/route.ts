//app/api/tasks/[id]/approve/route.ts

import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { performanceRating } = body;

    // Validate performance rating
    const validRatings = ["Excellent", "Good", "Average", "Lazy"];
    if (!performanceRating || !validRatings.includes(performanceRating)) {
      return NextResponse.json(
        { error: "Valid performance rating is required" },
        { status: 400 }
      );
    }

    // Update only status and performanceRating, preserve all other fields
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: "qc_approved",
        performanceRating: performanceRating,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: {
          include: {
            template: {
              include: {
                package: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        templateSiteAsset: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error approving task:", error);
    return NextResponse.json(
      { error: "Failed to approve task" },
      { status: 500 }
    );
  }
}
