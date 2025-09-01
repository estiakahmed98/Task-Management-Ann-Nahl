"use client"

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
import { toast } from "sonner"

interface PackageType {
  id: string
  name: string
  description?: string
}

interface PackageFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageData?: PackageType | null
  onSuccess: () => void
}

export function PackageFormModal({ open, onOpenChange, packageData, onSuccess }: PackageFormModalProps) {
  const [name, setName] = useState(packageData?.name || "")
  const [description, setDescription] = useState(packageData?.description || "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (packageData) {
      setName(packageData.name)
      setDescription(packageData.description || "")
    } else {
      setName("")
      setDescription("")
    }
  }, [packageData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const method = packageData ? "PUT" : "POST"
    const url = packageData ? `/api/packages/${packageData.id}` : "/api/packages"

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save package")
      }

      toast.success(`Package ${packageData ? "updated" : "created"} successfully!`)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving package:", error)
      toast.error(error.message || "Failed to save package")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{packageData ? "Edit Package" : "Create New Package"}</DialogTitle>
          <DialogDescription>
            {packageData ? "Edit the details of your package." : "Create a new service package."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Basic SEO Package"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of the package."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
              {loading ? "Saving..." : packageData ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
