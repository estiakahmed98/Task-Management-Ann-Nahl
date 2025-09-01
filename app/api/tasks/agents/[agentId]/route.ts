// app/api/tasks/agents/[agentId]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, NotificationType } from "@prisma/client";

const prisma = new PrismaClient();

// Utility function → Performance Rating auto-calc
function calculatePerformanceRating(
  ideal: number,
  actual: number
): "Excellent" | "Good" | "Average" | "Lazy" {
  if (actual <= ideal * 0.67) return "Excellent"; // ২০/৩০
  if (actual <= ideal * 0.84) return "Good"; // ২৫/৩০
  if (actual <= ideal) return "Average"; // ৩০/৩০
  return "Lazy"; // >৩০
}

// ---------------- GET ----------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    const tasks = await prisma.task.findMany({
      where: { assignedToId: agentId },
      include: {
        assignment: {
          include: {
            client: { select: { id: true, name: true, avatar: true } },
            template: { select: { id: true, name: true } },
          },
        },
        templateSiteAsset: {
          select: { id: true, name: true, type: true, url: true },
        },
        category: { select: { id: true, name: true } },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    });

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue: tasks.filter((t) => t.status === "overdue").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };

    return NextResponse.json({ tasks, stats });
  } catch (error: any) {
    console.error("Error fetching agent tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent tasks", message: error.message },
      { status: 500 }
    );
  }
}

// ---------------- PATCH ----------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();

    const {
      taskId,
      status,
      completionLink,
      username,
      email,
      password,
      actualDurationMinutes,
    }: {
      taskId: string;
      status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
      completionLink?: string;
      username?: string;
      email?: string;
      password?: string;
      actualDurationMinutes?: number;
    } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "Task ID and status are required" },
        { status: 400 }
      );
    }

    // Verify task ownership
    const task = await prisma.task.findFirst({
      where: { id: taskId, assignedToId: agentId },
      select: { id: true, idealDurationMinutes: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found or not assigned to this agent" },
        { status: 404 }
      );
    }

    // Performance Rating Logic
    let performanceRating:
      | "Excellent"
      | "Good"
      | "Average"
      | "Lazy"
      | undefined;
    if (typeof actualDurationMinutes === "number") {
      performanceRating = calculatePerformanceRating(
        task.idealDurationMinutes ?? 30,
        actualDurationMinutes
      );
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        ...(status === "completed" && { completedAt: new Date() }),
        ...(typeof performanceRating !== "undefined" && { performanceRating }),
        ...(typeof completionLink === "string" &&
          completionLink.trim().length > 0 && {
            completionLink: completionLink.trim(),
            ...(typeof username === "string" &&
              username.trim().length > 0 && { username: username.trim() }),
            ...(typeof email === "string" &&
              email.trim().length > 0 && { email: email.trim() }),
            ...(typeof password === "string" &&
              password.trim().length > 0 && { password }),
          }),
        ...(typeof actualDurationMinutes === "number" && {
          actualDurationMinutes,
        }),
      },
      include: {
        assignment: { include: { client: true } },
        templateSiteAsset: { select: { id: true, name: true, type: true } },
        category: { select: { id: true, name: true } },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { name: "admin" } },
      select: { id: true },
    });

    if (admins.length > 0) {
      const humanStatus: Record<string, string> = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
        overdue: "Overdue",
        cancelled: "Cancelled",
      };

      const agentName =
        [updatedTask.assignedTo?.firstName, updatedTask.assignedTo?.lastName]
          .filter(Boolean)
          .join(" ") ||
        updatedTask.assignedTo?.email ||
        "Agent";

      let message = `${agentName} updated task "${updatedTask.name}" → ${
        humanStatus[updatedTask.status] ?? updatedTask.status
      }.`;

      if (typeof performanceRating !== "undefined") {
        message += ` Performance: ${performanceRating}.`;
      }

      if (typeof actualDurationMinutes === "number") {
        message += ` Actual: ${actualDurationMinutes} min.`;
      }

      if (updatedTask.completionLink) {
        message += ` Link: ${updatedTask.completionLink}`;
        if (updatedTask.username)
          message += ` Username: ${updatedTask.username}`;
        if (updatedTask.email) message += ` Email: ${updatedTask.email}`;
        if (updatedTask.password)
          message += ` Password: ${updatedTask.password}`;
      }

      const notifType: NotificationType =
        typeof performanceRating !== "undefined" ? "performance" : "general";

      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          taskId: updatedTask.id,
          type: notifType,
          message,
        })),
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task", message: error.message },
      { status: 500 }
    );
  }
}
