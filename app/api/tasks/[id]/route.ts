// app/api/tasks/[id]/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ========== READ SINGLE TASK ==========
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: { client: true, category: true, assignedTo: true },
    });

    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// ========== UPDATE TASK ==========
// ========== UPDATE TASK ==========
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id } = await params;

    // Fetch existing to support merging JSON safely
    const existing = await prisma.task.findUnique({
      where: { id },
      select: { dataEntryReport: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Build data object defensively (ignore undefineds)
    const data: Prisma.TaskUpdateInput = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.priority === "string") data.priority = body.priority as any;
    if (typeof body.status === "string") data.status = body.status as any;
    if (typeof body.dueDate === "string") data.dueDate = new Date(body.dueDate);
    if (typeof body.completedAt === "string") data.completedAt = new Date(body.completedAt);
    if (typeof body.completionLink === "string") data.completionLink = body.completionLink;

    if (typeof body.categoryId === "string") data.category = { connect: { id: body.categoryId } };
    if (typeof body.clientId === "string") data.client = { connect: { id: body.clientId } };
    if (typeof body.assignedToId === "string") data.assignedTo = { connect: { id: body.assignedToId } };

    // Merge dataEntryReport if provided
    if (body.dataEntryReport && typeof body.dataEntryReport === "object") {
      const existingReport = (existing.dataEntryReport ?? {}) as Record<string, any>;
      const incomingReport = body.dataEntryReport as Record<string, any>;
      // Server authority: always set completedAt to now when updating a report
      const merged = {
        ...existingReport,
        ...incomingReport,
        completedAt: new Date().toISOString(),
      };
      data.dataEntryReport = merged as Prisma.InputJsonValue;
    }

    // Update now with the built data
    const task = await prisma.task.update({
      where: { id },
      data,
      include: { assignedTo: true },
    });

    // 2️⃣ Admin + QC role এর সব ইউজার বের করুন
    const notifyUsers = await prisma.user.findMany({
      where: { role: { name: { in: ["admin", "qc"] } } }, // ✅ দুইটা role একসাথে
      select: { id: true },
    });

    // 3️⃣ Notification message বানান
    const message =
      body.status === "completed"
        ? `${task.assignedTo?.name || "An agent"} completed task "${
            task.name
          }".`
        : `${task.assignedTo?.name || "An agent"} updated task "${
            task.name
          }" → ${body.status}.`;

    const type = body.status === "completed" ? "performance" : "general";

    // 4️⃣ একসাথে সব notifyUsers-কে notification পাঠান
    await prisma.$transaction(
      notifyUsers.map((u) =>
        prisma.notification.create({
          data: {
            userId: u.id,
            taskId: task.id,
            type,
            message,
            createdAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// ========== DELETE TASK ==========
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
