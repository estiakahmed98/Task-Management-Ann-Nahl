"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Globe, Building, MapPin, Trash2, Edit, ExternalLink, User } from "lucide-react"
import { toast } from "sonner"
import { ClientEditModal } from "./EditModal"

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
  desiredDomain?: string
  biography: string
  socialMedia: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    pinterest?: string
    reddit?: string
    snapchat?: string
  }
  selectedArticles: number[]
  driveImages: Array<{
    id: string
    name: string
    url: string
  }>
  createdAt: string
  filename: string
}

interface ClientModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onDelete: (clientId: string) => void
  onUpdate: (client: Client) => void
}

export function ClientModal({ client, isOpen, onClose, onDelete, onUpdate }: ClientModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  if (!client) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Client deleted successfully")
        onDelete(client.id)
        onClose()
      } else {
        toast.error("Failed to delete client")
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast.error("Failed to delete client")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not provided"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getSocialMediaLinks = () => {
    return Object.entries(client.socialMedia)
      .filter(([_, url]) => url && url.trim() !== "")
      .map(([platform, url]) => ({ platform, url }))
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
              <div>
                <h2 className="text-xl font-semibold">{client.name}</h2>
                <Badge variant="secondary" className="mt-1">
                  {client.clientType === "business" ? "Business" : "Individual"}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* General Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Birth Date:</strong> {formatDate(client.birthDate)}
                    </span>
                  </div>
                  {client.clientType === "business" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Company:</strong> {client.companyName || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          <strong>Address:</strong> {client.companyAddress || "Not provided"}
                        </span>
                      </div>
                      {client.companyWebsite && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <a
                            href={client.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {client.companyWebsite}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </>
                  )}
                  {client.profilePicture &&
                    typeof client.profilePicture === "object" &&
                    client.profilePicture instanceof File && (
                      <div>
                        <strong>Profile Picture:</strong>
                        <div className="mt-2">
                          <Image
                            src={URL.createObjectURL(client.profilePicture) || "/placeholder.svg"}
                            alt="Profile"
                            width={100}
                            height={100}
                            className="rounded-full border"
                          />
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <Separator />

              {/* Website Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Website Information</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Has Website:</strong> {client.hasWebsite ? "Yes" : "No"}
                  </p>
                  {client.websiteUrl && (
                    <p className="text-sm">
                      <strong>Website URL:</strong>{" "}
                      <a
                        href={client.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {client.websiteUrl}
                      </a>
                    </p>
                  )}
                  {client.desiredDomain && (
                    <p className="text-sm">
                      <strong>Desired Domain:</strong> {client.desiredDomain}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Biography */}
              {client.biography && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Biography</h3>
                    <div
                      className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: client.biography }}
                    />
                  </div>
                  <Separator />
                </>
              )}

              {/* Social Media */}
              {getSocialMediaLinks().length > 0 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {getSocialMediaLinks().map(({ platform, url }) => (
                        <div key={platform} className="flex items-center gap-2">
                          <span className="text-sm capitalize font-medium">{platform}:</span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Drive Images */}
              {client.driveImages && client.driveImages.length > 0 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Drive Images ({client.driveImages.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {client.driveImages.slice(0, 8).map((image) => (
                        <div key={image.id} className="space-y-1">
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={image.url || "/placeholder.svg"}
                              alt={image.name}
                              width={150}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-gray-600 truncate">{image.name}</p>
                        </div>
                      ))}
                      {client.driveImages.length > 8 && (
                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-sm text-gray-500">+{client.driveImages.length - 8} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Metadata</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Created:</strong> {formatDate(client.createdAt)}
                  </p>
                  <p>
                    <strong>Client ID:</strong> {client.id}
                  </p>
                  {client.selectedArticles.length > 0 && (
                    <p>
                      <strong>Selected Articles:</strong> {client.selectedArticles.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ClientEditModal
        client={client}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={(updatedClient) => {
          onUpdate(updatedClient)
          setShowEditModal(false)
        }}
      />
    </>
  )
}
