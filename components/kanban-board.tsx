"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  ChevronRight,
  Plus,
  CheckSquare,
  ClockIcon,
  AlertTriangle,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type TemplateStatus = "pending" | "in-progress" | "completed";

// Mock data for templates with status
const generateTemplatesForPackage = (packageId: string) => {
  const mockTemplates = [
    {
      id: "template1",
      clientName: "John Smith",
      companyName: "Birds Of Eden Corporation",
      designation: "Marketing Director",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "pending" as TemplateStatus,
      dueDate: "2025-04-15",
      progress: 25,
      teamMembers: [
        {
          id: "tm1",
          name: "Alice Johnson",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Social Media Manager",
          team: "social",
        },
        {
          id: "tm2",
          name: "Bob Smith",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Writer",
          team: "content",
        },
        {
          id: "tm3",
          name: "Charlie Davis",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Designer",
          team: "assets",
        },
      ],
      tasks: {
        social: [
          {
            id: "s1",
            name: "Create Facebook post",
            status: "pending",
            assignedTo: "tm1",
            dueDate: "2025-04-10",
            priority: "medium",
          },
          {
            id: "s2",
            name: "Schedule Twitter content",
            status: "in-progress",
            assignedTo: "tm1",
            dueDate: "2025-04-05",
            priority: "high",
          },
          {
            id: "s3",
            name: "Design Instagram story",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-04-12",
            priority: "medium",
          },
        ],
        content: [
          {
            id: "c1",
            name: "Write blog article",
            status: "pending",
            assignedTo: "tm2",
            dueDate: "2025-04-20",
            priority: "high",
          },
          {
            id: "c2",
            name: "Create newsletter",
            status: "completed",
            assignedTo: "tm2",
            dueDate: "2025-04-01",
            priority: "medium",
          },
        ],
        design: [
          {
            id: "d1",
            name: "Design new logo",
            status: "in-progress",
            assignedTo: "tm3",
            dueDate: "2025-04-25",
            priority: "high",
          },
          {
            id: "d2",
            name: "Create banner ads",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-04-18",
            priority: "medium",
          },
          {
            id: "d3",
            name: "Redesign website homepage",
            status: "pending",
            assignedTo: "tm3",
            dueDate: "2025-04-30",
            priority: "high",
          },
        ],
      },
    },
    {
      id: "template2",
      clientName: "Sarah Johnson",
      companyName: "TechStart Inc.",
      designation: "CEO",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "in-progress" as TemplateStatus,
      dueDate: "2025-05-10",
      progress: 60,
      teamMembers: [
        {
          id: "tm4",
          name: "David Wilson",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Project Manager",
          team: "management",
        },
        {
          id: "tm5",
          name: "Emma Brown",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Strategist",
          team: "content",
        },
      ],
      tasks: {
        social: [
          {
            id: "s4",
            name: "LinkedIn campaign",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-05",
            priority: "high",
          },
          {
            id: "s5",
            name: "YouTube video promotion",
            status: "pending",
            assignedTo: "tm4",
            dueDate: "2025-05-08",
            priority: "medium",
          },
        ],
        content: [
          {
            id: "c3",
            name: "Technical whitepaper",
            status: "in-progress",
            assignedTo: "tm5",
            dueDate: "2025-04-28",
            priority: "high",
          },
          {
            id: "c4",
            name: "Case study",
            status: "pending",
            assignedTo: "tm5",
            dueDate: "2025-05-02",
            priority: "medium",
          },
          {
            id: "c5",
            name: "Product documentation",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-15",
            priority: "low",
          },
        ],
        design: [
          {
            id: "d4",
            name: "Product mockups",
            status: "completed",
            assignedTo: "tm4",
            dueDate: "2025-04-15",
            priority: "high",
          },
          {
            id: "d5",
            name: "UI design for app",
            status: "in-progress",
            assignedTo: "tm5",
            dueDate: "2025-04-30",
            priority: "high",
          },
        ],
      },
    },
    {
      id: "template3",
      clientName: "Michael Brown",
      companyName: "Global Retail Solutions",
      designation: "Marketing VP",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "completed" as TemplateStatus,
      dueDate: "2025-03-30",
      progress: 100,
      teamMembers: [
        {
          id: "tm6",
          name: "Frank Miller",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "SEO Specialist",
          team: "content",
        },
        {
          id: "tm7",
          name: "Grace Lee",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Social Media Coordinator",
          team: "social",
        },
        {
          id: "tm8",
          name: "Henry Garcia",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Creator",
          team: "content",
        },
        {
          id: "tm9",
          name: "Ivy Chen",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Graphic Designer",
          team: "assets",
        },
      ],
      tasks: {
        social: [
          {
            id: "s6",
            name: "Pinterest campaign",
            status: "completed",
            assignedTo: "tm7",
            dueDate: "2025-03-15",
            priority: "medium",
          },
          {
            id: "s7",
            name: "TikTok content creation",
            status: "completed",
            assignedTo: "tm7",
            dueDate: "2025-03-20",
            priority: "high",
          },
          {
            id: "s8",
            name: "Social media calendar",
            status: "completed",
            assignedTo: "tm7",
            dueDate: "2025-03-10",
            priority: "high",
          },
        ],
        content: [
          {
            id: "c6",
            name: "Product descriptions",
            status: "completed",
            assignedTo: "tm8",
            dueDate: "2025-03-22",
            priority: "medium",
          },
          {
            id: "c7",
            name: "Email marketing sequence",
            status: "completed",
            assignedTo: "tm6",
            dueDate: "2025-03-25",
            priority: "high",
          },
        ],
        design: [
          {
            id: "d6",
            name: "Product catalog design",
            status: "completed",
            assignedTo: "tm9",
            dueDate: "2025-03-28",
            priority: "high",
          },
          {
            id: "d7",
            name: "Promotional flyers",
            status: "completed",
            assignedTo: "tm9",
            dueDate: "2025-03-18",
            priority: "medium",
          },
          {
            id: "d8",
            name: "Packaging design",
            status: "completed",
            assignedTo: "tm9",
            dueDate: "2025-03-26",
            priority: "medium",
          },
        ],
      },
    },
    {
      id: "template4",
      clientName: "Jennifer Wilson",
      companyName: "Eco Friendly Products",
      designation: "Product Manager",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "pending" as TemplateStatus,
      dueDate: "2025-05-20",
      progress: 10,
      teamMembers: [
        {
          id: "tm10",
          name: "Kevin Park",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Marketing Specialist",
          team: "social",
        },
        {
          id: "tm11",
          name: "Laura Adams",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Writer",
          team: "content",
        },
      ],
      tasks: {
        social: [
          {
            id: "s9",
            name: "Instagram campaign",
            status: "pending",
            assignedTo: "tm10",
            dueDate: "2025-05-10",
            priority: "medium",
          },
          {
            id: "s10",
            name: "Facebook ads",
            status: "pending",
            assignedTo: "tm10",
            dueDate: "2025-05-15",
            priority: "medium",
          },
        ],
        content: [
          {
            id: "c8",
            name: "Product launch blog",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-18",
            priority: "high",
          },
          {
            id: "c9",
            name: "Press release",
            status: "pending",
            assignedTo: "tm11",
            dueDate: "2025-05-12",
            priority: "high",
          },
        ],
        design: [
          {
            id: "d9",
            name: "Product packaging",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-25",
            priority: "medium",
          },
          {
            id: "d10",
            name: "Social media graphics",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-08",
            priority: "low",
          },
        ],
      },
    },
    {
      id: "template5",
      clientName: "Robert Garcia",
      companyName: "Digital Solutions Ltd",
      designation: "CTO",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "in-progress" as TemplateStatus,
      dueDate: "2025-04-30",
      progress: 45,
      teamMembers: [
        {
          id: "tm12",
          name: "Mike Thompson",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Project Lead",
          team: "management",
        },
        {
          id: "tm13",
          name: "Nancy White",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Manager",
          team: "content",
        },
        {
          id: "tm14",
          name: "Oliver Scott",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Web Developer",
          team: "assets",
        },
      ],
      tasks: {
        social: [
          {
            id: "s11",
            name: "Twitter campaign",
            status: "in-progress",
            assignedTo: "tm13",
            dueDate: "2025-04-20",
            priority: "medium",
          },
          {
            id: "s12",
            name: "LinkedIn posts",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-04-25",
            priority: "low",
          },
        ],
        content: [
          {
            id: "c10",
            name: "SEO optimization",
            status: "in-progress",
            assignedTo: "tm13",
            dueDate: "2025-04-28",
            priority: "high",
          },
          {
            id: "c11",
            name: "Website copy",
            status: "completed",
            assignedTo: "tm13",
            dueDate: "2025-04-10",
            priority: "high",
          },
        ],
        design: [
          {
            id: "d11",
            name: "Website redesign",
            status: "in-progress",
            assignedTo: "tm14",
            dueDate: "2025-05-05",
            priority: "high",
          },
          {
            id: "d12",
            name: "Logo refresh",
            status: "pending",
            assignedTo: "tm14",
            dueDate: "2025-04-22",
            priority: "medium",
          },
        ],
      },
    },
    {
      id: "template6",
      clientName: "Patricia Martinez",
      companyName: "Health & Wellness Co",
      designation: "Brand Director",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "completed" as TemplateStatus,
      dueDate: "2025-03-15",
      progress: 100,
      teamMembers: [
        {
          id: "tm15",
          name: "Paul Rodriguez",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Brand Strategist",
          team: "management",
        },
        {
          id: "tm16",
          name: "Quinn Taylor",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Content Creator",
          team: "content",
        },
      ],
      tasks: {
        social: [
          {
            id: "s13",
            name: "Instagram stories",
            status: "completed",
            assignedTo: "tm16",
            dueDate: "2025-03-05",
            priority: "high",
          },
          {
            id: "s14",
            name: "Facebook community",
            status: "completed",
            assignedTo: "tm16",
            dueDate: "2025-03-10",
            priority: "medium",
          },
        ],
        content: [
          {
            id: "c12",
            name: "Wellness guides",
            status: "completed",
            assignedTo: "tm16",
            dueDate: "2025-03-12",
            priority: "high",
          },
          {
            id: "c13",
            name: "Newsletter series",
            status: "completed",
            assignedTo: "tm15",
            dueDate: "2025-03-08",
            priority: "medium",
          },
        ],
        design: [
          {
            id: "d13",
            name: "Product labels",
            status: "completed",
            assignedTo: "tm15",
            dueDate: "2025-03-14",
            priority: "medium",
          },
          {
            id: "d14",
            name: "Brochure design",
            status: "completed",
            assignedTo: "tm15",
            dueDate: "2025-03-07",
            priority: "low",
          },
        ],
      },
    },
    {
      id: "template7",
      clientName: "Thomas Anderson",
      companyName: "Matrix Technologies",
      designation: "Innovation Lead",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "in-progress" as TemplateStatus,
      dueDate: "2025-05-15",
      progress: 35,
      teamMembers: [
        {
          id: "tm17",
          name: "Rachel Kim",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Community Manager",
          team: "social",
        },
        {
          id: "tm18",
          name: "Steve Jackson",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Technical Writer",
          team: "content",
        },
        {
          id: "tm19",
          name: "Tina Patel",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "UI/UX Designer",
          team: "assets",
        },
      ],
      tasks: {
        social: [
          {
            id: "s15",
            name: "Tech forum engagement",
            status: "in-progress",
            assignedTo: "tm17",
            dueDate: "2025-05-05",
            priority: "high",
          },
          {
            id: "s16",
            name: "Developer community",
            status: "pending",
            assignedTo: "tm17",
            dueDate: "2025-05-10",
            priority: "high",
          },
        ],
        content: [
          {
            id: "c14",
            name: "Technical documentation",
            status: "in-progress",
            assignedTo: "tm18",
            dueDate: "2025-05-08",
            priority: "urgent",
          },
          {
            id: "c15",
            name: "API guides",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-12",
            priority: "high",
          },
        ],
        design: [
          {
            id: "d15",
            name: "UI component library",
            status: "completed",
            assignedTo: "tm19",
            dueDate: "2025-04-25",
            priority: "high",
          },
          {
            id: "d16",
            name: "Dashboard mockups",
            status: "in-progress",
            assignedTo: "tm19",
            dueDate: "2025-05-02",
            priority: "urgent",
          },
        ],
      },
    },
    {
      id: "template8",
      clientName: "Olivia Taylor",
      companyName: "Fashion Forward",
      designation: "Creative Director",
      clientAvatar: "/placeholder.svg?height=40&width=40",
      status: "pending" as TemplateStatus,
      dueDate: "2025-06-01",
      progress: 5,
      teamMembers: [
        {
          id: "tm20",
          name: "Uma Patel",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Fashion Consultant",
          team: "management",
        },
        {
          id: "tm21",
          name: "Victor Nguyen",
          avatar: "/placeholder.svg?height=30&width=30",
          role: "Photographer",
          team: "assets",
        },
      ],
      tasks: {
        social: [
          {
            id: "s17",
            name: "Instagram influencer campaign",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-20",
            priority: "high",
          },
          {
            id: "s18",
            name: "Pinterest boards",
            status: "pending",
            assignedTo: "tm20",
            dueDate: "2025-05-25",
            priority: "medium",
          },
        ],
        content: [
          {
            id: "c16",
            name: "Style guides",
            status: "pending",
            assignedTo: "tm20",
            dueDate: "2025-05-28",
            priority: "medium",
          },
          {
            id: "c17",
            name: "Seasonal lookbook",
            status: "pending",
            assignedTo: null,
            dueDate: "2025-05-30",
            priority: "high",
          },
        ],
        design: [
          {
            id: "d17",
            name: "Product photography",
            status: "pending",
            assignedTo: "tm21",
            dueDate: "2025-05-22",
            priority: "high",
          },
          {
            id: "d18",
            name: "Website banners",
            status: "pending",
            assignedTo: "tm21",
            dueDate: "2025-05-15",
            priority: "medium",
          },
        ],
      },
    },
  ];

  // Add variation based on package ID
  return mockTemplates.map((template, index) => ({
    ...template,
    id: `${packageId}-${template.id}`,
    clientName: template.clientName + (index % 2 === 0 ? " Jr." : " Sr."),
    companyName:
      template.companyName +
      (index % 3 === 0 ? " Global" : index % 3 === 1 ? " Ltd." : " Inc."),
  }));
};

