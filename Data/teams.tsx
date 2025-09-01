import { BarChart3, FileText, Users } from "lucide-react";

// Teams data
export const teams = [
  {
    id: "social-media",
    name: "Social Media Team",
    description: "Manages all social media accounts and engagement",
    color: "bg-blue-100 text-blue-800",
    icon: <Users className="h-4 w-4" />,
    members: 12,
  },
  {
    id: "assets",
    name: "Assets Team",
    description: "Creates and manages digital assets and content",
    color: "bg-purple-100 text-purple-800",
    icon: <FileText className="h-4 w-4" />,
    members: 8,
  },
  {
    id: "analytics",
    name: "Analytics Team",
    description: "Handles data analysis and reporting",
    color: "bg-green-100 text-green-800",
    icon: <BarChart3 className="h-4 w-4" />,
    members: 5,
  },
  {
    id: "client-management",
    name: "Client Management",
    description: "Manages client relationships and accounts",
    color: "bg-amber-100 text-amber-800",
    icon: <Users className="h-4 w-4" />,
    members: 7,
  },
];
