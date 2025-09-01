"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  GroupIcon as TeamIcon,
  List,
  Grid,
  UserCheck,
  Building,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { useUserSession } from "@/lib/hooks/use-user-session"

interface TeamMember {
  agent: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    image: string | null
  }
  role?: string | null
  assignedDate?: string | null
}

interface Team {
  id: string
  name: string
  description: string | null
  clientMembersCount: number
  templateMembersCount: number
  totalMembers: number
  clientTeamMembers: TeamMember[]
  templateTeamMembers: TeamMember[]
}

// Enhanced Team Card Component
function TeamCard({
  team,
  onDelete,
  onEdit,
  onViewDetails,
}: {
  team: Team
  onDelete: (id: string) => void
  onEdit: (team: Team) => void
  onViewDetails: (team: Team) => void
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const getTeamColor = (teamName: string) => {
    const colors = [
      "from-blue-500 to-cyan-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-emerald-600",
      "from-orange-500 to-red-600",
      "from-indigo-500 to-purple-600",
      "from-teal-500 to-blue-600",
    ]
    const index = teamName.length % colors.length
    return colors[index]
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getTeamColor(team.name)} shadow-lg`}>
              <TeamIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-50">{team.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {team.description || "No description provided"}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            <Users className="w-3 h-3 mr-1" />
            {team.totalMembers} members
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{team.clientMembersCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Client Teams</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{team.templateMembersCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Template Teams</div>
          </div>
        </div>

        {/* Team Members Preview */}
        {team.totalMembers > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Members</div>
            <div className="flex -space-x-2">
              {[...team.clientTeamMembers, ...team.templateTeamMembers].slice(0, 4).map((member, index) => (
                <Avatar key={index} className="h-8 w-8 border-2 border-white shadow-sm">
                  <AvatarImage src={member.agent.image || undefined} />
                  <AvatarFallback
                    firstName={member.agent.firstName ?? undefined}
                    lastName={member.agent.lastName ?? undefined}
                    className="text-white text-xs"
                  />
                </Avatar>
              ))}
              {team.totalMembers > 4 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{team.totalMembers - 4}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails(team)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(team)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Team
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the team "{team.name}"
                      {team.totalMembers > 0 && ` and affect ${team.totalMembers} team member(s)`}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(team.id)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={team.totalMembers > 0}
                    >
                      {team.totalMembers > 0 ? "Cannot Delete" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// Team List View Component
function TeamListView({
  teams,
  onDelete,
  onEdit,
  onViewDetails,
}: {
  teams: Team[]
  onDelete: (id: string) => void
  onEdit: (team: Team) => void
  onViewDetails: (team: Team) => void
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teamToDeleteId, setTeamToDeleteId] = useState<string | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const confirmDelete = (team: Team) => {
    setTeamToDelete(team)
    setTeamToDeleteId(team.id)
    setIsDeleteDialogOpen(true)
  }

  const executeDelete = () => {
    if (teamToDeleteId) {
      onDelete(teamToDeleteId)
      setIsDeleteDialogOpen(false)
      setTeamToDeleteId(null)
      setTeamToDelete(null)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Team</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Members</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Client Teams</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Template Teams</TableHead>
            <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
                    <TeamIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">No teams found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                      No teams match your search criteria. Try adjusting your search terms.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            teams.map((team) => (
              <TableRow
                key={team.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <TeamIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-50">{team.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {team.description || "No description"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                      <Users className="w-3 h-3 mr-1" />
                      {team.totalMembers}
                    </Badge>
                    {team.totalMembers > 0 && (
                      <div className="flex -space-x-1">
                        {[...team.clientTeamMembers, ...team.templateTeamMembers].slice(0, 3).map((member, index) => (
                          <Avatar key={index} className="h-6 w-6 border border-white">
                            <AvatarImage src={member.agent.image || undefined} />
                            <AvatarFallback
                              firstName={member.agent.firstName ?? undefined}
                              lastName={member.agent.lastName ?? undefined}
                              className="text-white text-xs"
                            />
                          </Avatar>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  >
                    {team.clientMembersCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                  >
                    {team.templateMembersCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(team)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(team)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onClick={() => confirmDelete(team)}
                        disabled={team.totalMembers > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team "{teamToDelete?.name}"
              {teamToDelete &&
                teamToDelete.totalMembers > 0 &&
                ` and affect ${teamToDelete.totalMembers} team member(s)`}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={teamToDelete ? teamToDelete.totalMembers > 0 : false}
            >
              {teamToDelete && teamToDelete.totalMembers > 0 ? "Cannot Delete" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Team Details Dialog
function TeamDetailsDialog({
  team,
  isOpen,
  onOpenChange,
}: {
  team: Team | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!team) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TeamIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">{team.name}</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                {team.description || "No description provided"}
              </DialogDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              <Users className="w-3 h-3 mr-1" />
              {team.totalMembers} members
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{team.clientMembersCount}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Client Team Members</div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {team.templateMembersCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Template Team Members</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Client Team Members */}
          {team.clientTeamMembers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                <Building className="w-5 h-5 mr-2 text-green-500" />
                Client Team Members ({team.clientMembersCount})
              </h3>
              <div className="grid gap-3">
                {team.clientTeamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <Avatar className="h-10 w-10 border-2 border-green-200 dark:border-green-800">
                      <AvatarImage src={member.agent.image || undefined} />
                      <AvatarFallback
                        firstName={member.agent.firstName ?? undefined}
                        lastName={member.agent.lastName ?? undefined}
                        className="text-white"
                      />
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {member.agent.firstName} {member.agent.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.agent.email}</div>
                    </div>
                    {member.role && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Team Members */}
          {team.templateTeamMembers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-500" />
                Template Team Members ({team.templateMembersCount})
              </h3>
              <div className="grid gap-3">
                {team.templateTeamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                  >
                    <Avatar className="h-10 w-10 border-2 border-purple-200 dark:border-purple-800">
                      <AvatarImage src={member.agent.image || undefined} />
                      <AvatarFallback
                        firstName={member.agent.firstName ?? undefined}
                        lastName={member.agent.lastName ?? undefined}
                        className="text-white"
                      />
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-50">
                        {member.agent.firstName} {member.agent.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.agent.email}</div>
                    </div>
                    {member.role && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {team.totalMembers === 0 && (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No team members assigned yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Edit Team Dialog
function EditTeamDialog({
  team,
  isOpen,
  onOpenChange,
  onSave,
}: {
  team: Team | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSave: (teamData: { id: string; name: string; description: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || "",
      })
    }
  }, [team])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !formData.name.trim()) return

    setIsSubmitting(true)
    try {
      await onSave({
        id: team.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!team) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-blue-500" />
            <span>Edit Team</span>
          </DialogTitle>
          <DialogDescription>Update the team information below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                Team Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
                className="h-10 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter team description (optional)"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                "Update Team"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "card">("list")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)

  const { user, loading: sessionLoading } = useUserSession()

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/teams")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: Team[] = await response.json()
      setTeams(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch teams.")
      console.error("Failed to fetch teams:", err)
      toast.error(err.message || "Failed to fetch teams. Please try again.", {
        description: "Error fetching teams",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch("/api/teams", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teamId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete team")
      }

      setTeams((prevTeams) => prevTeams.filter((team) => team.id !== teamId))
      toast.success("Team deleted successfully!", {
        description: "The team has been permanently removed.",
      })
    } catch (err: any) {
      console.error("Failed to delete team:", err)
      toast.error(err.message || "Failed to delete team. Please try again.", {
        description: "Error deleting team",
      })
    }
  }

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team)
    setIsEditDialogOpen(true)
  }

  const handleSaveTeam = async (teamData: { id: string; name: string; description: string }) => {
    try {
      const response = await fetch("/api/teams", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to update team")
      }

      setTeams((prevTeams) => prevTeams.map((team) => (team.id === teamData.id ? { ...team, ...result.team } : team)))

      toast.success("Team updated successfully!", {
        description: "The team information has been saved.",
      })
    } catch (err: any) {
      console.error("Failed to update team:", err)
      toast.error(err.message || "Failed to update team. Please try again.", {
        description: "Error updating team",
      })
    }
  }

  const handleViewDetails = (team: Team) => {
    setSelectedTeam(team)
    setIsDetailsDialogOpen(true)
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const totalTeams = teams.length
  const totalMembers = teams.reduce((sum, team) => sum + team.totalMembers, 0)
  const averageMembersPerTeam = totalTeams > 0 ? Math.round(totalMembers / totalTeams) : 0

  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: "Failed to load teams. Please try again.",
      })
      setError(null) // Clear error after showing toast
    }
  }, [error])

  if (loading || sessionLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading teams...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto">
              <TeamIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-red-600 dark:text-red-400">Access Denied</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please log in to access team management.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Team Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Create, manage, and organize your teams</p>
            </div>
            <Link href="/admin/teams/create">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-base">
                <Plus className="h-5 w-5" />
                Create New Team
              </Button>
            </Link>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Total Teams</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <TeamIcon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{totalTeams}</div>
                <p className="text-xs text-blue-100 mt-1">Active teams in system</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-100">Total Members</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{totalMembers}</div>
                <p className="text-xs text-emerald-100 mt-1">Across all teams</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Avg. Team Size</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white">{averageMembersPerTeam}</div>
                <p className="text-xs text-purple-100 mt-1">Members per team</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Management Card */}
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <TeamIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">Teams Overview</CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
                      Search, manage, and organize your teams
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>

            <CardContent className="p-6">
              {/* Enhanced Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search teams by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`h-12 w-12 rounded-xl ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("card")}
                    className={`h-12 w-12 rounded-xl ${
                      viewMode === "card"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Grid className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Teams Display */}
              {viewMode === "list" ? (
                <TeamListView
                  teams={filteredTeams}
                  onDelete={handleDeleteTeam}
                  onEdit={handleEditTeam}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeams.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                      <div className="flex flex-col items-center gap-6">
                        <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
                          <TeamIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50">No teams found</h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            No teams match your search criteria. Try adjusting your search terms.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onDelete={handleDeleteTeam}
                        onEdit={handleEditTeam}
                        onViewDetails={handleViewDetails}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Enhanced Results Summary */}
              {filteredTeams.length > 0 && (
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-50">{filteredTeams.length}</span> of{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-50">{teams.length}</span> teams
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        <TeamDetailsDialog team={selectedTeam} isOpen={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} />
        <EditTeamDialog
          team={teamToEdit}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveTeam}
        />
      </div>
    </div>
  )
}
