// Permission categories and permissions
export const permissionCategories = {
  "social-media": [
    {
      id: "social-accounts",
      name: "Social Media Accounts",
      description: "Permissions for managing social media accounts",
      permissions: [
        {
          id: "social-accounts-view",
          name: "View Accounts",
          description: "Can view social media accounts",
        },
        {
          id: "social-accounts-create",
          name: "Create Accounts",
          description: "Can create new social media accounts",
        },
        {
          id: "social-accounts-edit",
          name: "Edit Accounts",
          description: "Can edit social media account details",
        },
        {
          id: "social-accounts-delete",
          name: "Delete Accounts",
          description: "Can delete social media accounts",
        },
        {
          id: "social-accounts-credentials",
          name: "Access Credentials",
          description: "Can access account credentials",
        },
      ],
    },
    {
      id: "social-content",
      name: "Content Management",
      description: "Permissions for managing social media content",
      permissions: [
        {
          id: "social-content-view",
          name: "View Content",
          description: "Can view social media content",
        },
        {
          id: "social-content-create",
          name: "Create Content",
          description: "Can create social media content",
        },
        {
          id: "social-content-edit",
          name: "Edit Content",
          description: "Can edit social media content",
        },
        {
          id: "social-content-delete",
          name: "Delete Content",
          description: "Can delete social media content",
        },
        {
          id: "social-content-schedule",
          name: "Schedule Content",
          description: "Can schedule social media content",
        },
        {
          id: "social-content-publish",
          name: "Publish Content",
          description: "Can publish social media content immediately",
        },
      ],
    },
    {
      id: "social-engagement",
      name: "Engagement",
      description: "Permissions for managing social media engagement",
      permissions: [
        {
          id: "social-engagement-view",
          name: "View Engagement",
          description: "Can view social media engagement",
        },
        {
          id: "social-engagement-respond",
          name: "Respond to Engagement",
          description: "Can respond to comments and messages",
        },
        {
          id: "social-engagement-delete",
          name: "Delete Comments",
          description: "Can delete comments",
        },
        {
          id: "social-engagement-moderate",
          name: "Moderate Comments",
          description: "Can moderate and approve comments",
        },
      ],
    },
    {
      id: "social-analytics",
      name: "Analytics",
      description: "Permissions for viewing social media analytics",
      permissions: [
        {
          id: "social-analytics-view",
          name: "View Analytics",
          description: "Can view social media analytics",
        },
        {
          id: "social-analytics-export",
          name: "Export Analytics",
          description: "Can export social media analytics",
        },
        {
          id: "social-analytics-reports",
          name: "Create Reports",
          description: "Can create custom analytics reports",
        },
      ],
    },
    {
      id: "social-campaigns",
      name: "Campaigns",
      description: "Permissions for managing social media campaigns",
      permissions: [
        {
          id: "social-campaigns-view",
          name: "View Campaigns",
          description: "Can view social media campaigns",
        },
        {
          id: "social-campaigns-create",
          name: "Create Campaigns",
          description: "Can create social media campaigns",
        },
        {
          id: "social-campaigns-edit",
          name: "Edit Campaigns",
          description: "Can edit social media campaigns",
        },
        {
          id: "social-campaigns-delete",
          name: "Delete Campaigns",
          description: "Can delete social media campaigns",
        },
        {
          id: "social-campaigns-budget",
          name: "Manage Budget",
          description: "Can manage campaign budgets",
        },
      ],
    },
  ],
  assets: [
    {
      id: "assets-library",
      name: "Asset Library",
      description: "Permissions for managing the asset library",
      permissions: [
        {
          id: "assets-library-view",
          name: "View Assets",
          description: "Can view assets in the library",
        },
        {
          id: "assets-library-upload",
          name: "Upload Assets",
          description: "Can upload new assets to the library",
        },
        {
          id: "assets-library-edit",
          name: "Edit Assets",
          description: "Can edit asset metadata",
        },
        {
          id: "assets-library-delete",
          name: "Delete Assets",
          description: "Can delete assets from the library",
        },
        {
          id: "assets-library-organize",
          name: "Organize Assets",
          description: "Can organize assets into folders",
        },
      ],
    },
    {
      id: "assets-creation",
      name: "Content Creation",
      description: "Permissions for creating digital assets",
      permissions: [
        {
          id: "assets-creation-graphics",
          name: "Create Graphics",
          description: "Can create graphic designs",
        },
        {
          id: "assets-creation-videos",
          name: "Create Videos",
          description: "Can create and edit videos",
        },
        {
          id: "assets-creation-audio",
          name: "Create Audio",
          description: "Can create and edit audio",
        },
        {
          id: "assets-creation-templates",
          name: "Manage Templates",
          description: "Can create and manage templates",
        },
      ],
    },
    {
      id: "assets-brand",
      name: "Brand Assets",
      description: "Permissions for managing brand assets",
      permissions: [
        {
          id: "assets-brand-view",
          name: "View Brand Assets",
          description: "Can view brand assets",
        },
        {
          id: "assets-brand-edit",
          name: "Edit Brand Assets",
          description: "Can edit brand assets",
        },
        {
          id: "assets-brand-guidelines",
          name: "Manage Guidelines",
          description: "Can manage brand guidelines",
        },
      ],
    },
    {
      id: "assets-projects",
      name: "Projects",
      description: "Permissions for managing asset projects",
      permissions: [
        {
          id: "assets-projects-view",
          name: "View Projects",
          description: "Can view asset projects",
        },
        {
          id: "assets-projects-create",
          name: "Create Projects",
          description: "Can create new asset projects",
        },
        {
          id: "assets-projects-edit",
          name: "Edit Projects",
          description: "Can edit asset projects",
        },
        {
          id: "assets-projects-delete",
          name: "Delete Projects",
          description: "Can delete asset projects",
        },
        {
          id: "assets-projects-assign",
          name: "Assign Projects",
          description: "Can assign projects to team members",
        },
      ],
    },
  ],
  analytics: [
    {
      id: "analytics-dashboards",
      name: "Dashboards",
      description: "Permissions for analytics dashboards",
      permissions: [
        {
          id: "analytics-dashboards-view",
          name: "View Dashboards",
          description: "Can view analytics dashboards",
        },
        {
          id: "analytics-dashboards-create",
          name: "Create Dashboards",
          description: "Can create custom dashboards",
        },
        {
          id: "analytics-dashboards-edit",
          name: "Edit Dashboards",
          description: "Can edit dashboards",
        },
        {
          id: "analytics-dashboards-delete",
          name: "Delete Dashboards",
          description: "Can delete dashboards",
        },
        {
          id: "analytics-dashboards-share",
          name: "Share Dashboards",
          description: "Can share dashboards with others",
        },
      ],
    },
    {
      id: "analytics-reports",
      name: "Reports",
      description: "Permissions for analytics reports",
      permissions: [
        {
          id: "analytics-reports-view",
          name: "View Reports",
          description: "Can view analytics reports",
        },
        {
          id: "analytics-reports-create",
          name: "Create Reports",
          description: "Can create custom reports",
        },
        {
          id: "analytics-reports-edit",
          name: "Edit Reports",
          description: "Can edit reports",
        },
        {
          id: "analytics-reports-delete",
          name: "Delete Reports",
          description: "Can delete reports",
        },
        {
          id: "analytics-reports-export",
          name: "Export Reports",
          description: "Can export reports",
        },
        {
          id: "analytics-reports-schedule",
          name: "Schedule Reports",
          description: "Can schedule automated reports",
        },
      ],
    },
    {
      id: "analytics-data",
      name: "Data Access",
      description: "Permissions for accessing analytics data",
      permissions: [
        {
          id: "analytics-data-view",
          name: "View Data",
          description: "Can view analytics data",
        },
        {
          id: "analytics-data-export",
          name: "Export Data",
          description: "Can export raw data",
        },
        {
          id: "analytics-data-import",
          name: "Import Data",
          description: "Can import external data",
        },
        {
          id: "analytics-data-connect",
          name: "Connect Sources",
          description: "Can connect to data sources",
        },
      ],
    },
  ],
  "client-management": [
    {
      id: "client-accounts",
      name: "Client Accounts",
      description: "Permissions for managing client accounts",
      permissions: [
        {
          id: "client-accounts-view",
          name: "View Clients",
          description: "Can view client accounts",
        },
        {
          id: "client-accounts-create",
          name: "Create Clients",
          description: "Can create new client accounts",
        },
        {
          id: "client-accounts-edit",
          name: "Edit Clients",
          description: "Can edit client account details",
        },
        {
          id: "client-accounts-delete",
          name: "Delete Clients",
          description: "Can delete client accounts",
        },
      ],
    },
    {
      id: "client-projects",
      name: "Client Projects",
      description: "Permissions for managing client projects",
      permissions: [
        {
          id: "client-projects-view",
          name: "View Projects",
          description: "Can view client projects",
        },
        {
          id: "client-projects-create",
          name: "Create Projects",
          description: "Can create new client projects",
        },
        {
          id: "client-projects-edit",
          name: "Edit Projects",
          description: "Can edit client projects",
        },
        {
          id: "client-projects-delete",
          name: "Delete Projects",
          description: "Can delete client projects",
        },
        {
          id: "client-projects-assign",
          name: "Assign Projects",
          description: "Can assign projects to team members",
        },
      ],
    },
    {
      id: "client-billing",
      name: "Billing",
      description: "Permissions for managing client billing",
      permissions: [
        {
          id: "client-billing-view",
          name: "View Billing",
          description: "Can view client billing information",
        },
        {
          id: "client-billing-create",
          name: "Create Invoices",
          description: "Can create client invoices",
        },
        {
          id: "client-billing-edit",
          name: "Edit Billing",
          description: "Can edit client billing details",
        },
        {
          id: "client-billing-payments",
          name: "Process Payments",
          description: "Can process client payments",
        },
      ],
    },
    {
      id: "client-communication",
      name: "Communication",
      description: "Permissions for client communication",
      permissions: [
        {
          id: "client-communication-view",
          name: "View Communications",
          description: "Can view client communications",
        },
        {
          id: "client-communication-send",
          name: "Send Communications",
          description: "Can send communications to clients",
        },
        {
          id: "client-communication-templates",
          name: "Manage Templates",
          description: "Can manage communication templates",
        },
      ],
    },
  ],
};
