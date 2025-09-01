"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
}

interface ClientEditModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedClient: Client) => void
}

export function ClientEditModal({ client, isOpen, onClose, onUpdate }: ClientEditModalProps) {
  const [formData, setFormData] = useState<Partial<Client>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        // Format date for input
        birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split("T")[0] : "",
      })
    }
  }, [client])

  if (!client) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Convert date back to ISO string
          birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : "",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Client updated successfully")
        onUpdate(result.client)
        onClose()
      } else {
        toast.error(result.error || "Failed to update client")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast.error("Failed to update client")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }))
  }

  const socialMediaPlatforms = [
    { key: "facebook", label: "Facebook" },
    { key: "twitter", label: "Twitter" },
    { key: "instagram", label: "Instagram" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "youtube", label: "YouTube" },
    { key: "tiktok", label: "TikTok" },
    { key: "pinterest", label: "Pinterest" },
    { key: "reddit", label: "Reddit" },
    { key: "snapchat", label: "Snapchat" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Client: {client.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* General Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Client Type</Label>
                    <RadioGroup
                      value={formData.clientType || "individual"}
                      onValueChange={(value) => handleInputChange("clientType", value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual">Individual</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="business" id="business" />
                        <Label htmlFor="business">Business</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.clientType === "business" && (
                    <>
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName || ""}
                          onChange={(e) => handleInputChange("companyName", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="companyAddress">Company Address</Label>
                        <Input
                          id="companyAddress"
                          value={formData.companyAddress || ""}
                          onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="companyWebsite">Company Website</Label>
                        <Input
                          id="companyWebsite"
                          value={formData.companyWebsite || ""}
                          onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Website Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Website Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl || ""}
                      onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="desiredDomain">Desired Domain</Label>
                    <Input
                      id="desiredDomain"
                      value={formData.desiredDomain || ""}
                      onChange={(e) => handleInputChange("desiredDomain", e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Biography */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Biography</h3>
                <Textarea
                  value={formData.biography || ""}
                  onChange={(e) => handleInputChange("biography", e.target.value)}
                  rows={6}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <Separator />

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {socialMediaPlatforms.map((platform) => (
                    <div key={platform.key}>
                      <Label htmlFor={`social-${platform.key}`}>{platform.label}</Label>
                      <Input
                        id={`social-${platform.key}`}
                        value={formData.socialMedia?.[platform.key as keyof typeof formData.socialMedia] || ""}
                        onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                        placeholder={`https://${platform.key}.com/username`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
