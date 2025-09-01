"use client"

import { Card } from "@/components/ui/card"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

interface SiteAsset {
  id?: number // Optional for new assets
  type: "social_site" | "web2_site" | "other_asset"
  name: string
  url: string
  description: string
  isRequired: boolean
  defaultPostingFrequency: number | null
  defaultIdealDurationMinutes: number | null
}

interface NewTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageId: string
  onSuccess: () => void
}

const defaultSiteAsset: Omit<SiteAsset, "type"> = {
  name: "",
  url: "",
  description: "",
  isRequired: true,
  defaultPostingFrequency: null,
  defaultIdealDurationMinutes: null,
}

export function NewTemplateModal({ open, onOpenChange, packageId, onSuccess }: NewTemplateModalProps) {
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [socialSites, setSocialSites] = useState<SiteAsset[]>([])
  const [web2Sites, setWeb2Sites] = useState<SiteAsset[]>([])
  const [otherAssets, setOtherAssets] = useState<SiteAsset[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTemplateName("")
      setTemplateDescription("")
      // Initialize with 10 default fields for each type
      setSocialSites(Array.from({ length: 10 }, () => ({ ...defaultSiteAsset, type: "social_site" })))
      setWeb2Sites(Array.from({ length: 10 }, () => ({ ...defaultSiteAsset, type: "web2_site" })))
      setOtherAssets(Array.from({ length: 10 }, () => ({ ...defaultSiteAsset, type: "other_asset" })))
    }
  }, [open])

  const handleAddAsset = (type: SiteAsset["type"]) => {
    const newAsset = { ...defaultSiteAsset, type }
    if (type === "social_site") {
      setSocialSites((prev) => [...prev, newAsset])
    } else if (type === "web2_site") {
      setWeb2Sites((prev) => [...prev, newAsset])
    } else {
      setOtherAssets((prev) => [...prev, newAsset])
    }
  }

  const handleRemoveAsset = (type: SiteAsset["type"], index: number) => {
    if (type === "social_site") {
      setSocialSites((prev) => prev.filter((_, i) => i !== index))
    } else if (type === "web2_site") {
      setWeb2Sites((prev) => prev.filter((_, i) => i !== index))
    } else {
      setOtherAssets((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleAssetChange = (
    type: SiteAsset["type"],
    index: number,
    field: keyof SiteAsset,
    value: string | boolean | number | null,
  ) => {
    const updateAssets = (prev: SiteAsset[]) =>
      prev.map((asset, i) => (i === index ? { ...asset, [field]: value } : asset))

    if (type === "social_site") {
      setSocialSites(updateAssets)
    } else if (type === "web2_site") {
      setWeb2Sites(updateAssets)
    } else {
      setOtherAssets(updateAssets)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const allSitesAssets = [...socialSites, ...web2Sites, ...otherAssets].filter(
      (asset) => asset.name.trim() !== "" || asset.url.trim() !== "",
    ) // Only include assets with at least a name or URL

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          packageId,
          sitesAssets: allSitesAssets,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create template")
      }

      toast.success("Template created successfully!")
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error creating template:", error)
      toast.error(error.message || "Failed to create template")
    } finally {
      setLoading(false)
    }
  }

  const renderAssetFields = (assets: SiteAsset[], type: SiteAsset["type"]) => (
    <div className="space-y-4">
      {assets.map((asset, index) => (
        <Card key={index} className="p-4 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`asset-name-${type}-${index}`}>Name</Label>
              <Input
                id={`asset-name-${type}-${index}`}
                value={asset.name}
                onChange={(e) => handleAssetChange(type, index, "name", e.target.value)}
                placeholder={`e.g., ${type === "social_site" ? "Facebook" : type === "web2_site" ? "Blog Post" : "Other Asset"}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`asset-url-${type}-${index}`}>URL</Label>
              <Input
                id={`asset-url-${type}-${index}`}
                value={asset.url}
                onChange={(e) => handleAssetChange(type, index, "url", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2 col-span-full">
              <Label htmlFor={`asset-description-${type}-${index}`}>Description</Label>
              <Textarea
                id={`asset-description-${type}-${index}`}
                value={asset.description}
                onChange={(e) => handleAssetChange(type, index, "description", e.target.value)}
                placeholder="Brief description of this asset"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`asset-frequency-${type}-${index}`}>Default Posting Frequency (days)</Label>
              <Input
                id={`asset-frequency-${type}-${index}`}
                type="number"
                value={asset.defaultPostingFrequency || ""}
                onChange={(e) =>
                  handleAssetChange(
                    type,
                    index,
                    "defaultPostingFrequency",
                    e.target.value ? Number.parseInt(e.target.value) : null,
                  )
                }
                placeholder="e.g., 7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`asset-duration-${type}-${index}`}>Default Ideal Duration (minutes)</Label>
              <Input
                id={`asset-duration-${type}-${index}`}
                type="number"
                value={asset.defaultIdealDurationMinutes || ""}
                onChange={(e) =>
                  handleAssetChange(
                    type,
                    index,
                    "defaultIdealDurationMinutes",
                    e.target.value ? Number.parseInt(e.target.value) : null,
                  )
                }
                placeholder="e.g., 30"
              />
            </div>
            <div className="flex items-center space-x-2 col-span-full">
              <Checkbox
                id={`asset-required-${type}-${index}`}
                checked={asset.isRequired}
                onCheckedChange={(checked) => handleAssetChange(type, index, "isRequired", checked as boolean)}
              />
              <Label htmlFor={`asset-required-${type}-${index}`}>Is Required</Label>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveAsset(type, index)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Field
            </Button>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={() => handleAddAsset(type)} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add New {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
        Field
      </Button>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Define a new template and its associated social sites, web2 sites, and other assets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
              placeholder="e.g., Standard SEO Template"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Template Description</Label>
            <Textarea
              id="template-description"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="A brief description of this template."
              className="min-h-[80px]"
            />
          </div>

          <h3 className="text-lg font-semibold mt-4">Social Sites</h3>
          {renderAssetFields(socialSites, "social_site")}

          <h3 className="text-lg font-semibold mt-4">Web 2.0 Sites</h3>
          {renderAssetFields(web2Sites, "web2_site")}

          <h3 className="text-lg font-semibold mt-4">Other Assets</h3>
          {renderAssetFields(otherAssets, "other_asset")}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
