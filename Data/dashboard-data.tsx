// Types for dashboard data
export interface RecentActivity {
  id: number;
  user: string;
  action: string;
  item: string;
  time: string;
  avatar: string;
}

export interface TopPerformer {
  id: number;
  name: string;
  role: string;
  completed: number;
  avatar: string;
}

export interface ProjectStatus {
  completed: number;
  inProgress: number;
  pending: number;
}

export interface TeamWorkload {
  name: string;
  tasks: number;
}

export interface TeamEfficiency {
  team: string;
  days: number;
}

export interface ClientSatisfaction {
  service: string;
  rating: number;
}

export interface RevenuePackage {
  name: string;
  value: number;
  color: string;
}

export interface WeeklyTaskStatus {
  week: string;
  completed: number;
  inProgress: number;
  pending: number;
}

// Mock data for recent activity
export const recentActivity: RecentActivity[] = [
  {
    id: 1,
    user: "Alice Johnson",
    action: "Completed task",
    item: "Facebook Campaign",
    time: "2 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 2,
    user: "Bob Smith",
    action: "Assigned to",
    item: "Website Redesign",
    time: "3 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 3,
    user: "Charlie Davis",
    action: "Created template",
    item: "Email Newsletter",
    time: "5 hours ago",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 4,
    user: "Diana Miller",
    action: "Updated status",
    item: "Social Media Calendar",
    time: "Yesterday",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: 5,
    user: "Edward Wilson",
    action: "Added client",
    item: "Birds Of Eden Corporation",
    time: "Yesterday",
    avatar: "/placeholder.svg?height=32&width=32",
  },
];

// Mock data for top performers
export const topPerformers: TopPerformer[] = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "Social Media Manager",
    completed: 37,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 2,
    name: "Frank Thomas",
    role: "Graphic Designer",
    completed: 32,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 3,
    name: "Diana Miller",
    role: "Content Creator",
    completed: 29,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 4,
    name: "Henry Clark",
    role: "Video Editor",
    completed: 26,
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

// Project status data
export const projectStatusData: ProjectStatus = {
  completed: 45,
  inProgress: 30,
  pending: 25,
};

// Team workload data
export const teamWorkloadData: TeamWorkload[] = [
  { name: "Social Team", tasks: 78 },
  { name: "Design Team", tasks: 65 },
  { name: "Content Team", tasks: 83 },
  { name: "Development", tasks: 47 },
  { name: "Marketing", tasks: 53 },
];

// Team efficiency data
export const teamEfficiencyData: TeamEfficiency[] = [
  { team: "Social", days: 2.3 },
  { team: "Design", days: 3.7 },
  { team: "Content", days: 2.8 },
  { team: "Development", days: 4.2 },
  { team: "Marketing", days: 3.1 },
];

// Client satisfaction data
export const clientSatisfactionData: ClientSatisfaction[] = [
  { service: "Social Media", rating: 4.7 },
  { service: "Web Design", rating: 4.5 },
  { service: "Content", rating: 4.8 },
  { service: "SEO", rating: 4.3 },
  { service: "Branding", rating: 4.6 },
];

// Revenue by package data
export const revenuePackageData: RevenuePackage[] = [
  { name: "DFP90", value: 25, color: "bg-blue-500" },
  { name: "DFP120", value: 15, color: "bg-emerald-500" },
  { name: "DFP240", value: 20, color: "bg-amber-500" },
  { name: "DFP270", value: 20, color: "bg-indigo-500" },
  { name: "DFP360", value: 20, color: "bg-pink-500" },
];

// Weekly task status data
export const weeklyTaskStatusData: WeeklyTaskStatus[] = [
  { week: "Week 6", completed: 71, inProgress: 19, pending: 15 },
  { week: "Week 5", completed: 58, inProgress: 17, pending: 20 },
  { week: "Week 4", completed: 63, inProgress: 21, pending: 18 },
];
