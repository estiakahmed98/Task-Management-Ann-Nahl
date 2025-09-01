"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Search, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface Template {
  id: string
  name: string
  description?: string
  sitesAssets?: any[]
}

interface TemplateSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTemplateIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  selectedTemplateIds,
  onSelectionChange,
}: TemplateSelectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([])

  // Initialize temp selection when modal opens
  useEffect(() => {
    if (open) {
      setTempSelectedIds([...selectedTemplateIds])
      setSearchTerm("")
    }
  }, [open, selectedTemplateIds])

  // Fetch templates when modal opens
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!open) return

      try {
        setLoading(true)
        const response = await fetch("/api/templates")
        if (!response.ok) {
          throw new Error("Failed to fetch templates")
        }
        const data = await response.json()
        setTemplates(data)
      } catch (error) {
        console.error("Error fetching templates:", error)
        toast.error("Failed to load templates")
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [open])

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleTemplateToggle = (templateId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const handleSelectAll = () => {
    setTempSelectedIds(filteredTemplates.map((t) => t.id))
  }

  const handleClearAll = () => {
    setTempSelectedIds([])
  }

  const handleDone = () => {
    onSelectionChange(tempSelectedIds)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempSelectedIds([...selectedTemplateIds]) // Reset to original selection
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Templates</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={loading}>
                Select All ({filteredTemplates.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll} disabled={loading}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">
              {tempSelectedIds.length} of {templates.length} templates selected
            </span>
            {tempSelectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1 max-w-md">
                {templates
                  .filter((t) => tempSelectedIds.includes(t.id))
                  .slice(0, 3)
                  .map((template) => (
                    <Badge key={template.id} variant="secondary" className="text-xs">
                      {template.name}
                    </Badge>
                  ))}
                {tempSelectedIds.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{tempSelectedIds.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading templates...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="text-lg font-medium">No templates found</div>
                <div className="text-sm">
                  {searchTerm ? "Try adjusting your search terms" : "No templates available"}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredTemplates.map((template) => {
                  const isSelected = tempSelectedIds.includes(template.id)
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                      }`}
                      onClick={() => handleTemplateToggle(template.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                            {template.description && (
                              <CardDescription className="line-clamp-2 mt-1">{template.description}</CardDescription>
                            )}
                          </div>
                          <Checkbox checked={isSelected} className="ml-2" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground">
                          {template.sitesAssets?.length || 0} site(s)/asset(s)
                        </div>
                        {template.sitesAssets && template.sitesAssets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.sitesAssets.slice(0, 3).map((asset: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {asset.name}
                              </Badge>
                            ))}
                            {template.sitesAssets.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.sitesAssets.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={loading}>
            <Check className="mr-2 h-4 w-4" />
            Done ({tempSelectedIds.length} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
