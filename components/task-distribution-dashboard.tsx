"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, Users, Target, Zap, User } from "lucide-react"

// Dummy Data
const packages = [
  {
    id: "1",
    name: "Digital Marketing Package",
    description: "Complete digital marketing solution",
    templates: ["1", "2", "3"],
    clients: ["1", "2", "3"],
  },
  {
    id: "2",
    name: "Web Development Package",
    description: "Full-stack web development services",
    templates: ["4", "5"],
    clients: ["4", "5"],
  },
]

const templates = [
  {
    id: "1",
    name: "Social Media Management",
    description: "Facebook, Instagram, YouTube content management",
    packageId: "1",
    siteAssets: [
      { id: "1", name: "Facebook Page", type: "social_site", frequency: 10, period: "monthly" },
      { id: "2", name: "Instagram Account", type: "social_site", frequency: 15, period: "monthly" },
      { id: "3", name: "YouTube Channel", type: "social_site", frequency: 4, period: "monthly" },
      { id: "4", name: "Company Blog", type: "web2_site", frequency: 8, period: "monthly" },
    ],
  },
  {
    id: "2",
    name: "SEO Optimization",
    description: "Complete SEO and content optimization",
    packageId: "1",
    siteAssets: [
      { id: "5", name: "Website SEO", type: "web2_site", frequency: 20, period: "monthly" },
      { id: "6", name: "Content Audit", type: "other_asset", frequency: 5, period: "monthly" },
    ],
  },
  {
    id: "3",
    name: "Content Marketing",
    description: "Blog posts, articles, and content creation",
    packageId: "1",
    siteAssets: [
      { id: "7", name: "Blog Writing", type: "web2_site", frequency: 12, period: "monthly" },
      { id: "8", name: "Social Content", type: "social_site", frequency: 20, period: "monthly" },
    ],
  },
]

const clients = [
  { id: "1", name: "ABC Company", company: "Tech Solutions Ltd", packageId: "1" },
  { id: "2", name: "XYZ Enterprise", company: "Digital Marketing Agency", packageId: "1" },
  { id: "3", name: "Rahman Trading", company: "Import Export Business", packageId: "1" },
  { id: "4", name: "Green Tech", company: "Environmental Solutions", packageId: "2" },
  { id: "5", name: "Smart Solutions", company: "IT Consultancy", packageId: "2" },
]

