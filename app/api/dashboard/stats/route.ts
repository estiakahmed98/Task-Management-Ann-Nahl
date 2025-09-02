import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get all the core statistics in parallel
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
      
      // Task statistics
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      
      // Recent data
      recentClients,
      recentTasks,
      recentUsers,
      recentNotifications,
      
      // Performance data
      tasksByPriority,
      tasksByStatus,
      usersByRole,
      clientsByStatus,
      
      // Team performance
      teamsWithMembers,
      
      // Time-based analytics
      tasksCompletedThisWeek,
      tasksCompletedThisMonth,
      clientsAddedThisWeek,
      clientsAddedThisMonth,
      
      // Activity data
      recentActivityLogs,
      
      // Chat statistics
      totalMessages,
      unreadNotifications,
      
    ] = await Promise.all([
      // Core counts
      prisma.client.count(),
      prisma.task.count(),
      prisma.user.count(),
      prisma.team.count(),
      prisma.package.count(),
      prisma.template.count(),
      prisma.assignment.count(),
      prisma.notification.count(),
      prisma.conversation.count(),
      
      // Task status counts
      prisma.task.count({ where: { status: "completed" } }),
      prisma.task.count({ where: { status: "pending" } }),
      prisma.task.count({ where: { status: "in_progress" } }),
      prisma.task.count({ where: { status: "overdue" } }),
      
      // Recent data (last 10 items)
      prisma.client.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          package: true,
          accountManager: true,
          _count: {
            select: { tasks: true }
          }
        }
      }),
      
      prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          client: true,
          assignedTo: true,
          category: true
        }
      }),
      
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          role: true,
          _count: {
            select: { assignedTasks: true }
          }
        }
      }),
      
      prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          task: true
        }
      }),
      
      // Analytics data
      prisma.task.groupBy({
        by: ["priority"],
        _count: { priority: true }
      }),
      
      prisma.task.groupBy({
        by: ["status"],
        _count: { status: true }
      }),
      
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { roleId: true },
        where: { roleId: { not: null } }
      }),
      
      prisma.client.groupBy({
        by: ["status"],
        _count: { status: true },
        where: { status: { not: null } }
      }),
      
      // Team data with member counts
      prisma.team.findMany({
        include: {
          clientTeamMembers: {
            include: {
              agent: true,
              client: true
            }
          },
          templateTeamMembers: {
            include: {
              agent: true,
              template: true
            }
          }
        }
      }),
      
      // Time-based analytics
      prisma.task.count({
        where: {
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      
      prisma.task.count({
        where: {
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      
      prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      
      prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      
      // Activity logs
      prisma.activityLog.findMany({
        take: 20,
        orderBy: { timestamp: "desc" },
        include: {
          user: true
        }
      }),
      
      // Chat statistics
      prisma.chatMessage.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    // Calculate performance metrics
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const clientGrowthRate = clientsAddedThisMonth > 0 ? Math.round(((clientsAddedThisMonth - clientsAddedThisWeek) / clientsAddedThisWeek) * 100) : 0;
    const teamEfficiency = teamsWithMembers.length > 0 ? Math.round(tasksCompletedThisMonth / teamsWithMembers.length) : 0;

    // Process team data
    const processedTeams = teamsWithMembers.map(team => ({
      id: team.id,
      name: team.name,
      description: team.description,
      totalMembers: team.clientTeamMembers.length + team.templateTeamMembers.length,
      clientMembers: team.clientTeamMembers.length,
      templateMembers: team.templateTeamMembers.length,
      members: [
        ...team.clientTeamMembers.map(member => ({
          id: member.agentId,
          name: member.agent.name,
          role: member.role,
          type: 'client'
        })),
        ...team.templateTeamMembers.map(member => ({
          id: member.agentId,
          name: member.agent.name,
          role: member.role,
          type: 'template'
        }))
      ]
    }));

    // Process role distribution
    const roleDistribution = await Promise.all(
      usersByRole.map(async (group) => {
        const role = await prisma.role.findUnique({
          where: { id: group.roleId || "" }
        });
        return {
          role: role?.name || "unknown",
          count: group._count.roleId
        };
      })
    );

    // Calculate average task completion time
    const completedTasksWithDuration = await prisma.task.findMany({
      where: {
        status: "completed",
        actualDurationMinutes: { not: null }
      },
      select: { actualDurationMinutes: true }
    });

    const avgCompletionTime = completedTasksWithDuration.length > 0
      ? Math.round(
          completedTasksWithDuration.reduce((sum, task) => sum + (task.actualDurationMinutes || 0), 0) / 
          completedTasksWithDuration.length
        )
      : 0;

    // Performance ratings distribution
    const performanceRatings = await prisma.task.groupBy({
      by: ["performanceRating"],
      _count: { performanceRating: true },
      where: { performanceRating: { not: null } }
    });

    const dashboardStats = {
      // Core metrics
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
        unreadNotifications
      },
      
      // Task analytics
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: taskCompletionRate,
        avgCompletionTime,
        byPriority: tasksByPriority.map(group => ({
          priority: group.priority,
          count: group._count.priority
        })),
        byStatus: tasksByStatus.map(group => ({
          status: group.status,
          count: group._count.status
        })),
        performanceRatings: performanceRatings.map(group => ({
          rating: group.performanceRating,
          count: group._count.performanceRating
        }))
      },
      
      // Client analytics
      clients: {
        total: totalClients,
        growthRate: clientGrowthRate,
        addedThisWeek: clientsAddedThisWeek,
        addedThisMonth: clientsAddedThisMonth,
        byStatus: clientsByStatus.map(group => ({
          status: group.status || "unknown",
          count: group._count.status
        }))
      },
      
      // Team analytics
      teams: {
        total: totalTeams,
        efficiency: teamEfficiency,
        data: processedTeams
      },
      
      // User analytics
      users: {
        total: totalUsers,
        roleDistribution
      },
      
      // Time-based metrics
      timeMetrics: {
        tasksCompletedThisWeek,
        tasksCompletedThisMonth,
        clientsAddedThisWeek,
        clientsAddedThisMonth
      },
      
      // Recent activity
      recent: {
        clients: recentClients.map(client => ({
          id: client.id,
          name: client.name,
          company: client.company,
          status: client.status,
          progress: client.progress,
          packageName: client.package?.name,
          accountManager: client.accountManager?.name,
          taskCount: client._count.tasks,
          createdAt: client.createdAt
        })),
        
        tasks: recentTasks.map(task => ({
          id: task.id,
          name: task.name,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          clientName: task.client?.name,
          assignedToName: task.assignedTo?.name,
          categoryName: task.category?.name,
          completedAt: task.completedAt,
          createdAt: task.createdAt
        })),
        
        users: recentUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          roleName: user.role?.name,
          status: user.status,
          taskCount: user._count.assignedTasks,
          createdAt: user.createdAt
        })),
        
        notifications: recentNotifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          message: notification.message,
          isRead: notification.isRead,
          userName: notification.user.name,
          taskName: notification.task?.name,
          createdAt: notification.createdAt
        })),
        
        activities: recentActivityLogs.map(log => ({
          id: log.id,
          entityType: log.entityType,
          entityId: log.entityId,
          action: log.action,
          userName: log.user?.name,
          timestamp: log.timestamp,
          details: log.details
        }))
      }
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