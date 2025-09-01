"use client"
import { Eye } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Client } from "@/types/client"

interface ClientListProps {
  clients: Client[]
  onViewDetails: (client: Client) => void
}

export function ClientList({ clients, onViewDetails }: ClientListProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="grid grid-cols-[1.5fr_auto_auto_auto_auto_auto] p-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700">
        <div>Client</div>
        <div className="text-center w-28">Status</div>
        <div className="text-center w-28">Package</div>
        <div className="text-center w-28">Start Date</div>
        <div className="text-center w-28">Progress</div>
        <div className="text-center w-28">Actions</div>
      </div>
      {clients.map((client) => (
        <div
          key={client.id}
          className="grid grid-cols-[1.5fr_auto_auto_auto_auto_auto] p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center last:border-b-0"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-gray-100 shadow-sm">
              <AvatarImage
                src={
                  client.avatar ||
                  `/placeholder.svg?height=60&width=60&text=${client.name.substring(0, 2) || "/placeholder.svg"}`
                }
                alt={client.name}
              />
              <AvatarFallback className="bg-cyan-100 text-cyan-700 font-bold">
                {client.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-800">{client.name}</h3>
              <p className="text-sm text-gray-600">{client.company}</p>
              <p className="text-xs text-gray-500">{client.designation}</p>
            </div>
          </div>
          <div className="text-center w-28">
            <Badge
              className={
                client.status === "active"
                  ? "bg-emerald-100 text-emerald-800 font-medium px-3 py-1 rounded-full"
                  : client.status === "inactive"
                    ? "bg-gray-100 text-gray-800 font-medium px-3 py-1 rounded-full"
                    : "bg-amber-100 text-amber-800 font-medium px-3 py-1 rounded-full"
              }
            >
              {client.status || "Pending"}
            </Badge>
          </div>
          <div className="text-center w-28">
            <Badge
              variant="outline"
              className="bg-gray-50 text-gray-700 font-medium border-gray-200 px-3 py-1 rounded-full"
            >
              {client.package?.name || "None"}
            </Badge>
          </div>
          <div className="text-center w-28 text-sm text-gray-600 font-medium">
            {client.startDate ? new Date(client.startDate).toLocaleDateString() : "-"}
          </div>
          <div className="w-28 px-2">
            <div className="flex items-center gap-2">
              <Progress value={client.progress || 0} className="h-2 w-full bg-gray-200" />
              <span className="text-sm font-medium text-gray-700">{client.progress || 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 w-28">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-gray-600 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
              onClick={() => onViewDetails(client)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
