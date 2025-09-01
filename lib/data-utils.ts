// Utility functions for generating mock data

// Generate a random date between start and end dates
export const randomDate = (start: Date, end: Date): string => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  ).toLocaleDateString();
};

// Generate random tasks
export const generateTasks = (
  count: number,
  statusDistribution = { completed: 0.3, inProgress: 0.3, pending: 0.4 }
) => {
  const tasks = [];
  const statuses = ["completed", "in-progress", "pending"];
  const taskNames = [
    "Website Redesign",
    "SEO Optimization",
    "Content Creation",
    "Mobile App Development",
    "API Integration",
    "Database Migration",
    "Security Audit",
    "Performance Optimization",
    "User Testing",
    "Analytics Setup",
    "Email Campaign",
    "Social Media Strategy",
    "Logo Design",
    "Brand Guidelines",
    "Market Research",
    "Competitor Analysis",
    "Product Launch",
    "Customer Support",
    "Training Materials",
    "Documentation",
  ];

  for (let i = 0; i < count; i++) {
    const randomStatus = Math.random();
    let status;
    if (randomStatus < statusDistribution.completed) {
      status = statuses[0];
    } else if (
      randomStatus <
      statusDistribution.completed + statusDistribution.inProgress
    ) {
      status = statuses[1];
    } else {
      status = statuses[2];
    }

    tasks.push({
      id: `TSK${String(i + 1).padStart(3, "0")}`,
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      status,
    });
  }

  return tasks;
};

// Generate client data
export const generateClient = (
  id: string,
  name: string,
  company: string,
  position: string,
  package_: string,
  statusDistribution: { completed: number; inProgress: number; pending: number }
) => {
  const taskList = generateTasks(
    Math.floor(Math.random() * 8) + 5,
    statusDistribution
  );
  const completed = taskList.filter((t) => t.status === "completed").length;
  const inProgress = taskList.filter((t) => t.status === "in-progress").length;
  const pending = taskList.filter((t) => t.status === "pending").length;
  const total = taskList.length;

  let status;
  if (completed === total) {
    status = "completed";
  } else if (pending > inProgress) {
    status = "pending";
  } else {
    status = "in-progress";
  }

  const progress = Math.round((completed / total) * 100);

  const statusIndicators = ["new-comments", "issues-reported", "no-issues"];
  let statusIndicator;
  if (status === "completed") {
    statusIndicator = "no-issues";
  } else if (status === "pending") {
    statusIndicator = "new-comments";
  } else {
    statusIndicator = statusIndicators[Math.floor(Math.random() * 3)];
  }

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  return {
    id,
    name,
    company,
    position,
    package: package_,
    status,
    progress,
    tasks: {
      total,
      completed,
      inProgress,
      pending,
    },
    timeline: {
      startDate: randomDate(sixMonthsAgo, now),
      dueDate: randomDate(now, sixMonthsFromNow),
      teamSize: Math.floor(Math.random() * 4) + 2,
    },
    statusIndicator,
    taskList,
    activityData: Array.from({ length: 7 }, (_, i) => ({
      day: i,
      tasks: Math.floor(Math.random() * 5),
    })),
  };
};