export function KanbanBoard({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setTemplates(generateTemplatesForPackage(packageId));
  }, [packageId]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Filter by status if not "all"
      if (statusFilter !== "all" && template.status !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.clientName.toLowerCase().includes(query) ||
          template.companyName.toLowerCase().includes(query) ||
          template.designation.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [templates, statusFilter, searchQuery]);

  const handleOpenDetails = (template: any) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(true);
    setActiveTab("overview");
  };

  const handleViewTasks = (templateId: string) => {
    router.push(`/packages/${packageId}/templates/tasks`);
  };

  const pendingTemplates = filteredTemplates.filter(
    (t) => t.status === "pending"
  );
  const inProgressTemplates = filteredTemplates.filter(
    (t) => t.status === "in-progress"
  );
  const completedTemplates = filteredTemplates.filter(
    (t) => t.status === "completed"
  );

  const getTotalTasks = (template: any) => {
    return Object.values(template.tasks).flat().length;
  };

  const getCompletedTasks = (template: any) => {
    return Object.values(template.tasks)
      .flat()
      .filter((task: any) => task.status === "completed").length;
  };

  const getInProgressTasks = (template: any) => {
    return Object.values(template.tasks)
      .flat()
      .filter((task: any) => task.status === "in-progress").length;
  };

  const getPendingTasks = (template: any) => {
    return Object.values(template.tasks)
      .flat()
      .filter((task: any) => task.status === "pending").length;
  };

  const getTasksNearDeadline = (template: any) => {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    return Object.values(template.tasks)
      .flat()
      .filter((task: any) => {
        if (task.status === "completed") return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= oneWeekFromNow;
      }).length;
  };

  const getUnassignedTasks = (template: any) => {
    return Object.values(template.tasks)
      .flat()
      .filter((task: any) => !task.assignedTo).length;
  };

  return (
    <div className="flex flex-col">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">{packageId} Templates</h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search templates..."
                className="pl-9 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-[#00b894] hover:bg-[#00a382]">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span>Pending: {pendingTemplates.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>In Progress: {inProgressTemplates.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span>Completed: {completedTemplates.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="bg-amber-50 border-amber-200 border rounded-t-lg p-3 flex justify-between items-center">
            <h3 className="font-medium text-amber-800">Pending</h3>
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              {pendingTemplates.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-amber-50 border-amber-200 border-x border-b rounded-b-lg p-3 space-y-3">
            {pendingTemplates.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No pending templates found</p>
              </div>
            ) : (
              pendingTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleOpenDetails(template)}
                  getTotalTasks={getTotalTasks}
                  getCompletedTasks={getCompletedTasks}
                  getInProgressTasks={getInProgressTasks}
                  getPendingTasks={getPendingTasks}
                  getTasksNearDeadline={getTasksNearDeadline}
                  getUnassignedTasks={getUnassignedTasks}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="bg-blue-50 border-blue-200 border rounded-t-lg p-3 flex justify-between items-center">
            <h3 className="font-medium text-blue-800">In Progress</h3>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {inProgressTemplates.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-blue-50 border-blue-200 border-x border-b rounded-b-lg p-3 space-y-3">
            {inProgressTemplates.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No in-progress templates found</p>
              </div>
            ) : (
              inProgressTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleOpenDetails(template)}
                  getTotalTasks={getTotalTasks}
                  getCompletedTasks={getCompletedTasks}
                  getInProgressTasks={getInProgressTasks}
                  getPendingTasks={getPendingTasks}
                  getTasksNearDeadline={getTasksNearDeadline}
                  getUnassignedTasks={getUnassignedTasks}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="bg-emerald-50 border-emerald-200 border rounded-t-lg p-3 flex justify-between items-center">
            <h3 className="font-medium text-emerald-800">Completed</h3>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-800"
            >
              {completedTemplates.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-y-auto bg-emerald-50 border-emerald-200 border-x border-b rounded-b-lg p-3 space-y-3">
            {completedTemplates.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No completed templates found</p>
              </div>
            ) : (
              completedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleOpenDetails(template)}
                  getTotalTasks={getTotalTasks}
                  getCompletedTasks={getCompletedTasks}
                  getInProgressTasks={getInProgressTasks}
                  getPendingTasks={getPendingTasks}
                  getTasksNearDeadline={getTasksNearDeadline}
                  getUnassignedTasks={getUnassignedTasks}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-visible flex flex-col">
            <DialogHeader className="p-6 pb-2 sticky top-0 bg-white z-10 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={
                        selectedTemplate.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedTemplate.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {selectedTemplate.status === "completed"
                        ? "Completed"
                        : selectedTemplate.status === "in-progress"
                        ? "In Progress"
                        : "Pending"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-white text-xs font-normal"
                    >
                      Due:{" "}
                      {new Date(selectedTemplate.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl">
                    {selectedTemplate.clientName}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTemplate.companyName} •{" "}
                    {selectedTemplate.designation}
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTasks(selectedTemplate.id)}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    See Tasks
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-6 border-b pb-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto flex-1 pb-20">
                <TabsContent value="overview" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-500">
                          Project Summary
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">
                              {selectedTemplate.progress}%
                            </span>
                          </div>
                          <Progress
                            value={selectedTemplate.progress}
                            className="h-2"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-500">Total Tasks:</div>
                          <div className="font-medium">
                            {getTotalTasks(selectedTemplate)}
                          </div>

                          <div className="text-gray-500">Completed:</div>
                          <div className="font-medium">
                            {getCompletedTasks(selectedTemplate)}
                          </div>

                          <div className="text-gray-500">In Progress:</div>
                          <div className="font-medium">
                            {getInProgressTasks(selectedTemplate)}
                          </div>

                          <div className="text-gray-500">Pending:</div>
                          <div className="font-medium">
                            {getPendingTasks(selectedTemplate)}
                          </div>

                          <div className="text-gray-500">Unassigned:</div>
                          <div className="font-medium">
                            {getUnassignedTasks(selectedTemplate)}
                          </div>

                          <div className="text-gray-500">Near Deadline:</div>
                          <div className="font-medium">
                            {getTasksNearDeadline(selectedTemplate)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-500">
                          Task Distribution
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                <span>Social Media</span>
                              </span>
                              <span className="font-medium">
                                {selectedTemplate.tasks.social.length}
                              </span>
                            </div>
                            <Progress
                              value={
                                (selectedTemplate.tasks.social.filter(
                                  (t: any) => t.status === "completed"
                                ).length /
                                  selectedTemplate.tasks.social.length) *
                                100
                              }
                              className="h-2 bg-gray-100 [&>div]:bg-emerald-400"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                <span>Content</span>
                              </span>
                              <span className="font-medium">
                                {selectedTemplate.tasks.content.length}
                              </span>
                            </div>
                            <Progress
                              value={
                                (selectedTemplate.tasks.content.filter(
                                  (t: any) => t.status === "completed"
                                ).length /
                                  selectedTemplate.tasks.content.length) *
                                100
                              }
                              className="h-2 bg-gray-100 [&>div]:bg-blue-400"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                <span>Design</span>
                              </span>
                              <span className="font-medium">
                                {selectedTemplate.tasks.design.length}
                              </span>
                            </div>
                            <Progress
                              value={
                                (selectedTemplate.tasks.design.filter(
                                  (t: any) => t.status === "completed"
                                ).length /
                                  selectedTemplate.tasks.design.length) *
                                100
                              }
                              className="h-2 bg-gray-100 [&>div]:bg-purple-400"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <h3 className="text-sm font-medium text-gray-500">
                          Team Members
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedTemplate.teamMembers.map((member: any) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={member.avatar}
                                  alt={member.name}
                                />
                                <AvatarFallback>
                                  {member.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {member.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {member.role}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-medium">
                        Task Status Overview
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-amber-100 p-2 rounded-full">
                            <Clock className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Pending</div>
                            <div className="text-xl font-bold">
                              {getPendingTasks(selectedTemplate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <ClockIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              In Progress
                            </div>
                            <div className="text-xl font-bold">
                              {getInProgressTasks(selectedTemplate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-emerald-100 p-2 rounded-full">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Completed
                            </div>
                            <div className="text-xl font-bold">
                              {getCompletedTasks(selectedTemplate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Near Deadline
                            </div>
                            <div className="text-xl font-bold">
                              {getTasksNearDeadline(selectedTemplate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Unassigned
                            </div>
                            <div className="text-xl font-bold">
                              {getUnassignedTasks(selectedTemplate)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Due Date
                            </div>
                            <div className="text-lg font-bold">
                              {new Date(
                                selectedTemplate.dueDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tasks" className="m-0 space-y-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        <span>Social Media Tasks</span>
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-500">
                          <div>Task Name</div>
                          <div className="w-24 text-center">Status</div>
                          <div className="w-24 text-center">Due Date</div>
                          <div className="w-24 text-center">Assigned To</div>
                        </div>

                        {selectedTemplate.tasks.social.map((task: any) => (
                          <div
                            key={task.id}
                            className="grid grid-cols-[1fr,auto,auto,auto] gap-2 p-3 text-sm border-t items-center"
                          >
                            <div className="font-medium">{task.name}</div>
                            <div className="w-24 text-center">
                              <Badge
                                className={
                                  task.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : task.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }
                              >
                                {task.status === "completed"
                                  ? "Completed"
                                  : task.status === "in-progress"
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                            </div>
                            <div className="w-24 text-center">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className="w-24 text-center">
                              {task.assignedTo ? (
                                <Avatar className="h-6 w-6 mx-auto">
                                  <AvatarImage
                                    src={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.avatar
                                    }
                                    alt={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.name
                                    }
                                  />
                                  <AvatarFallback>
                                    {selectedTemplate.teamMembers
                                      .find(
                                        (m: any) => m.id === task.assignedTo
                                      )
                                      ?.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50">
                                  Unassigned
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span>Content Tasks</span>
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-500">
                          <div>Task Name</div>
                          <div className="w-24 text-center">Status</div>
                          <div className="w-24 text-center">Due Date</div>
                          <div className="w-24 text-center">Assigned To</div>
                        </div>

                        {selectedTemplate.tasks.content.map((task: any) => (
                          <div
                            key={task.id}
                            className="grid grid-cols-[1fr,auto,auto,auto] gap-2 p-3 text-sm border-t items-center"
                          >
                            <div className="font-medium">{task.name}</div>
                            <div className="w-24 text-center">
                              <Badge
                                className={
                                  task.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : task.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }
                              >
                                {task.status === "completed"
                                  ? "Completed"
                                  : task.status === "in-progress"
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                            </div>
                            <div className="w-24 text-center">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className="w-24 text-center">
                              {task.assignedTo ? (
                                <Avatar className="h-6 w-6 mx-auto">
                                  <AvatarImage
                                    src={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.avatar
                                    }
                                    alt={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.name
                                    }
                                  />
                                  <AvatarFallback>
                                    {selectedTemplate.teamMembers
                                      .find(
                                        (m: any) => m.id === task.assignedTo
                                      )
                                      ?.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50">
                                  Unassigned
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                        <span>Design Tasks</span>
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-500">
                          <div>Task Name</div>
                          <div className="w-24 text-center">Status</div>
                          <div className="w-24 text-center">Due Date</div>
                          <div className="w-24 text-center">Assigned To</div>
                        </div>

                        {selectedTemplate.tasks.design.map((task: any) => (
                          <div
                            key={task.id}
                            className="grid grid-cols-[1fr,auto,auto,auto] gap-2 p-3 text-sm border-t items-center"
                          >
                            <div className="font-medium">{task.name}</div>
                            <div className="w-24 text-center">
                              <Badge
                                className={
                                  task.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : task.status === "in-progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }
                              >
                                {task.status === "completed"
                                  ? "Completed"
                                  : task.status === "in-progress"
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                            </div>
                            <div className="w-24 text-center">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                            <div className="w-24 text-center">
                              {task.assignedTo ? (
                                <Avatar className="h-6 w-6 mx-auto">
                                  <AvatarImage
                                    src={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.avatar
                                    }
                                    alt={
                                      selectedTemplate.teamMembers.find(
                                        (m: any) => m.id === task.assignedTo
                                      )?.name
                                    }
                                  />
                                  <AvatarFallback>
                                    {selectedTemplate.teamMembers
                                      .find(
                                        (m: any) => m.id === task.assignedTo
                                      )
                                      ?.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50">
                                  Unassigned
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="team" className="m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTemplate.teamMembers.map((member: any) => (
                      <Card key={member.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={member.avatar}
                                alt={member.name}
                              />
                              <AvatarFallback>
                                {member.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{member.name}</h3>
                              <p className="text-sm text-gray-500">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Assigned Tasks
                              </span>
                              <span className="font-medium">
                                {
                                  Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .filter(
                                      (task: any) =>
                                        task.assignedTo === member.id
                                    ).length
                                }
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Completed</span>
                              <span className="font-medium">
                                {
                                  Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .filter(
                                      (task: any) =>
                                        task.assignedTo === member.id &&
                                        task.status === "completed"
                                    ).length
                                }
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">In Progress</span>
                              <span className="font-medium">
                                {
                                  Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .filter(
                                      (task: any) =>
                                        task.assignedTo === member.id &&
                                        task.status === "in-progress"
                                    ).length
                                }
                              </span>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Pending</span>
                              <span className="font-medium">
                                {
                                  Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .filter(
                                      (task: any) =>
                                        task.assignedTo === member.id &&
                                        task.status === "pending"
                                    ).length
                                }
                              </span>
                            </div>

                            <div className="pt-2">
                              <div className="text-sm text-gray-500 mb-1">
                                Completion Rate
                              </div>
                              <Progress
                                value={
                                  Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .filter(
                                      (task: any) =>
                                        task.assignedTo === member.id
                                    ).length > 0
                                    ? (Object.values(selectedTemplate.tasks)
                                        .flat()
                                        .filter(
                                          (task: any) =>
                                            task.assignedTo === member.id &&
                                            task.status === "completed"
                                        ).length /
                                        Object.values(selectedTemplate.tasks)
                                          .flat()
                                          .filter(
                                            (task: any) =>
                                              task.assignedTo === member.id
                                          ).length) *
                                      100
                                    : 0
                                }
                                className="h-2"
                              />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            View Tasks
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="m-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-medium">Project Timeline</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Start Date
                            </div>
                            <div className="font-medium">
                              {new Date(
                                Math.min(
                                  ...Object.values(selectedTemplate.tasks)
                                    .flat()
                                    .map((task: any) =>
                                      new Date(task.dueDate).getTime()
                                    )
                                )
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">
                              Due Date
                            </div>
                            <div className="font-medium">
                              {new Date(
                                selectedTemplate.dueDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">
                            Upcoming Deadlines
                          </h4>

                          {Object.values(selectedTemplate.tasks)
                            .flat()
                            .filter((task: any) => task.status !== "completed")
                            .sort(
                              (a: any, b: any) =>
                                new Date(a.dueDate).getTime() -
                                new Date(b.dueDate).getTime()
                            )
                            .slice(0, 5)
                            .map((task: any) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-3 border rounded-md"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={
                                      new Date(task.dueDate).getTime() -
                                        new Date().getTime() <
                                      7 * 24 * 60 * 60 * 1000
                                        ? "bg-red-100 p-2 rounded-full"
                                        : "bg-amber-100 p-2 rounded-full"
                                    }
                                  >
                                    <Clock
                                      className={
                                        new Date(task.dueDate).getTime() -
                                          new Date().getTime() <
                                        7 * 24 * 60 * 60 * 1000
                                          ? "h-4 w-4 text-red-600"
                                          : "h-4 w-4 text-amber-600"
                                      }
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {task.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Due:{" "}
                                      {new Date(
                                        task.dueDate
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>

                                {task.assignedTo ? (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={
                                        selectedTemplate.teamMembers.find(
                                          (m: any) => m.id === task.assignedTo
                                        )?.avatar
                                      }
                                      alt={
                                        selectedTemplate.teamMembers.find(
                                          (m: any) => m.id === task.assignedTo
                                        )?.name
                                      }
                                    />
                                    <AvatarFallback>
                                      {selectedTemplate.teamMembers
                                        .find(
                                          (m: any) => m.id === task.assignedTo
                                        )
                                        ?.name.substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-50"
                                  >
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-4 border-t bg-white z-10 mt-auto">
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                className="bg-[#00b894] hover:bg-[#00a382]"
                onClick={() => handleViewTasks(selectedTemplate.id)}
              >
                View All Tasks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onClick,
  getTotalTasks,
  getCompletedTasks,
  getInProgressTasks,
  getPendingTasks,
  getTasksNearDeadline,
  getUnassignedTasks,
}: {
  template: any;
  onClick: () => void;
  getTotalTasks: (template: any) => number;
  getCompletedTasks: (template: any) => number;
  getInProgressTasks: (template: any) => number;
  getPendingTasks: (template: any) => number;
  getTasksNearDeadline: (template: any) => number;
  getUnassignedTasks: (template: any) => number;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={template.clientAvatar}
                alt={template.clientName}
              />
              <AvatarFallback>
                {template.clientName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sm">{template.clientName}</h4>
              <div className="flex flex-col">
                <p className="text-xs text-muted-foreground">
                  {template.companyName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {template.designation}
                </p>
              </div>
            </div>
          </div>
          <div className="flex -space-x-2">
            {template.teamMembers.slice(0, 3).map((member: any) => (
              <Avatar
                key={member.id}
                className="border-2 border-background h-6 w-6"
              >
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            ))}
            {template.teamMembers.length > 3 && (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-[10px] font-medium border-2 border-background">
                +{template.teamMembers.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{template.progress}%</span>
          </div>
          <Progress value={template.progress} className="h-1.5" />

          <div className="grid grid-cols-3 gap-1 mt-3">
            <div className="flex flex-col items-center p-1 rounded bg-amber-50">
              <span className="text-xs text-amber-700 font-medium">
                {getPendingTasks(template)}
              </span>
              <span className="text-[10px] text-amber-600">Pending</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-blue-50">
              <span className="text-xs text-blue-700 font-medium">
                {getInProgressTasks(template)}
              </span>
              <span className="text-[10px] text-blue-600">In Progress</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-emerald-50">
              <span className="text-xs text-emerald-700 font-medium">
                {getCompletedTasks(template)}
              </span>
              <span className="text-[10px] text-emerald-600">Completed</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span>{getTasksNearDeadline(template)} near deadline</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                Due: {new Date(template.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0 border-t">
        <Button
          variant="ghost"
          className="w-full h-8 rounded-none rounded-b-lg text-xs"
        >
          View Details
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default KanbanBoard;
