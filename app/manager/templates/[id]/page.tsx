// src/app/templates/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SiteAssetType } from '@prisma/client'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  description?: string
  packageId?: string
  status?: string
  sitesAssets: {
    id: number
    type: SiteAssetType
    name: string
    url?: string
    description?: string
    isRequired: boolean
    defaultPostingFrequency?: number
    defaultIdealDurationMinutes?: number
  }[]
}

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newAsset, setNewAsset] = useState({
    type: 'social_site' as SiteAssetType,
    name: '',
    url: '',
    description: '',
    isRequired: false,
    defaultPostingFrequency: undefined as number | undefined,
    defaultIdealDurationMinutes: undefined as number | undefined,
  })
  const router = useRouter()

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${params.id}`)
        const data = await response.json()
        setTemplate(data)
      } catch (error) {
        console.error('Error fetching template:', error)
        toast('Failed to load template')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTemplate()
  }, [params.id, toast])

  const handleSave = async () => {
    if (!template) return
    
    try {
      const response = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          packageId: template.packageId,
          status: template.status,
          sitesAssets: template.sitesAssets,
        }),
      })
      
      const updatedTemplate = await response.json()
      setTemplate(updatedTemplate)
      setEditing(false)
      toast('Template updated successfully')
    } catch (error) {
      console.error('Error updating template:', error)
      toast('Failed to update template')
    }
  }

  const handleAddAsset = async () => {
    if (!newAsset.name || !template) return
    
    try {
      const response = await fetch(`/api/templates/${params.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAsset),
      })
      
      const createdAsset = await response.json()
      setTemplate({
        ...template,
        sitesAssets: [...template.sitesAssets, createdAsset],
      })
      setNewAsset({
        type: 'social_site',
        name: '',
        url: '',
        description: '',
        isRequired: false,
        defaultPostingFrequency: undefined,
        defaultIdealDurationMinutes: undefined,
      })
      toast('Asset added successfully')
    } catch (error) {
      console.error('Error adding asset:', error)
      toast('Failed to add asset')
    }
  }

  const handleDeleteAsset = async (assetId: number) => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    
    try {
      await fetch(`/api/templates/${params.id}/assets/${assetId}`, {
        method: 'DELETE',
      })
      
      if (template) {
        setTemplate({
          ...template,
          sitesAssets: template.sitesAssets.filter(asset => asset.id !== assetId),
        })
      }
      toast('Asset deleted successfully')
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast('Failed to delete asset')
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!template) {
    return <div className="container mx-auto py-8">Template not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">
          {editing ? 'Edit Template' : template.name}
        </h1>
        <div className="ml-auto flex space-x-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) =>
                      setTemplate({ ...template, name: e.target.value })
                    }
                  />
                ) : (
                  <div className="text-sm py-2 px-3 border rounded-md">
                    {template.name}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {editing ? (
                  <Select
                    value={template.status || 'active'}
                    onValueChange={(value) =>
                      setTemplate({ ...template, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm py-2 px-3 border rounded-md">
                    {template.status || 'active'}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              {editing ? (
                <Textarea
                  id="description"
                  value={template.description || ''}
                  onChange={(e) =>
                    setTemplate({ ...template, description: e.target.value })
                  }
                />
              ) : (
                <div className="text-sm py-2 px-3 border rounded-md min-h-[80px]">
                  {template.description || 'No description'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Site Assets</h2>
              {editing && (
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Required</TableHead>
                  {editing && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {template.sitesAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>
                      {asset.url ? (
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {asset.url}
                        </a>
                      ) : (
                        'No URL'
                      )}
                    </TableCell>
                    <TableCell>
                      {asset.isRequired ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    {editing && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {template.sitesAssets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={editing ? 5 : 4} className="h-24 text-center">
                      No assets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {editing && (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Add New Asset</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asset-type">Type</Label>
                  <Select
                    value={newAsset.type}
                    onValueChange={(value: SiteAssetType) =>
                      setNewAsset({ ...newAsset, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_site">Social Site</SelectItem>
                      <SelectItem value="web2_site">Web 2.0 Site</SelectItem>
                      <SelectItem value="other_asset">Other Asset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-name">Name</Label>
                  <Input
                    id="asset-name"
                    value={newAsset.name}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-url">URL (optional)</Label>
                  <Input
                    id="asset-url"
                    value={newAsset.url}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-description">Description (optional)</Label>
                  <Input
                    id="asset-description"
                    value={newAsset.description}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="asset-required"
                    checked={newAsset.isRequired}
                    onChange={(e) =>
                      setNewAsset({ ...newAsset, isRequired: e.target.checked })
                    }
                  />
                  <Label htmlFor="asset-required">Required</Label>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddAsset}
                  disabled={!newAsset.name}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}