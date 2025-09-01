import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, Calendar, Users } from "lucide-react"
import { Agent } from "../task-distribution/distribution-types"
import { getStatusBadge } from "./status-badge"
import { getCategoryBadge } from "./category-badge"

interface AgentDetailsDialogProps {
  agent: Agent | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AgentDetailsDialog({ agent, isOpen, onOpenChange }: AgentDetailsDialogProps) {
  if (!agent) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-2 ring-gray-100 dark:ring-gray-800">
              <AvatarImage src={agent.image || "/placeholder.svg"} alt={`${agent.firstName} ${agent.lastName}`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                {agent.firstName.charAt(0)}
                {agent.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {agent.firstName} {agent.lastName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 flex items-center mt-2 text-base">
                <Mail className="w-4 h-4 mr-2" />
                {agent.email}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end space-y-3">
              {getStatusBadge(agent.status)}
              {getCategoryBadge(agent.category)}
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-8 py-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</p>
                  <p className="text-gray-900 dark:text-gray-50 font-medium">{agent.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Date</p>
                  <p className="text-gray-900 dark:text-gray-50 font-medium">{formatJoinDate(agent.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          {agent.address && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-green-500" />
                  Address
                </h3>
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-gray-50 leading-relaxed">{agent.address}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Biography */}
          {agent.bio && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-500" />
                Biography
              </h3>
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{agent.bio}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