const teamMembers = [
  {
    id: "1",
    name: "রহিম উদ্দিন",
    role: "Designer",
    assignedTasks: 3,
    completedTasks: 15,
    lateTasks: 1,
    skills: ["Design", "Graphics"],
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "করিম আহমেদ",
    role: "Content Writer",
    assignedTasks: 5,
    completedTasks: 22,
    lateTasks: 0,
    skills: ["Content Writing", "Social Media"],
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "জান্নাত খাতুন",
    role: "Social Media Manager",
    assignedTasks: 2,
    completedTasks: 18,
    lateTasks: 0,
    skills: ["Social Media", "Marketing"],
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "সাকিব হাসান",
    role: "Developer",
    assignedTasks: 4,
    completedTasks: 12,
    lateTasks: 2,
    skills: ["Development", "Technical"],
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const generatedTasks = [
  { id: "1", name: "Facebook Page এ ১০টি পোস্ট তৈরি", category: "Social Media", priority: "high", duration: 120 },
  { id: "2", name: "Instagram Story ডিজাইন (৫টি)", category: "Design", priority: "medium", duration: 90 },
  { id: "3", name: "YouTube Thumbnail তৈরি", category: "Design", priority: "high", duration: 60 },
  { id: "4", name: "Website Blog Content লেখা", category: "Content Writing", priority: "medium", duration: 180 },
  { id: "5", name: "Social Media Calendar প্রস্তুত", category: "Social Media", priority: "low", duration: 45 },
]

export default function TaskDistributionDashboard() {
  const [step, setStep] = useState(1)
  const [selectedPackage, setSelectedPackage] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [affectedClients, setAffectedClients] = useState<any[]>([])
  const [generatedAssignments, setGeneratedAssignments] = useState<any[]>([])
  const [allGeneratedTasks, setAllGeneratedTasks] = useState<any[]>([])
  const [distributionMethod, setDistributionMethod] = useState("")
  const [taskAssignments, setTaskAssignments] = useState<{ [key: string]: string }>({})

  const handleTemplateAssign = () => {
    if (selectedTemplate && selectedPackage) {
      const template = templates.find((t) => t.id === selectedTemplate)
      const packageClients = clients.filter((c) => c.packageId === selectedPackage)

      // Generate assignments for each client
      const assignments = packageClients.map((client, index) => ({
        id: `ASG-2025-${String(index + 1).padStart(3, "0")}`,
        templateId: selectedTemplate,
        clientId: client.id,
        templateName: template?.name,
        clientName: client.name,
        status: "created",
      }))

      // Generate tasks from template site assets for each assignment
      const allTasks: any[] = []
      assignments.forEach((assignment, assignmentIndex) => {
        template?.siteAssets.forEach((asset, assetIndex) => {
          const taskId = `${assignment.id}-T${assetIndex + 1}`
          allTasks.push({
            id: taskId,
            assignmentId: assignment.id,
            clientId: assignment.clientId,
            clientName: assignment.clientName,
            name: `${asset.name} এ ${asset.frequency}টি content তৈরি`,
            category:
              asset.type === "social_site" ? "Social Media" : asset.type === "web2_site" ? "Web Content" : "Other",
            priority: asset.frequency > 10 ? "high" : asset.frequency > 5 ? "medium" : "low",
            duration: asset.frequency * 15, // 15 minutes per content piece
            templateSiteAsset: asset.name,
          })
        })
      })

      setAffectedClients(packageClients)
      setGeneratedAssignments(assignments)
      setAllGeneratedTasks(allTasks)
      setStep(2)
    }
  }

  const handleDistributionMethod = (method: string) => {
    setDistributionMethod(method)

    const assignments: { [key: string]: string } = {}

    if (method === "round-robin") {
      allGeneratedTasks.forEach((task, index) => {
        assignments[task.id] = teamMembers[index % teamMembers.length].id
      })
    } else if (method === "load-based") {
      const sortedMembers = [...teamMembers].sort((a, b) => a.assignedTasks - b.assignedTasks)
      allGeneratedTasks.forEach((task, index) => {
        assignments[task.id] = sortedMembers[index % sortedMembers.length].id
      })
    } else if (method === "skill-based") {
      allGeneratedTasks.forEach((task) => {
        const suitableMember = teamMembers.find((member) =>
          member.skills.some((skill) => task.category.includes(skill)),
        )
        assignments[task.id] = suitableMember?.id || teamMembers[0].id
      })
    }

    setTaskAssignments(assignments)
    setStep(3)
  }

  const handleManualAssign = (taskId: string, memberId: string) => {
    setTaskAssignments((prev) => ({
      ...prev,
      [taskId]: memberId,
    }))
  }

  const confirmAssignment = () => {
    setStep(4)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getWorkloadColor = (tasks: number) => {
    if (tasks <= 2) return "text-green-600"
    if (tasks <= 4) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Task Distribution Dashboard</h1>
        <p className="text-muted-foreground">Template Assign → Assignment Create → Task Generate → Task Distribute</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { step: 1, title: "Template & Client", icon: Target },
          { step: 2, title: "Distribution Method", icon: Zap },
          { step: 3, title: "Task Assignment", icon: Users },
          { step: 4, title: "Confirmation", icon: CheckCircle },
        ].map(({ step: stepNum, title, icon: Icon }) => (
          <div key={stepNum} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className={`ml-2 text-sm font-medium ${step >= stepNum ? "text-blue-600" : "text-gray-500"}`}>
              {title}
            </span>
            {stepNum < 4 && <div className="w-8 h-0.5 bg-gray-300 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Template & Client Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Step 1: Package ও Template নির্বাচন
            </CardTitle>
            <CardDescription>প্রথমে Package বেছে নিন, তারপর সেই Package এর Template নির্বাচন করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Package নির্বাচন করুন</label>
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Package বেছে নিন..." />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div>
                          <div className="font-medium">{pkg.name}</div>
                          <div className="text-sm text-muted-foreground">{pkg.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Template নির্বাচন করুন</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate} disabled={!selectedPackage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template বেছে নিন..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((template) => template.packageId === selectedPackage)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPackage && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">এই Package এর অধীনে Clients:</h4>
                <div className="flex flex-wrap gap-2">
                  {clients
                    .filter((client) => client.packageId === selectedPackage)
                    .map((client) => (
                      <Badge key={client.id} variant="outline" className="bg-white">
                        {client.name} ({client.company})
                      </Badge>
                    ))}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  ✅ Template assign করলে উপরের সব Clients এর জন্য Assignment তৈরি হবে
                </p>
              </div>
            )}

            {selectedTemplate && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Template Site Assets:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {templates
                    .find((t) => t.id === selectedTemplate)
                    ?.siteAssets.map((asset) => (
                      <div key={asset.id} className="bg-white p-2 rounded border text-sm">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-muted-foreground">
                          {asset.frequency} content/{asset.period}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Button onClick={handleTemplateAssign} disabled={!selectedTemplate || !selectedPackage} className="w-full">
              Template Assign করুন → Multiple Assignments তৈরি করুন
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Distribution Method */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Multiple Assignments তৈরি সম্পন্ন!
              </CardTitle>
              <CardDescription>
                {templates.find((t) => t.id === selectedTemplate)?.name} Template →
                {packages.find((p) => p.id === selectedPackage)?.name} Package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ {generatedAssignments.length}টি Assignment তৈরি হয়েছে:
                </p>
                {generatedAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{assignment.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.clientName} → {assignment.templateName}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Created
                      </Badge>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-green-800">
                  ✅ মোট {allGeneratedTasks.length}টি Task auto-generate হয়েছে সব Assignments মিলিয়ে
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Step 2: Distribution Method নির্বাচন
              </CardTitle>
              <CardDescription>
                {allGeneratedTasks.length}টি Task সব Clients এর জন্য team members দের মধ্যে কীভাবে বণ্টন করবেন?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  onClick={() => handleDistributionMethod("manual")}
                >
                  <User className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Manual</div>
                    <div className="text-xs text-muted-foreground">নিজে assign করুন</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  onClick={() => handleDistributionMethod("round-robin")}
                >
                  <Target className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Round Robin</div>
                    <div className="text-xs text-muted-foreground">পালাক্রমে বণ্টন</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  onClick={() => handleDistributionMethod("load-based")}
                >
                  <Zap className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Load-Based</div>
                    <div className="text-xs text-muted-foreground">কম কাজ যার</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-transparent"
                  onClick={() => handleDistributionMethod("skill-based")}
                >
                  <Users className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Skill-Based</div>
                    <div className="text-xs text-muted-foreground">দক্ষতা অনুযায়ী</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Overview - same as before */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar>
                        <AvatarImage src={member.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Tasks:</span>
                        <span className={`font-medium ${getWorkloadColor(member.assignedTasks)}`}>
                          {member.assignedTasks}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="text-green-600">{member.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Late Tasks:</span>
                        <span className="text-red-600">{member.lateTasks}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Task Assignment */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Step 3: Task Assignment Preview (All Clients)
            </CardTitle>
            <CardDescription>
              Distribution Method: <Badge variant="outline">{distributionMethod}</Badge> | Total Tasks:{" "}
              {allGeneratedTasks.length} | Assignments: {generatedAssignments.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedAssignments.map((assignment) => {
                const assignmentTasks = allGeneratedTasks.filter((task) => task.assignmentId === assignment.id)
                return (
                  <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-lg">{assignment.id}</h4>
                        <p className="text-sm text-muted-foreground">
                          Client: {assignment.clientName} | Template: {assignment.templateName}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100">
                        {assignmentTasks.length} Tasks
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {assignmentTasks.map((task) => {
                        const assignedMember = teamMembers.find((m) => m.id === taskAssignments[task.id])
                        return (
                          <div key={task.id} className="bg-white border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium">{task.name}</h5>
                                  <Badge variant="outline">{task.category}</Badge>
                                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Duration: {task.duration} minutes • Priority: {task.priority} • Asset:{" "}
                                  {task.templateSiteAsset}
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {distributionMethod === "manual" ? (
                                  <Select
                                    value={taskAssignments[task.id] || ""}
                                    onValueChange={(value) => handleManualAssign(task.id, value)}
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue placeholder="Member নির্বাচন করুন" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {teamMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                          <div className="flex items-center space-x-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                              <AvatarFallback className="text-xs">
                                                {member.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{member.name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                              {member.assignedTasks} tasks
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  assignedMember && (
                                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={assignedMember.avatar || "/placeholder.svg"} />
                                        <AvatarFallback className="text-xs">
                                          {assignedMember.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-sm">{assignedMember.name}</div>
                                        <div className="text-xs text-muted-foreground">{assignedMember.role}</div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button onClick={confirmAssignment} className="w-full">
                All Task Assignments Confirm করুন
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Complete Task Distribution সম্পন্ন!
            </CardTitle>
            <CardDescription>
              Package-wide Template assignment এবং সব Task distribution সফলভাবে সম্পন্ন হয়েছে
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-6 rounded-lg space-y-4">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Distribution সফল!</h3>
                <p className="text-green-700">
                  {allGeneratedTasks.length}টি Task distribute হয়েছে {teamMembers.length} জন team member এর মধ্যে
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Package Details</h4>
                  <div className="text-sm space-y-1">
                    <div>Package: {packages.find((p) => p.id === selectedPackage)?.name}</div>
                    <div>Template: {templates.find((t) => t.id === selectedTemplate)?.name}</div>
                    <div>Method: {distributionMethod}</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Assignments Created</h4>
                  <div className="text-sm space-y-1">
                    {generatedAssignments.map((assignment) => (
                      <div key={assignment.id}>
                        {assignment.id} → {assignment.clientName}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-2">Distribution Summary</h4>
                  <div className="text-sm space-y-1">
                    {teamMembers.map((member) => {
                      const memberTasks = allGeneratedTasks.filter((task) => taskAssignments[task.id] === member.id)
                      return (
                        <div key={member.id}>
                          {member.name}: {memberTasks.length} tasks
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Next Steps</h4>
                <div className="text-sm space-y-1">
                  <div>✅ All team members notified</div>
                  <div>✅ Tasks added to individual dashboards</div>
                  <div>✅ Deadline tracking started for all assignments</div>
                  <div>✅ Progress monitoring enabled</div>
                  <div>✅ Client notifications sent</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                নতুন Template Assignment করুন
              </Button>
              <Button className="flex-1">All Assignments Dashboard এ যান</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
