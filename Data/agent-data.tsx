// Agent data types
export interface AgentData {
  id: number;
  name: string;
  avatar: string;
  designation: string;
  email: string;
  joinDate: string;
  department: string;
  team: string;
  manager: string;

  // Performance metrics
  performanceScore: number;
  performanceTrend: "up" | "down" | "stable";
  taskCompletionRate: number;
  qualityScore: number;
  clientSatisfaction: number;

  // Time tracking
  totalHoursWorked: number;
  hoursThisMonth: number;
  hoursLastMonth: number;
  averageHoursPerDay: number;
  overtimeHours: number;

  // Task statistics
  tasksCompleted: number;
  tasksOnTime: number;
  tasksEarly: number;
  tasksLate: number;
  averageTaskCompletionTime: string;

  // Project statistics
  projectsCompleted: number;
  activeProjects: number;
  averageProjectCompletionTime: string;

  // Scoring
  onTimeScore: number;
  earlyBonus: number;
  latePenalty: number;
  totalScore: number;

  // Monthly performance
  monthlyPerformance: { month: string; score: number }[];

  // Task categories
  taskCategories: { category: string; count: number; percentage: number }[];

  // Client distribution
  clientDistribution: { client: string; count: number; percentage: number }[];

  // Recent achievements
  recentAchievements: {
    id: number;
    title: string;
    description: string;
    date: string;
  }[];

  // Improvement areas
  improvementAreas: { id: number; area: string; score: number }[];
}

export interface TeamAverages {
  performanceScore: number;
  taskCompletionRate: number;
  qualityScore: number;
  clientSatisfaction: number;
  tasksCompleted: number;
  projectsCompleted: number;
  totalScore: number;
}

// Sample agent data
export const agentData: AgentData = {
  id: 7,
  name: "Tom Holland",
  avatar: "/placeholder.svg?height=60&width=60",
  designation: "Social Media Manager",
  email: "tom.holland@example.com",
  joinDate: "2024-06-15",
  department: "Marketing",
  team: "Social Media",
  manager: "Sarah Johnson",

  // Performance metrics
  performanceScore: 87,
  performanceTrend: "up",
  taskCompletionRate: 92,
  qualityScore: 89,
  clientSatisfaction: 4.7,

  // Time tracking
  totalHoursWorked: 1842,
  hoursThisMonth: 142,
  hoursLastMonth: 168,
  averageHoursPerDay: 7.8,
  overtimeHours: 12,

  // Task statistics
  tasksCompleted: 342,
  tasksOnTime: 315,
  tasksEarly: 98,
  tasksLate: 27,
  averageTaskCompletionTime: "2.3 days",

  // Project statistics
  projectsCompleted: 28,
  activeProjects: 4,
  averageProjectCompletionTime: "32 days",

  // Scoring
  onTimeScore: 3150, // 315 tasks × 10 points
  earlyBonus: 1960, // 98 tasks × 20 points
  latePenalty: 810, // 27 tasks × -30 points (assuming average 3 days late)
  totalScore: 4300, // onTimeScore + earlyBonus + latePenalty

  // Monthly performance
  monthlyPerformance: [
    { month: "Jan", score: 78 },
    { month: "Feb", score: 82 },
    { month: "Mar", score: 79 },
    { month: "Apr", score: 85 },
    { month: "May", score: 83 },
    { month: "Jun", score: 87 },
    { month: "Jul", score: 90 },
    { month: "Aug", score: 88 },
    { month: "Sep", score: 91 },
    { month: "Oct", score: 87 },
    { month: "Nov", score: 89 },
    { month: "Dec", score: 92 },
  ],

  // Task categories
  taskCategories: [
    { category: "Social Media Profiles", count: 112, percentage: 33 },
    { category: "Content Creation", count: 86, percentage: 25 },
    { category: "Engagement", count: 65, percentage: 19 },
    { category: "Analytics", count: 45, percentage: 13 },
    { category: "Strategy", count: 34, percentage: 10 },
  ],

  // Client distribution
  clientDistribution: [
    { client: "Birds Of Eden", count: 8, percentage: 29 },
    { client: "Birds Of Eden Inc", count: 6, percentage: 21 },
    { client: "Birds Of Eden", count: 5, percentage: 18 },
    { client: "Birds Of Eden Retail", count: 4, percentage: 14 },
    { client: "Others", count: 5, percentage: 18 },
  ],

  // Recent achievements
  recentAchievements: [
    {
      id: 1,
      title: "Top Performer",
      description: "Highest task completion rate in Q3",
      date: "2025-09-30",
    },
    {
      id: 2,
      title: "Client Excellence",
      description: "Perfect client satisfaction score for TechStart Inc",
      date: "2025-08-15",
    },
    {
      id: 3,
      title: "Efficiency Award",
      description: "Completed 15 tasks ahead of schedule in July",
      date: "2025-07-31",
    },
  ],

  // Improvement areas
  improvementAreas: [
    { id: 1, area: "Analytics Reporting", score: 72 },
    { id: 2, area: "Content Strategy", score: 78 },
    { id: 3, area: "Team Collaboration", score: 81 },
  ],
};

// Team averages for comparison
export const teamAverages: TeamAverages = {
  performanceScore: 82,
  taskCompletionRate: 88,
  qualityScore: 85,
  clientSatisfaction: 4.3,
  tasksCompleted: 310,
  projectsCompleted: 24,
  totalScore: 3800,
};