// Generate agents data
export const generateAgents = () => [
  {
    id: "AGT001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1 (555) 123-4567",
    department: "Web Development",
    status: "partial", // free, booked, partial
    totalSlots: 15,
    usedSlots: 9,
    freeSlots: 6,
    joinDate: "01/15/2022",
    performance: 87,
    clients: [
      generateClient(
        "CLT001",
        "Alex Johnson",
        "Birds Of Eden Corporation",
        "Marketing Director",
        "DFP90",
        {
          completed: 0.2,
          inProgress: 0.2,
          pending: 0.6,
        }
      ),
      generateClient(
        "CLT002",
        "Emma Williams",
        "Sunrise Technologies",
        "Product Manager",
        "DFP120",
        {
          completed: 0.4,
          inProgress: 0.3,
          pending: 0.3,
        }
      ),
      generateClient(
        "CLT003",
        "Michael Brown",
        "Global Retail Solutions",
        "Marketing VP",
        "DFP90",
        {
          completed: 0.7,
          inProgress: 0.2,
          pending: 0.1,
        }
      ),
    ],
  },
  {
    id: "AGT002",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 234-5678",
    department: "Digital Marketing",
    status: "booked",
    totalSlots: 12,
    usedSlots: 12,
    freeSlots: 0,
    joinDate: "03/22/2021",
    performance: 92,
    clients: [
      generateClient(
        "CLT004",
        "James Wilson",
        "TechStart Inc.",
        "CEO",
        "DFP150",
        {
          completed: 0.5,
          inProgress: 0.3,
          pending: 0.2,
        }
      ),
      generateClient(
        "CLT005",
        "Robert Garcia",
        "Digital Solutions Ltd",
        "CTO",
        "DFP180",
        {
          completed: 0.3,
          inProgress: 0.4,
          pending: 0.3,
        }
      ),
      generateClient(
        "CLT006",
        "Olivia Martinez",
        "Creative Minds Agency",
        "Creative Director",
        "DFP120",
        {
          completed: 0.6,
          inProgress: 0.2,
          pending: 0.2,
        }
      ),
      generateClient(
        "CLT007",
        "William Taylor",
        "Innovative Systems",
        "Operations Manager",
        "DFP90",
        {
          completed: 0.4,
          inProgress: 0.4,
          pending: 0.2,
        }
      ),
    ],
  },
  {
    id: "AGT003",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    phone: "+1 (555) 345-6789",
    department: "Mobile Development",
    status: "partial",
    totalSlots: 10,
    usedSlots: 7,
    freeSlots: 3,
    joinDate: "06/10/2022",
    performance: 79,
    clients: [
      generateClient(
        "CLT008",
        "Sophia Lee",
        "Health & Wellness Co",
        "Brand Director",
        "DFP90",
        {
          completed: 0.8,
          inProgress: 0.1,
          pending: 0.1,
        }
      ),
      generateClient(
        "CLT009",
        "Daniel Kim",
        "Future Finance",
        "Finance Director",
        "DFP120",
        {
          completed: 0.2,
          inProgress: 0.5,
          pending: 0.3,
        }
      ),
      generateClient(
        "CLT010",
        "Isabella Rodriguez",
        "Global Education",
        "Program Manager",
        "DFP150",
        {
          completed: 0.1,
          inProgress: 0.3,
          pending: 0.6,
        }
      ),
    ],
  },
  {
    id: "AGT004",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    phone: "+1 (555) 456-7890",
    department: "UI/UX Design",
    status: "partial",
    totalSlots: 8,
    usedSlots: 5,
    freeSlots: 3,
    joinDate: "09/05/2021",
    performance: 95,
    clients: [
      generateClient(
        "CLT011",
        "Jennifer Wilson",
        "Eco Friendly Products",
        "Product Manager",
        "DFP120",
        {
          completed: 0.1,
          inProgress: 0.2,
          pending: 0.7,
        }
      ),
      generateClient(
        "CLT012",
        "Matthew Davis",
        "Smart Home Solutions",
        "Technical Lead",
        "DFP90",
        {
          completed: 0.5,
          inProgress: 0.3,
          pending: 0.2,
        }
      ),
      generateClient(
        "CLT013",
        "Ava Thompson",
        "Modern Interiors",
        "Design Director",
        "DFP150",
        {
          completed: 0.4,
          inProgress: 0.4,
          pending: 0.2,
        }
      ),
    ],
  },
  {
    id: "AGT005",
    name: "David Kim",
    email: "david.kim@example.com",
    phone: "+1 (555) 567-8901",
    department: "Content Strategy",
    status: "free",
    totalSlots: 12,
    usedSlots: 0,
    freeSlots: 12,
    joinDate: "11/15/2022",
    performance: 88,
    clients: [],
  },
  {
    id: "AGT006",
    name: "Lisa Wang",
    email: "lisa.wang@example.com",
    phone: "+1 (555) 678-9012",
    department: "E-commerce",
    status: "partial",
    totalSlots: 10,
    usedSlots: 6,
    freeSlots: 4,
    joinDate: "02/28/2021",
    performance: 91,
    clients: [
      generateClient(
        "CLT014",
        "Thomas Anderson",
        "Matrix Technologies",
        "Technical Director",
        "DFP150",
        {
          completed: 0.5,
          inProgress: 0.3,
          pending: 0.2,
        }
      ),
      generateClient(
        "CLT015",
        "Sophia Miller",
        "Fashion Forward",
        "Marketing Manager",
        "DFP90",
        {
          completed: 0.3,
          inProgress: 0.2,
          pending: 0.5,
        }
      ),
      generateClient(
        "CLT016",
        "Ethan Clark",
        "Urban Planning Group",
        "Project Director",
        "DFP120",
        {
          completed: 0.6,
          inProgress: 0.2,
          pending: 0.2,
        }
      ),
    ],
  },
];

// Chart data
export const generateAgentPerformanceData = (agents) => {
  return agents.map((agent) => {
    const completed = agent.clients.reduce(
      (sum, client) => sum + client.tasks.completed,
      0
    );
    const inProgress = agent.clients.reduce(
      (sum, client) => sum + client.tasks.inProgress,
      0
    );
    const pending = agent.clients.reduce(
      (sum, client) => sum + client.tasks.pending,
      0
    );

    return {
      name: agent.name,
      completed,
      inProgress,
      pending,
    };
  });
};

// Department distribution data
export const departmentDistribution = [
  { name: "Web Development", value: 35 },
  { name: "Digital Marketing", value: 25 },
  { name: "Mobile Development", value: 15 },
  { name: "UI/UX Design", value: 15 },
  { name: "Content Strategy", value: 5 },
  { name: "E-commerce", value: 5 },
];

// Weekly task completion data
export const weeklyTaskCompletion = [
  { day: "Mon", tasks: 12 },
  { day: "Tue", tasks: 18 },
  { day: "Wed", tasks: 15 },
  { day: "Thu", tasks: 22 },
  { day: "Fri", tasks: 20 },
  { day: "Sat", tasks: 8 },
  { day: "Sun", tasks: 5 },
];

// Helper functions
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);
};

// Get all tasks for an agent
export const getAllTasks = (agent, reassignedTasks = {}) => {
  return agent.clients.flatMap((client) =>
    client.taskList.map((task) => ({
      ...task,
      clientName: client.name,
      clientId: client.id,
      reassigned: reassignedTasks[task.id] || false,
      newAgent: reassignedTasks[task.id]
        ? reassignedTasks[task.id].agentName
        : null,
    }))
  );
};

// Get all clients across all agents
export const getAllClients = (agents) => {
  return agents.flatMap((agent) =>
    agent.clients.map((client) => ({
      ...client,
      agentName: agent.name,
      agentId: agent.id,
    }))
  );
};

// Calculate agent statistics
export const calculateAgentStats = (agent) => {
  const totalTasks = agent.clients.reduce(
    (sum, client) => sum + client.tasks.total,
    0
  );
  const completedTasks = agent.clients.reduce(
    (sum, client) => sum + client.tasks.completed,
    0
  );
  const pendingTasks = agent.clients.reduce(
    (sum, client) => sum + client.tasks.pending,
    0
  );
  const inProgressTasks = agent.clients.reduce(
    (sum, client) => sum + client.tasks.inProgress,
    0
  );

  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    completionRate,
  };
};
