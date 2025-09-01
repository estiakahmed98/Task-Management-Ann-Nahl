// This file contains utility functions for managing data persistence

import fs from "fs"
import path from "path"

// Define the data directory path
const DATA_DIR = path.join(process.cwd(), "data")

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Template data file path
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json")
// Client assignments file path
const ASSIGNMENTS_FILE = path.join(DATA_DIR, "assignments.json")
// Clients data file path
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json")

// Initialize files if they don't exist
if (!fs.existsSync(TEMPLATES_FILE)) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify([], null, 2))
}

if (!fs.existsSync(ASSIGNMENTS_FILE)) {
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify([], null, 2))
}

if (!fs.existsSync(CLIENTS_FILE)) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify([], null, 2))
}

// Template interface
export interface Template {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  isDefault: boolean
  packageId: string
  packageType: string
  status: "pending" | "in-progress" | "completed"
  progress: number
  startDate: string
  dueDate: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  hasNewComments: boolean
  hasIssues: boolean
  teamMembers: any[]
  socialSites: {
    name: string
    url: string
    isRequired: boolean
  }[]
  web2Sites: {
    name: string
    url: string
    isRequired: boolean
  }[]
  additionalAssets: {
    name: string
    description?: string
    isRequired: boolean
  }[]
}

// Client interface
export interface Client {
  id: string
  name: string
  email: string
  company: string
  avatar: string
  status: "active" | "inactive" | "pending"
}

// Assignment interface
export interface Assignment {
  id: string
  templateId: string
  clientId: string
  assignedAt: string
  status: "active" | "completed" | "cancelled"
}

// Get all templates
export async function getTemplates(): Promise<Template[]> {
  try {
    const data = fs.readFileSync(TEMPLATES_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading templates:", error)
    return []
  }
}

// Get templates by package ID
export async function getTemplatesByPackage(packageId: string): Promise<Template[]> {
  const templates = await getTemplates()
  return templates.filter((template) => template.packageId === packageId)
}

// Get template by ID
export async function getTemplateById(templateId: string): Promise<Template | null> {
  const templates = await getTemplates()
  return templates.find((template) => template.id === templateId) || null
}

// Save a new template
export async function saveTemplate(template: Template): Promise<Template> {
  const templates = await getTemplates()

  // Check if template already exists (for updates)
  const existingIndex = templates.findIndex((t) => t.id === template.id)

  if (existingIndex >= 0) {
    // Update existing template
    templates[existingIndex] = {
      ...templates[existingIndex],
      ...template,
      updatedAt: new Date().toISOString(),
    }
  } else {
    // Add new template
    templates.push({
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // If this template is set as default, update other templates of the same package
  if (template.isDefault) {
    templates.forEach((t, index) => {
      if (t.packageId === template.packageId && t.id !== template.id) {
        templates[index].isDefault = false
      }
    })
  }

  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2))
  return template
}

// Delete a template
export async function deleteTemplate(templateId: string): Promise<boolean> {
  const templates = await getTemplates()
  const filteredTemplates = templates.filter((template) => template.id !== templateId)

  if (filteredTemplates.length === templates.length) {
    return false // Template not found
  }

  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filteredTemplates, null, 2))

  // Also remove any assignments for this template
  const assignments = await getAssignments()
  const filteredAssignments = assignments.filter((assignment) => assignment.templateId !== templateId)
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(filteredAssignments, null, 2))

  return true
}

// Get all clients
export async function getClients(): Promise<Client[]> {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading clients:", error)
    return []
  }
}

// Get client by ID
export async function getClientById(clientId: string): Promise<Client | null> {
  const clients = await getClients()
  return clients.find((client) => client.id === clientId) || null
}

// Save a client
export async function saveClient(client: Client): Promise<Client> {
  const clients = await getClients()

  // Check if client already exists
  const existingIndex = clients.findIndex((c) => c.id === client.id)

  if (existingIndex >= 0) {
    // Update existing client
    clients[existingIndex] = client
  } else {
    // Add new client
    clients.push(client)
  }

  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2))
  return client
}

// Get all assignments
export async function getAssignments(): Promise<Assignment[]> {
  try {
    const data = fs.readFileSync(ASSIGNMENTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading assignments:", error)
    return []
  }
}

// Get assignments by template ID
export async function getAssignmentsByTemplate(templateId: string): Promise<Assignment[]> {
  const assignments = await getAssignments()
  return assignments.filter((assignment) => assignment.templateId === templateId)
}

// Get assignments by client ID
export async function getAssignmentsByClient(clientId: string): Promise<Assignment[]> {
  const assignments = await getAssignments()
  return assignments.filter((assignment) => assignment.clientId === clientId)
}

// Save an assignment
export async function saveAssignment(assignment: Assignment): Promise<Assignment> {
  const assignments = await getAssignments()

  // Check if assignment already exists
  const existingIndex = assignments.findIndex((a) => a.id === assignment.id)

  if (existingIndex >= 0) {
    // Update existing assignment
    assignments[existingIndex] = assignment
  } else {
    // Add new assignment
    assignments.push(assignment)
  }

  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(assignments, null, 2))
  return assignment
}

