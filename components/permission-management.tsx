"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Calendar, Users, FileText, Plus, LayoutGrid, List, Trash2, Eye } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
// Add the import at the top
// import { TemplateSelector } from "./template-selector"

interface Agent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  category: string
  address: string
  bio: string
  status: string
  createdAt: string
}

interface Client {
  id: string
  name: string
  company: string
  designation: string
  avatar: string
}

// Update the Template interface to match your API response
interface Template {
  id: string
  name: string
  description: string
  packageId?: string
  status: string
  sitesAssets: Array<{
    id: string
    type: string
    name: string
    url: string
    description: string
    isRequired: boolean
    defaultPostingFrequency?: string
    defaultIdealDurationMinutes?: number
  }>
  templateTeamMembers: Array<{
    id: string
    agent: {
      id: string
      id: string
      name: string
      email: string
      image: string
    }
  }>
}

interface Task {
  id: string
  assignmentId: string
  assignedToId: string
  status: string
  createdAt: string
  assignedTo: Agent
}

interface Assignment {
  id: string
  templateId?: string
  clientId?: string
  template?: Template
  client?: Client
  assignedAt: string
  status: string
  tasks: Task[]
}

export default function AssignmentManagement() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Create assignment form state
  const [newAssignment, setNewAssignment] = useState({
    clientId: "",
    templateId: "",
    status: "pending",
    agentIds: [] as string[],
  })

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch("/api/assignments")
      if (!response.ok) throw new Error("Failed to fetch assignments")
      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      toast.error("Failed to load assignments")
    }
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error("Failed to fetch clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("Failed to load clients")
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/agents/list")
      if (!response.ok) throw new Error("Failed to fetch agents")
      const data = await response.json()
      setAgents(data)
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast.error("Failed to load agents")
    }
  }, [])

  // Replace the fetchTemplates function with:
  const fetchTemplates = useCallback(async () => {
    try {
      console.log("Fetching templates...")
      const response = await fetch("/api/templates")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch templates")
      }

      const data: Template[] = await response.json()
      console.log("Templates fetched:", data)

      // Filter only active templates for assignment creation
      const activeTemplates = data.filter((template) => template.status === "active")
      setTemplates(activeTemplates)
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast.error("Failed to load templates: " + error.message)
      // Set empty array as fallback
      setTemplates([])
    }
  }, [])

  useEffect(() => {
    fetchAssignments()
    fetchClients()
    fetchAgents()
    fetchTemplates()
  }, [fetchAssignments, fetchClients, fetchAgents, fetchTemplates])

  const filteredAssignments = assignments.filter((assignment) => {
    if (statusFilter !== "all" && assignment.status !== statusFilter) {
      return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        assignment.client?.name.toLowerCase().includes(query) ||
        assignment.client?.company.toLowerCase().includes(query) ||
        assignment.template?.name.toLowerCase().includes(query)
      )
    }

    return true
  })

  const handleCreateAssignment = async () => {
    if (!newAssignment.clientId) {
      toast.error("Please select a client")
      return
    }

    setIsLoading(true)
    try {
      console.log("Creating assignment with data:", newAssignment)

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error("Assignment creation failed:", responseData)
        throw new Error(responseData.message || "Failed to create assignment")
      }

      await fetchAssignments()
      toast.success("Assignment created successfully")
      setIsCreateModalOpen(false)
      setNewAssignment({
        clientId: "",
        templateId: "",
        status: "pending",
        agentIds: [],
      })
    } catch (error) {
      console.error("Error creating assignment:", error)
      toast.error(error.message || "Failed to create assignment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewAssignment = async (assignment: Assignment) => {
    try {
      const response = await fetch(`/api/assignments/${assignment.id}`)
      if (!response.ok) throw new Error("Failed to fetch assignment details")
      const data = await response.json()
      setSelectedAssignment(data)
      setIsViewModalOpen(true)
    } catch (error) {
      console.error("Error fetching assignment details:", error)
      toast.error("Failed to load assignment details")
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete assignment")

      await fetchAssignments()
      toast.success("Assignment deleted successfully")
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast.error("Failed to delete assignment")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressPercentage = (assignment: Assignment) => {
    if (assignment.tasks.length === 0) return 0
    const completedTasks = assignment.tasks.filter((task) => task.status === "completed").length
    return Math.round((completedTasks / assignment.tasks.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assignment Management</h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search assignments..."
                  className="pl-10 w-[280px] h-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Assignment
              </Button>
              <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "grid" | "list")}
                className="hidden md:block"
              >
                <TabsList className="h-10 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger
                    value="grid"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="px-4 py-2 rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <List className="h-5 w-5" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center text-sm text-gray-600 mb-2 font-medium">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
                <span>Pending: {assignments.filter((a) => a.status === "pending").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                <span>In Progress: {assignments.filter((a) => a.status === "in-progress").length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                <span>Completed: {assignments.filter((a) => a.status === "completed").length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onView={() => handleViewAssignment(assignment)}
                onDelete={() => handleDeleteAssignment(assignment.id)}
                getStatusColor={getStatusColor}
                getProgressPercentage={getProgressPercentage}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 uppercase tracking-wider">
              <div>Assignment</div>
              <div className="text-center w-24">Status</div>
              <div className="text-center w-24">Template</div>
              <div className="text-center w-24">Assigned</div>
              <div className="text-center w-24">Progress</div>
              <div className="text-center w-24">Actions</div>
            </div>
            {filteredAssignments.map((assignment, index) => (
              <div
                key={assignment.id}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] p-4 border-b border-gray-100 items-center transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-purple-50`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-purple-200">
                    <AvatarImage src={assignment.client?.avatar || "/placeholder.svg"} alt={assignment.client?.name} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                      {assignment.client?.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{assignment.client?.name}</h3>
                    <p className="text-sm text-gray-600">{assignment.client?.company}</p>
                    <p className="text-xs text-gray-500">ID: {assignment.id.substring(0, 12)}...</p>
                  </div>
                </div>
                <div className="text-center w-24">
                  <Badge
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}
                  >
                    {assignment.status}
                  </Badge>
                </div>
                <div className="text-center w-24">
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                    {assignment.template?.name || "No Template"}
                  </Badge>
                </div>
                <div className="text-center w-24 text-sm text-gray-700 font-medium">
                  {new Date(assignment.assignedAt).toLocaleDateString()}
                </div>
                <div className="w-24">
                  <div className="flex items-center gap-2">
                    <Progress value={getProgressPercentage(assignment)} className="h-2 w-full bg-gray-200" />
                    <span className="text-sm font-semibold text-gray-800">{getProgressPercentage(assignment)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 w-24">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                    onClick={() => handleViewAssignment(assignment)}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-red-600 hover:bg-red-100 transition-colors duration-200"
                    onClick={() => handleDeleteAssignment(assignment.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Assignment Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>Assign a client to agents with optional template</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={newAssignment.clientId}
                  onValueChange={(value) => setNewAssignment((prev) => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Replace the template selection section in the Create Assignment Modal: */}
              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Select
                  value={newAssignment.templateId}
                  onValueChange={(value) => setNewAssignment((prev) => ({ ...prev, templateId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template (optional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-gray-500 truncate">{template.description}</span>
                          {template.sitesAssets && template.sitesAssets.length > 0 && (
                            <span className="text-xs text-blue-600">{template.sitesAssets.length} assets included</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newAssignment.status}
                  onValueChange={(value) => setNewAssignment((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign Agents (Optional)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={newAssignment.agentIds.includes(agent.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewAssignment((prev) => ({
                              ...prev,
                              agentIds: [...prev.agentIds, agent.id],
                            }))
                          } else {
                            setNewAssignment((prev) => ({
                              ...prev,
                              agentIds: prev.agentIds.filter((id) => id !== agent.id),
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`agent-${agent.id}`} className="flex-1 cursor-pointer">
                        {agent.firstName} {agent.lastName} - {agent.category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Assignment Modal */}
        {selectedAssignment && (
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Assignment Details</DialogTitle>
                <DialogDescription>
                  {selectedAssignment.client?.name} - {selectedAssignment.client?.company}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-6">
                  {/* Assignment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <h3 className="font-semibold">Assignment Information</h3>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={getStatusColor(selectedAssignment.status)}>
                            {selectedAssignment.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned:</span>
                          <span>{new Date(selectedAssignment.assignedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Template:</span>
                          <div className="text-right">
                            <span className="font-medium">{selectedAssignment.template?.name || "No Template"}</span>
                            {selectedAssignment.template?.sitesAssets &&
                              selectedAssignment.template.sitesAssets.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {selectedAssignment.template.sitesAssets.length} assets
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Progress:</span>
                          <span>{getProgressPercentage(selectedAssignment)}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="font-semibold">Client Information</h3>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedAssignment.client?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{selectedAssignment.client?.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{selectedAssignment.client?.name}</div>
                            <div className="text-sm text-gray-600">{selectedAssignment.client?.company}</div>
                            <div className="text-xs text-gray-500">{selectedAssignment.client?.designation}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedAssignment.template && (
                    <Card>
                      <CardHeader>
                        <h3 className="font-semibold">Template Details</h3>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">{selectedAssignment.template.name}</h4>
                          <p className="text-sm text-gray-600">{selectedAssignment.template.description}</p>
                        </div>

                        {selectedAssignment.template.sitesAssets &&
                          selectedAssignment.template.sitesAssets.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">
                                Site Assets ({selectedAssignment.template.sitesAssets.length})
                              </h4>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedAssignment.template.sitesAssets.map((asset) => (
                                  <div
                                    key={asset.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                                  >
                                    <div>
                                      <span className="font-medium">{asset.name}</span>
                                      <span className="text-gray-500 ml-2">({asset.type})</span>
                                      {asset.isRequired && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    {asset.defaultPostingFrequency && (
                                      <span className="text-gray-600">{asset.defaultPostingFrequency}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {selectedAssignment.template.templateTeamMembers &&
                          selectedAssignment.template.templateTeamMembers.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Recommended Team Members</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedAssignment.template.templateTeamMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded text-xs"
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={member.agent.image || "/placeholder.svg"}
                                        alt={member.agent.name}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {member.agent.name.substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{member.agent.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Assigned Agents */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">Assigned Agents ({selectedAssignment.tasks.length})</h3>
                    </CardHeader>
                    <CardContent>
                      {selectedAssignment.tasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No agents assigned yet</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedAssignment.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{task.assignedTo.firstName.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {task.assignedTo.firstName} {task.assignedTo.lastName}
                                </div>
                                <div className="text-sm text-gray-600">{task.assignedTo.category}</div>
                              </div>
                              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

function AssignmentCard({
  assignment,
  onView,
  onDelete,
  getStatusColor,
  getProgressPercentage,
}: {
  assignment: Assignment
  onView: () => void
  onDelete: () => void
  getStatusColor: (status: string) => string
  getProgressPercentage: (assignment: Assignment) => number
}) {
  return (
    <Card className="overflow-hidden rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md">
              <AvatarImage src={assignment.client?.avatar || "/placeholder.svg"} alt={assignment.client?.name} />
              <AvatarFallback className="bg-purple-200 text-purple-800 font-bold text-xl">
                {assignment.client?.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{assignment.client?.name}</h2>
              <p className="text-gray-700 text-sm">{assignment.client?.company}</p>
              <p className="text-gray-600 text-xs">{assignment.client?.designation}</p>
            </div>
          </div>
          <Badge className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
            {assignment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-white">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
              <span>Progress</span>
              <span className="font-bold text-gray-900">{getProgressPercentage(assignment)}%</span>
            </div>
            <Progress value={getProgressPercentage(assignment)} className="h-2 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-sm text-gray-800">Agents</h3>
              </div>
              <div className="text-lg font-bold text-gray-900">{assignment.tasks.length}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-800">Assigned</h3>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(assignment.assignedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {assignment.template && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-blue-800">Template</h3>
              </div>
              <div className="text-sm text-blue-700 font-medium">{assignment.template.name}</div>
              {assignment.template.sitesAssets && assignment.template.sitesAssets.length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {assignment.template.sitesAssets.length} site assets included
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-100 grid grid-cols-2 p-0 bg-gray-50">
        <Button
          variant="ghost"
          className="rounded-bl-xl rounded-tr-none h-12 text-blue-700 hover:bg-blue-100 transition-colors duration-200 font-semibold"
          onClick={onView}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        <Button
          variant="ghost"
          className="rounded-br-xl rounded-tl-none h-12 border-l border-gray-100 text-red-700 hover:bg-red-100 transition-colors duration-200 font-semibold"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
