//api/tasks/[id]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      return NextResponse.json(task);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
    }
  }

  // ========== UPDATE TASK ==========
  export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const body = await req.json();

      const { id } = await params;
      const task = await prisma.task.update({
        where: { id },
        data: {
          name: body.name,
          priority: body.priority,
          status: body.status,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          categoryId: body.categoryId,
          clientId: body.clientId,
          assignedToId: body.assignedToId,
          completionLink: body.completionLink,
          completedAt: body.completedAt ? new Date(body.completedAt) : null,
        },
      });

      return NextResponse.json(task);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
  }