// Delete an assignment
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  const assignments = await getAssignments()
  const filteredAssignments = assignments.filter((assignment) => assignment.id !== assignmentId)

  if (filteredAssignments.length === assignments.length) {
    return false // Assignment not found
  }

  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(filteredAssignments, null, 2))
  return true
}

// Initialize with mock data if files are empty
export async function initializeMockData() {
  // Check if templates file is empty
  const templatesData = fs.readFileSync(TEMPLATES_FILE, "utf8")
  if (templatesData === "[]") {
    const mockTemplates = generateMockTemplates()
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(mockTemplates, null, 2))
  }

  // Check if clients file is empty
  const clientsData = fs.readFileSync(CLIENTS_FILE, "utf8")
  if (clientsData === "[]") {
    const mockClients = generateMockClients()
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(mockClients, null, 2))
  }

  // Check if assignments file is empty
  const assignmentsData = fs.readFileSync(ASSIGNMENTS_FILE, "utf8")
  if (assignmentsData === "[]") {
    const mockAssignments = generateMockAssignments()
    fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(mockAssignments, null, 2))
  }
}

// Generate mock templates
function generateMockTemplates(): Template[] {
  return [
    {
      id: "template1",
      name: "Standard Marketing Template",
      description: "Default template for marketing clients",
      createdAt: "2025-03-01T00:00:00.000Z",
      updatedAt: "2025-03-15T00:00:00.000Z",
      isDefault: true,
      packageId: "DFP90",
      packageType: "DFP90",
      status: "pending",
      progress: 25,
      startDate: "2025-03-01T00:00:00.000Z",
      dueDate: "2025-06-15T00:00:00.000Z",
      totalTasks: 18,
      completedTasks: 4,
      pendingTasks: 10,
      inProgressTasks: 4,
      hasNewComments: true,
      hasIssues: false,
      teamMembers: [
        {
          id: "tm1",
          name: "Alice Johnson",
          email: "alice@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Social Media Manager",
          team: "social",
          assignedDate: "2025-03-05",
          assignedTasks: 6,
          completedTasks: 2,
          lateTasks: 1,
        },
        {
          id: "tm2",
          name: "Bob Smith",
          email: "bob@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Content Writer",
          team: "content",
          assignedDate: "2025-03-05",
          assignedTasks: 5,
          completedTasks: 1,
          lateTasks: 0,
        },
      ],
      socialSites: [
        { name: "Facebook", url: "https://facebook.com", isRequired: true },
        { name: "Twitter", url: "https://twitter.com", isRequired: true },
        { name: "Instagram", url: "https://instagram.com", isRequired: true },
        { name: "LinkedIn", url: "https://linkedin.com", isRequired: true },
        { name: "Pinterest", url: "https://pinterest.com", isRequired: false },
      ],
      web2Sites: [
        { name: "Medium", url: "https://medium.com", isRequired: true },
        { name: "Blogger", url: "https://blogger.com", isRequired: true },
        { name: "WordPress", url: "https://wordpress.com", isRequired: false },
      ],
      additionalAssets: [
        { name: "Logo Design", description: "Company logo in vector format", isRequired: true },
        { name: "Banner Images", description: "Social media banners", isRequired: true },
        { name: "Brand Guidelines", description: "PDF document", isRequired: false },
      ],
    },
    {
      id: "template2",
      name: "Tech Startup Template",
      description: "Optimized for tech startups and SaaS companies",
      createdAt: "2025-02-15T00:00:00.000Z",
      updatedAt: "2025-02-28T00:00:00.000Z",
      isDefault: false,
      packageId: "DFP120",
      packageType: "DFP120",
      status: "in-progress",
      progress: 60,
      startDate: "2025-02-15T00:00:00.000Z",
      dueDate: "2025-05-30T00:00:00.000Z",
      totalTasks: 15,
      completedTasks: 9,
      pendingTasks: 3,
      inProgressTasks: 3,
      hasNewComments: false,
      hasIssues: true,
      teamMembers: [
        {
          id: "tm4",
          name: "David Wilson",
          email: "david@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Project Manager",
          team: "management",
          assignedDate: "2025-02-20",
          assignedTasks: 4,
          completedTasks: 3,
          lateTasks: 0,
        },
        {
          id: "tm5",
          name: "Emma Brown",
          email: "emma@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Content Strategist",
          team: "content",
          assignedDate: "2025-02-20",
          assignedTasks: 6,
          completedTasks: 4,
          lateTasks: 1,
        },
      ],
      socialSites: [
        { name: "Twitter", url: "https://twitter.com", isRequired: true },
        { name: "LinkedIn", url: "https://linkedin.com", isRequired: true },
        { name: "GitHub", url: "https://github.com", isRequired: true },
        { name: "ProductHunt", url: "https://producthunt.com", isRequired: false },
      ],
      web2Sites: [
        { name: "Medium", url: "https://medium.com", isRequired: true },
        { name: "Dev.to", url: "https://dev.to", isRequired: true },
        { name: "Hacker News", url: "https://news.ycombinator.com", isRequired: false },
      ],
      additionalAssets: [
        { name: "Product Screenshots", description: "High-resolution product screenshots", isRequired: true },
        { name: "Demo Videos", description: "Product demo videos", isRequired: true },
        { name: "Technical Documentation", description: "API documentation", isRequired: false },
      ],
    },
    {
      id: "template3",
      name: "E-commerce Package",
      description: "Complete template for online stores and e-commerce businesses",
      createdAt: "2025-01-10T00:00:00.000Z",
      updatedAt: "2025-02-05T00:00:00.000Z",
      isDefault: false,
      packageId: "DFP180",
      packageType: "DFP180",
      status: "completed",
      progress: 100,
      startDate: "2025-01-10T00:00:00.000Z",
      dueDate: "2025-03-15T00:00:00.000Z",
      totalTasks: 20,
      completedTasks: 20,
      pendingTasks: 0,
      inProgressTasks: 0,
      hasNewComments: false,
      hasIssues: false,
      teamMembers: [
        {
          id: "tm7",
          name: "Grace Lee",
          email: "grace@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Social Media Coordinator",
          team: "social",
          assignedDate: "2025-01-15",
          assignedTasks: 7,
          completedTasks: 7,
          lateTasks: 0,
        },
        {
          id: "tm8",
          name: "Henry Garcia",
          email: "henry@example.com",
          avatar: "/placeholder.svg?height=60&width=60",
          role: "Content Creator",
          team: "content",
          assignedDate: "2025-01-15",
          assignedTasks: 6,
          completedTasks: 6,
          lateTasks: 0,
        },
      ],
      socialSites: [
        { name: "Facebook", url: "https://facebook.com", isRequired: true },
        { name: "Instagram", url: "https://instagram.com", isRequired: true },
        { name: "Pinterest", url: "https://pinterest.com", isRequired: true },
        { name: "TikTok", url: "https://tiktok.com", isRequired: true },
        { name: "YouTube", url: "https://youtube.com", isRequired: true },
      ],
      web2Sites: [
        { name: "Shopify Blog", url: "https://shopify.com/blog", isRequired: true },
        { name: "Medium", url: "https://medium.com", isRequired: true },
        { name: "WordPress", url: "https://wordpress.com", isRequired: true },
      ],
      additionalAssets: [
        { name: "Product Photos", description: "High-quality product photography", isRequired: true },
        { name: "Brand Style Guide", description: "Complete brand guidelines", isRequired: true },
        { name: "Email Templates", description: "Marketing email templates", isRequired: true },
      ],
    },
  ]
}

