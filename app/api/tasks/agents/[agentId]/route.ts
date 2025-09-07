// app/api/tasks/agents/[agentId]/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, NotificationType } from "@prisma/client";

import dns from "node:dns/promises";
import net from "node:net";

const prisma = new PrismaClient();

export const runtime = "nodejs";

function isPrivateIp(ip: string) {
  if (ip === "::1") return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("0.")) return true;
  const [a, b] = ip.split(".").map((n) => parseInt(n, 10));
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

async function assertUrlReachable(raw: string) {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error("Enter a valid URL (e.g., https://example.com)");
  }
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("URL must start with http:// or https://");
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    throw new Error("Local/loopback URLs are not allowed.");
  }

  try {
    const { address } = await dns.lookup(host);
    if (net.isIP(address) && isPrivateIp(address)) {
      throw new Error("Private network URLs are not allowed.");
    }
  } catch {
    // ignore; fetch may still resolve
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const commonOpts: RequestInit = {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "*/*",
    },
    cache: "no-store",
    signal: controller.signal,
  };

  try {
    let res = await fetch(url, { ...commonOpts, method: "HEAD" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { ...commonOpts, method: "GET" });
    }
    const ok =
      (res.status >= 200 && res.status < 400) ||
      res.status === 401 ||
      res.status === 403;
    if (!ok) throw new Error(`URL responded with status ${res.status}.`);
  } catch {
    throw new Error("URL is not reachable (network/DNS/timeout).");
  } finally {
    clearTimeout(timer);
  }
}

// Utility function → Performance Rating auto-calc
function calculatePerformanceRating(
  ideal: number,
  actual: number
): "Excellent" | "Good" | "Average" | "Lazy" {
  if (actual <= ideal * 0.9) return "Excellent"; // ≤ 90%
  if (actual <= ideal * 0.95) return "Good"; // >90% && ≤95%
  if (actual <= ideal) return "Average"; // >95% && ≤100%
  return "Lazy"; // >100%
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

    // If a completion link is provided, validate its reachability first
    if (typeof completionLink === "string" && completionLink.trim()) {
      try {
        await assertUrlReachable(completionLink.trim());
      } catch (e: any) {
        return NextResponse.json(
          {
            error: "Invalid completion link",
            message: e.message || "URL check failed",
          },
          { status: 400 }
        );
      }
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

    // ✅ Notify Admins (সব status এ)
    const admins = await prisma.user.findMany({
      where: { role: { name: "admin" } },
      select: { id: true },
    });

    // ✅ Notify QC (শুধু completed এ)
    const qcUsers =
      status === "completed"
        ? await prisma.user.findMany({
            where: { role: { name: "qc" } },
            select: { id: true },
          })
        : [];

    // যদি কারো notify করার থাকে
    const notifyUsers = [...admins, ...qcUsers];
    if (notifyUsers.length > 0) {
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
        data: notifyUsers.map((u) => ({
          userId: u.id,
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
