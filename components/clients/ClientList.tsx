"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Globe, Building, MapPin, User, MoreVertical, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Client {
  id: string
  name: string
  profilePicture?: File
  birthDate: string
  clientType: string
  companyName?: string
  companyAddress?: string
  companyWebsite?: string
  hasWebsite: boolean
  websiteUrl?: string
  createdAt: string
}

interface ClientListItemProps {
  client: Client
  onClick: () => void
  onDelete: () => void
  onEdit: () => void
}

export function ClientListItem({ client, onClick, onDelete, onEdit }: ClientListItemProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getLocation = () => {
    if (client.clientType === "business" && client.companyAddress) {
      return client.companyAddress
    }
    return "Location not provided"
  }

  const getWebsite = () => {
    if (client.clientType === "business" && client.companyWebsite) {
      return client.companyWebsite
    }
    if (client.websiteUrl) {
      return client.websiteUrl
    }
    return "No website"
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {client.profilePicture &&
          typeof client.profilePicture === "object" &&
          client.profilePicture instanceof File ? (
            <Image
              src={URL.createObjectURL(client.profilePicture) || "/placeholder.svg"}
              alt={client.name}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base truncate">{client.name}</h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {client.clientType === "business" ? "Business" : "Individual"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatDate(client.birthDate)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getWebsite()}</span>
            </div>

            {client.clientType === "business" && client.companyName && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{client.companyName}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getLocation()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
