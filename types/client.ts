// Updated Client Type Definition
export type Client = {
    id: string
    name: string
    birthdate: string | null
    company: string | null
    designation: string | null
    location: string | null
    website: string | null
    website2: string | null
    website3: string | null
    biography: string | null
    imageDrivelink: string | null
    companywebsite: string | null
    companyaddress: string | null
    avatar: string | null
    progress: number | null
    status: string | null
    packageId: string | null
    package?: {
      id: string
      name: string | null
      description: string | null
      createdAt: string
      updatedAt: string
    }
    startDate: string | null
    dueDate: string | null
    createdAt: string
    updatedAt: string
    socialLinks: {
      id: string
      platform: string
      url: string
      clientId: string
    }[]
    teamMembers?: {
      clientId: string
      agentId: string
      
      role: string | null
      teamId: string | null
      assignedDate: string | null
      assignedTasks: number | null
      completedTasks: number | null
      lateTasks: number | null
      agent: {
        id: string
        email: string
        name: string | null
        emailVerified: boolean
        image: string | null
        createdAt: string
        updatedAt: string
        passwordHash: string | null
        roleId: string | null
        firstName: string | null
        lastName: string | null
        phone: string | null
        category: string | null
        address: string | null
        biography: string | null
        status: string | null
        role?: {
          id: string
          name: string
          description: string | null
        }
      } | null
      team: {
        id: string
        name: string
        description: string | null
      } | null
    }[]
    tasks?: {
      id: string
      assignmentId: string | null
      clientId: string | null
      templateSiteAssetId: number | null
      categoryId: string | null
      assignedToId: string | null
      name: string
      priority: string
      dueDate: string | null
      status: string
      idealDurationMinutes: number | null
      actualDurationMinutes: number | null
      performanceRating: string | null
      completionLink: string | null
      completedAt: string | null
      createdAt: string
      updatedAt: string
      assignedTo: {
        id: string
        email: string
        name: string | null
        emailVerified: boolean
        image: string | null
        createdAt: string
        updatedAt: string
        passwordHash: string | null
        roleId: string | null
        firstName: string | null
        lastName: string | null
        phone: string | null
        category: string | null
        address: string | null
        biography: string | null
        status: string | null
        role?: {
          id: string
          name: string
          description: string | null
        }
      } | null
      templateSiteAsset: {
        id: number
        templateId: string
        type: string
        name: string
        url: string | null
        description: string | null
        isRequired: boolean
        defaultPostingFrequency: number | null
        defaultIdealDurationMinutes: number | null
      } | null
      category: {
        id: string
        name: string
        description: string | null
      } | null
    }[]
    assignments?: {
      id: string
      templateId: string | null
      clientId: string | null
      assignedAt: string | null
      status: string | null
      template: {
        id: string
        name: string
        description: string | null
        packageId: string | null
        status: string | null
        sitesAssets: {
          id: number
          templateId: string
          type: string
          name: string
          url: string | null
          description: string | null
          isRequired: boolean
          defaultPostingFrequency: number | null
          defaultIdealDurationMinutes: number | null
        }[]
        templateTeamMembers: any[]
      } | null
      siteAssetSettings: any[]
      tasks: any[]
    }[]
    // Added missing fields from usage
    email?: string | null
    phone?: string | null
    address?: string | null
    category?: string | null
    // Account manager relationship (from Prisma: amId + accountManager)
    amId?: string | null
    accountManager?: {
      id: string
      email: string
      name: string | null
      emailVerified: boolean
      image: string | null
      createdAt: string
      updatedAt: string
      passwordHash: string | null
      roleId: string | null
      firstName: string | null
      lastName: string | null
      phone: string | null
      category: string | null
      address: string | null
      biography: string | null
      status: string | null
      role?: {
        id: string
        name: string
        description: string | null
      }
    } | null
  }
  
  export type TaskStatusCounts = {
    pending: number
    in_progress: number
    completed: number
    overdue: number
    cancelled: number
  }
  