// Generate mock clients
function generateMockClients(): Client[] {
  return [
    {
      id: "client1",
      name: "John Smith",
      email: "john@example.com",
      company: "Birds Of Eden Corporation",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
    },
    {
      id: "client2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      company: "TechStart Inc.",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
    },
    {
      id: "client3",
      name: "Michael Brown",
      email: "michael@example.com",
      company: "Global Retail Solutions",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "inactive",
    },
    {
      id: "client4",
      name: "Jennifer Wilson",
      email: "jennifer@example.com",
      company: "Eco Friendly Products",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "pending",
    },
    {
      id: "client5",
      name: "Robert Garcia",
      email: "robert@example.com",
      company: "Digital Solutions Ltd",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
    },
    {
      id: "client6",
      name: "Emily Davis",
      email: "emily@example.com",
      company: "Creative Marketing Agency",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "active",
    },
    {
      id: "client7",
      name: "David Wilson",
      email: "david@example.com",
      company: "Tech Innovations Inc.",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "pending",
    },
  ]
}

// Generate mock assignments
function generateMockAssignments(): Assignment[] {
  return [
    {
      id: "assignment1",
      templateId: "template1",
      clientId: "client1",
      assignedAt: "2025-03-10T00:00:00.000Z",
      status: "active",
    },
    {
      id: "assignment2",
      templateId: "template1",
      clientId: "client5",
      assignedAt: "2025-03-12T00:00:00.000Z",
      status: "active",
    },
    {
      id: "assignment3",
      templateId: "template2",
      clientId: "client2",
      assignedAt: "2025-02-20T00:00:00.000Z",
      status: "active",
    },
    {
      id: "assignment4",
      templateId: "template3",
      clientId: "client3",
      assignedAt: "2025-01-15T00:00:00.000Z",
      status: "completed",
    },
  ]
}

// Initialize mock data
initializeMockData()
