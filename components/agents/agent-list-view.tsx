"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Edit, Trash2, Eye, Users, Mail, Phone, Calendar } from "lucide-react"
import { Agent } from "../task-distribution/distribution-types"
import { getCategoryBadge } from "./category-badge"
import { getStatusBadge } from "./status-badge"

interface AgentListViewProps {
  agents: Agent[]
  onDelete: (id: string) => void
  onViewDetails: (agent: Agent) => void
}

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AgentListView({ agents, onDelete, onViewDetails }: AgentListViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [agentToDeleteId, setAgentToDeleteId] = useState<string | null>(null)
  const router = useRouter()

  const confirmDelete = (agentId: string) => {
    setAgentToDeleteId(agentId)
    setIsDeleteDialogOpen(true)
  }

  const executeDelete = () => {
    if (agentToDeleteId) {
      onDelete(agentToDeleteId)
      setIsDeleteDialogOpen(false)
      setAgentToDeleteId(null)
    }
  }

  const goProfile = (id: string) => router.push(`/admin/agents/${id}`)
  const goEdit = (id: string) => router.push(`/admin/agents/${id}/edit`)

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100">
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300 py-4">Agent</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Category</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Join Date</TableHead>
            <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-medium text-gray-900 dark:text-gray-50">No agents found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            agents.map((agent) => (
              <TableRow
                key={agent.id}
                onClick={() => goProfile(agent.id)}
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800 cursor-pointer"
                role="button"
              >
                <TableCell className="py-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                      <AvatarImage
                        src={agent.image || "/placeholder.svg"}
                        alt={`${agent.firstName} ${agent.lastName}`}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {agent.firstName.charAt(0)}
                        {agent.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-50 text-base">
                        {agent.firstName} {agent.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1.5" />
                        {agent.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getCategoryBadge(agent.category)}</TableCell>
                <TableCell>
                  {agent.phone ? (
                    <div className="flex items-center text-gray-900 dark:text-gray-50 font-medium">
                      <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                      {agent.phone}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not provided</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(agent.status)}</TableCell>
                <TableCell className="text-sm text-gray-900 dark:text-gray-50 font-medium">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                    {formatJoinDate(agent.createdAt)}
                  </div>
                </TableCell>

                {/* ACTIONS */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        aria-label="Open actions"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>

                      {/* View (keeps your details modal behavior) */}
                      <DropdownMenuItem onClick={() => goProfile(agent.id)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>

                      {/* Edit (now navigates to edit page) */}
                      <DropdownMenuItem onClick={() => goEdit(agent.id)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Agent
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Delete (same confirm pattern as card) */}
                      <AlertDialog
                        open={isDeleteDialogOpen && agentToDeleteId === agent.id}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault()
                              confirmDelete(agent.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Agent
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the agent "
                              {agent.firstName} {agent.lastName}" and remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
