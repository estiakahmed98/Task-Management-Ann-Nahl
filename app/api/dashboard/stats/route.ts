// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_request: NextRequest) {
  try {
    // ---------- Core, recent, and analytics (existing logic) ----------
    const [
      totalClients,
      totalTasks,
      totalUsers,
      totalTeams,
      totalPackages,
      totalTemplates,
      totalAssignments,
      totalNotifications,
      totalConversations,

      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,

      recentClients,
      recentTasks,
      recentUsers,
      recentNotifications,

      tasksByPriority,
      tasksByStatus,
      usersByRole,
      clientsByStatus,

      teamsWithMembers,

      tasksCompletedThisWeek,
      tasksCompletedThisMonth,
      clientsAddedThisWeek,
      clientsAddedThisMonth,

      recentActivityLogs,

      totalMessages,
      unreadNotifications,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.team.count(),
      prisma.package.count(),
      prisma.template.count(),
      prisma.assignment.count(),
      prisma.notification.count(),
      prisma.conversation.count(),

      prisma.task.count({ where: { status: "completed" } }),
      prisma.task.count({ where: { status: "pending" } }),
      prisma.task.count({ where: { status: "in_progress" } }),
      prisma.task.count({ where: { status: "overdue" } }),

      prisma.client.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          package: true,
          accountManager: true,
          _count: { select: { tasks: true } },
        },
      }),

      prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          assignedTo: true,
          category: true,
        },
      }),

      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          role: true,
          _count: { select: { assignedTasks: true } },
        },
      }),

      prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: true, task: true },
      }),

      prisma.task.groupBy({ by: ["priority"], _count: { priority: true } }),
      prisma.task.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { roleId: true },
        where: { roleId: { not: null } },
      }),
      prisma.client.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { status: { not: null } },
      }),

      prisma.team.findMany({
        include: {
          clientTeamMembers: { include: { agent: true, client: true } },
          templateTeamMembers: { include: { agent: true, template: true } },
        },
      }),

      prisma.task.count({
        where: {
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.task.count({
        where: {
          completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.client.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.client.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      prisma.activityLog.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        include: { user: true },
      }),

      prisma.chatMessage.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const clientGrowthRate =
      clientsAddedThisWeek > 0
        ? Math.round(
            ((clientsAddedThisMonth - clientsAddedThisWeek) /
              clientsAddedThisWeek) *
              100
          )
        : 0;

    const teamEfficiency =
      teamsWithMembers.length > 0
        ? Math.round(tasksCompletedThisMonth / teamsWithMembers.length)
        : 0;

    const processedTeams = teamsWithMembers.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      totalMembers:
        team.clientTeamMembers.length + team.templateTeamMembers.length,
      clientMembers: team.clientTeamMembers.length,
      templateMembers: team.templateTeamMembers.length,
      members: [
        ...team.clientTeamMembers.map((member) => ({
          id: member.agentId,
          name: member.agent.name,
          role: member.role,
          type: "client" as const,
        })),
        ...team.templateTeamMembers.map((member) => ({
          id: member.agentId,
          name: member.agent.name,
          role: member.role,
          type: "template" as const,
        })),
      ],
    }));

    const roleDistribution = await Promise.all(
      usersByRole.map(async (group) => {
        const role = await prisma.role.findUnique({
          where: { id: group.roleId || "" },
        });
        return { role: role?.name || "unknown", count: group._count.roleId };
      })
    );

    const completedTasksWithDuration = await prisma.task.findMany({
      where: { status: "completed", actualDurationMinutes: { not: null } },
      select: { actualDurationMinutes: true },
    });

    const avgCompletionTime =
      completedTasksWithDuration.length > 0
        ? Math.round(
            completedTasksWithDuration.reduce(
              (sum, t) => sum + (t.actualDurationMinutes || 0),
              0
            ) / completedTasksWithDuration.length
          )
        : 0;

    const performanceRatings = await prisma.task.groupBy({
      by: ["performanceRating"],
      _count: { performanceRating: true },
      where: { performanceRating: { not: null } },
    });

    // ---------- NEW: Category details ----------
    // Pull all categories first
    const allCategories = await prisma.taskCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    });

    // Build details per category (parallelized)
    const categories = await Promise.all(
      allCategories.map(async (cat) => {
        // totals
        const [totalInCat, overdueInCat] = await Promise.all([
          prisma.task.count({ where: { categoryId: cat.id } }),
          prisma.task.count({
            where: { categoryId: cat.id, status: "overdue" },
          }),
        ]);

        // breakdowns
        const [byStatus, byPriority, perfDist] = await Promise.all([
          prisma.task.groupBy({
            by: ["status"],
            where: { categoryId: cat.id },
            _count: { status: true },
          }),
          prisma.task.groupBy({
            by: ["priority"],
            where: { categoryId: cat.id },
            _count: { priority: true },
          }),
          prisma.task.groupBy({
            by: ["performanceRating"],
            where: { categoryId: cat.id, performanceRating: { not: null } },
            _count: { performanceRating: true },
          }),
        ]);

        // average completion time for this category
        const withDur = await prisma.task.findMany({
          where: {
            categoryId: cat.id,
            status: "completed",
            actualDurationMinutes: { not: null },
          },
          select: { actualDurationMinutes: true },
        });

        const avgCompletionMins =
          withDur.length > 0
            ? Math.round(
                withDur.reduce(
                  (s, t) => s + (t.actualDurationMinutes || 0),
                  0
                ) / withDur.length
              )
            : 0;

        // last 5 tasks (lightweight joins)
        const recent = await prisma.task.findMany({
          where: { categoryId: cat.id },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            dueDate: true,
            completedAt: true,
            createdAt: true,
            client: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
            templateSiteAsset: {
              select: { id: true, type: true, name: true, url: true },
            },
          },
        });

        // completion rate for this category
        const completedInCat =
          byStatus.find((s) => s.status === "completed")?._count.status || 0;
        const completionRate =
          totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0;

        return {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          totals: {
            total: totalInCat,
            overdue: overdueInCat,
            completed: completedInCat,
            completionRate,
            avgCompletionTimeMinutes: avgCompletionMins,
          },
          breakdowns: {
            byStatus: byStatus.map((g) => ({
              status: g.status,
              count: g._count.status,
            })),
            byPriority: byPriority.map((g) => ({
              priority: g.priority,
              count: g._count.priority,
            })),
            performanceRatings: perfDist.map((g) => ({
              rating: g.performanceRating,
              count: g._count.performanceRating,
            })),
          },
          recentTasks: recent.map((t) => ({
            id: t.id,
            name: t.name,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            completedAt: t.completedAt,
            createdAt: t.createdAt,
            client: t.client ? { id: t.client.id, name: t.client.name } : null,
            assignedTo: t.assignedTo
              ? { id: t.assignedTo.id, name: t.assignedTo.name }
              : null,
            siteAsset: t.templateSiteAsset
              ? {
                  id: t.templateSiteAsset.id,
                  type: t.templateSiteAsset.type,
                  name: t.templateSiteAsset.name,
                  url: t.templateSiteAsset.url,
                }
              : null,
          })),
        };
      })
    );

    // ---------- Assemble final payload ----------
    const dashboardStats = {
      overview: {
        totalClients,
        totalTasks,
        totalUsers,
        totalTeams,
        totalPackages,
        totalTemplates,
        totalAssignments,
        totalNotifications,
        totalConversations,
        totalMessages,
        unreadNotifications,
      },

      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: taskCompletionRate,
        avgCompletionTime: avgCompletionTime,
        byPriority: tasksByPriority.map((g) => ({
          priority: g.priority,
          count: g._count.priority,
        })),
        byStatus: tasksByStatus.map((g) => ({
          status: g.status,
          count: g._count.status,
        })),
        performanceRatings: performanceRatings.map((g) => ({
          rating: g.performanceRating,
          count: g._count.performanceRating,
        })),
      },

      clients: {
        total: totalClients,
        growthRate: clientGrowthRate,
        addedThisWeek: clientsAddedThisWeek,
        addedThisMonth: clientsAddedThisMonth,
        byStatus: clientsByStatus.map((g) => ({
          status: g.status || "unknown",
          count: g._count.status,
        })),
      },

      teams: {
        total: totalTeams,
        efficiency: teamEfficiency,
        data: processedTeams,
      },

      users: {
        total: totalUsers,
        roleDistribution,
      },

      timeMetrics: {
        tasksCompletedThisWeek,
        tasksCompletedThisMonth,
        clientsAddedThisWeek,
        clientsAddedThisMonth,
      },

      recent: {
        clients: recentClients.map((client) => ({
          id: client.id,
          name: client.name,
          company: client.company,
          status: client.status,
          progress: client.progress,
          packageName: client.package?.name,
          accountManager: client.accountManager?.name,
          taskCount: client._count.tasks,
          createdAt: client.createdAt,
        })),
        tasks: recentTasks.map((task) => ({
          id: task.id,
          name: task.name,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          clientName: task.client?.name,
          assignedToName: task.assignedTo?.name,
          categoryName: task.category?.name,
          completedAt: task.completedAt,
          createdAt: task.createdAt,
        })),
        users: recentUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          roleName: user.role?.name,
          status: user.status,
          taskCount: user._count.assignedTasks,
          createdAt: user.createdAt,
        })),
        notifications: recentNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          message: n.message,
          isRead: n.isRead,
          userName: n.user.name,
          taskName: n.task?.name,
          createdAt: n.createdAt,
        })),
        activities: recentActivityLogs.map((log) => ({
          id: log.id,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          userName: log.user?.name,
          timestamp: log.timestamp,
          details: log.details,
        })),
      },

      // NEW block added
      categories,
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
