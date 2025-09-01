// Type definitions for templates
export type TemplateStatus = "pending" | "in-progress" | "completed";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  name: string;
  status: TemplateStatus;
}

export interface TaskCategories {
  social: Task[];
  content: Task[];
  design: Task[];
}

export interface Template {
  id: string;
  clientName: string;
  companyName: string;
  clientAvatar: string;
  status: TemplateStatus;
  teamMembers: TeamMember[];
  tasks: TaskCategories;
}
