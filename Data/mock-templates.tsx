import type { Template } from "@/types/template-type";

// Mock data for templates with status
export const mockTemplates: Template[] = [
  {
    id: "template1",
    clientName: "John Smith",
    companyName: "Birds Of Eden Corporation",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "pending",
    teamMembers: [
      {
        id: "tm1",
        name: "Alice",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      { id: "tm2", name: "Bob", avatar: "/placeholder.svg?height=30&width=30" },
      {
        id: "tm3",
        name: "Charlie",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s1", name: "Create Facebook post", status: "pending" },
        { id: "s2", name: "Schedule Twitter content", status: "in-progress" },
        { id: "s3", name: "Design Instagram story", status: "pending" },
      ],
      content: [
        { id: "c1", name: "Write blog article", status: "pending" },
        { id: "c2", name: "Create newsletter", status: "completed" },
      ],
      design: [
        { id: "d1", name: "Design new logo", status: "in-progress" },
        { id: "d2", name: "Create banner ads", status: "pending" },
        { id: "d3", name: "Redesign website homepage", status: "pending" },
      ],
    },
  },
  {
    id: "template2",
    clientName: "Sarah Johnson",
    companyName: "TechStart Inc.",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "in-progress",
    teamMembers: [
      {
        id: "tm4",
        name: "David",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm5",
        name: "Emma",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s4", name: "LinkedIn campaign", status: "pending" },
        { id: "s5", name: "YouTube video promotion", status: "pending" },
      ],
      content: [
        { id: "c3", name: "Technical whitepaper", status: "in-progress" },
        { id: "c4", name: "Case study", status: "pending" },
        { id: "c5", name: "Product documentation", status: "pending" },
      ],
      design: [
        { id: "d4", name: "Product mockups", status: "completed" },
        { id: "d5", name: "UI design for app", status: "in-progress" },
      ],
    },
  },
  {
    id: "template3",
    clientName: "Michael Brown",
    companyName: "Global Retail Solutions",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "completed",
    teamMembers: [
      {
        id: "tm6",
        name: "Frank",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm7",
        name: "Grace",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm8",
        name: "Henry",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      { id: "tm9", name: "Ivy", avatar: "/placeholder.svg?height=30&width=30" },
    ],
    tasks: {
      social: [
        { id: "s6", name: "Pinterest campaign", status: "completed" },
        { id: "s7", name: "TikTok content creation", status: "completed" },
        { id: "s8", name: "Social media calendar", status: "completed" },
      ],
      content: [
        { id: "c6", name: "Product descriptions", status: "completed" },
        { id: "c7", name: "Email marketing sequence", status: "completed" },
      ],
      design: [
        { id: "d6", name: "Product catalog design", status: "completed" },
        { id: "d7", name: "Promotional flyers", status: "completed" },
        { id: "d8", name: "Packaging design", status: "completed" },
      ],
    },
  },
  {
    id: "template4",
    clientName: "Jennifer Wilson",
    companyName: "Eco Friendly Products",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "pending",
    teamMembers: [
      {
        id: "tm10",
        name: "Kevin",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm11",
        name: "Laura",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s9", name: "Instagram campaign", status: "pending" },
        { id: "s10", name: "Facebook ads", status: "pending" },
      ],
      content: [
        { id: "c8", name: "Product launch blog", status: "pending" },
        { id: "c9", name: "Press release", status: "pending" },
      ],
      design: [
        { id: "d9", name: "Product packaging", status: "pending" },
        { id: "d10", name: "Social media graphics", status: "pending" },
      ],
    },
  },
  {
    id: "template5",
    clientName: "Robert Garcia",
    companyName: "Digital Solutions Ltd",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "in-progress",
    teamMembers: [
      {
        id: "tm12",
        name: "Mike",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm13",
        name: "Nancy",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm14",
        name: "Oliver",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s11", name: "Twitter campaign", status: "in-progress" },
        { id: "s12", name: "LinkedIn posts", status: "pending" },
      ],
      content: [
        { id: "c10", name: "SEO optimization", status: "in-progress" },
        { id: "c11", name: "Website copy", status: "completed" },
      ],
      design: [
        { id: "d11", name: "Website redesign", status: "in-progress" },
        { id: "d12", name: "Logo refresh", status: "pending" },
      ],
    },
  },
  {
    id: "template6",
    clientName: "Patricia Martinez",
    companyName: "Health & Wellness Co",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "completed",
    teamMembers: [
      {
        id: "tm15",
        name: "Paul",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm16",
        name: "Quinn",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s13", name: "Instagram stories", status: "completed" },
        { id: "s14", name: "Facebook community", status: "completed" },
      ],
      content: [
        { id: "c12", name: "Wellness guides", status: "completed" },
        { id: "c13", name: "Newsletter series", status: "completed" },
      ],
      design: [
        { id: "d13", name: "Product labels", status: "completed" },
        { id: "d14", name: "Brochure design", status: "completed" },
      ],
    },
  },
  {
    id: "template7",
    clientName: "Thomas Anderson",
    companyName: "Matrix Technologies",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "in-progress",
    teamMembers: [
      {
        id: "tm17",
        name: "Rachel",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm18",
        name: "Steve",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm19",
        name: "Tina",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s15", name: "Tech forum engagement", status: "in-progress" },
        { id: "s16", name: "Developer community", status: "pending" },
      ],
      content: [
        { id: "c14", name: "Technical documentation", status: "in-progress" },
        { id: "c15", name: "API guides", status: "pending" },
      ],
      design: [
        { id: "d15", name: "UI component library", status: "completed" },
        { id: "d16", name: "Dashboard mockups", status: "in-progress" },
      ],
    },
  },
  {
    id: "template8",
    clientName: "Olivia Taylor",
    companyName: "Fashion Forward",
    clientAvatar: "/placeholder.svg?height=40&width=40",
    status: "pending",
    teamMembers: [
      {
        id: "tm20",
        name: "Uma",
        avatar: "/placeholder.svg?height=30&width=30",
      },
      {
        id: "tm21",
        name: "Victor",
        avatar: "/placeholder.svg?height=30&width=30",
      },
    ],
    tasks: {
      social: [
        { id: "s17", name: "Instagram influencer campaign", status: "pending" },
        { id: "s18", name: "Pinterest boards", status: "pending" },
      ],
      content: [
        { id: "c16", name: "Style guides", status: "pending" },
        { id: "c17", name: "Seasonal lookbook", status: "pending" },
      ],
      design: [
        { id: "d17", name: "Product photography", status: "pending" },
        { id: "d18", name: "Website banners", status: "pending" },
      ],
    },
  },
];
