export type Client = {
  id: string;
  name: string;
  company: string;
  avatar: string;
  status: string;
  packageId: string;
  progress: number;
  package: {
    id: string;
    name: string;
  };
};

export type Agent = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  category: string;
  role: {
    name: string;
  };
  phone: string;
  address: string;
  bio: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
};

export type Task = {
  id: string;
  name: string;
  priority: string;
  dueDate: string;
  status: string;
  idealDurationMinutes: number;
  notes?: string;
  templateSiteAsset: {
    id: number;
    name: string;
    type: string;
    description: string;
    url: string;
    isRequired: boolean;
  };
  assignedTo: Agent | null;
  client: {
    id: string;
    name: string;
    company: string;
  };
};

export type TaskAssignment = {
  taskId: string;
  agentId: string;
};

export type CategorizedTasks = {
  social_site: Task[];
  web2_site: Task[];
  other_asset: Task[];
};
