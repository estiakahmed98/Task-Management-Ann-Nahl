"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
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

interface ClientCardProps {
  client: Client
  onClick: () => void
  onDelete: () => void
  onEdit: () => void
}

export function ClientCard({ client, onClick, onDelete, onEdit }: ClientCardProps) {
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
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {client.profilePicture &&
              typeof client.profilePicture === "object" &&
              client.profilePicture instanceof File ? (
                <Image
                  src={URL.createObjectURL(client.profilePicture) || "/placeholder.svg"}
                  alt={client.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {client.clientType === "business" ? "Business" : "Individual"}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Born: {formatDate(client.birthDate)}</span>
          </div>

          {getWebsite() && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="truncate">{getWebsite()}</span>
            </div>
          )}

          {client.clientType === "business" && client.companyName && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate">{client.companyName}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{getLocation()}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Created: {formatDate(client.createdAt)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
