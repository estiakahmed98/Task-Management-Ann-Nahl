//components/package/NewTemplete.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash, Save, ArrowLeft, Badge } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SiteAssetType } from '@prisma/client'

interface NewAsset {
  type: SiteAssetType
  name: string
  url?: string
  description?: string
  isRequired: boolean
  defaultPostingFrequency?: number
  defaultIdealDurationMinutes?: number
}

export default function NewTemplatePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [packageId, setPackageId] = useState('')
  const [status, setStatus] = useState('active')
  const [assets, setAssets] = useState<NewAsset[]>([])
  const [newAsset, setNewAsset] = useState<NewAsset>({
    type: 'social_site',
    name: '',
    url: '',
    description: '',
    isRequired: true,
    defaultPostingFrequency: 1,
    defaultIdealDurationMinutes: 1,
  })
  const router = useRouter()

  const handleAddAsset = () => {
    if (!newAsset.name) return

    setAssets([...assets, newAsset])
    setNewAsset({
      type: 'social_site',
      name: '',
      url: '',
      description: '',
      isRequired: true,
      defaultPostingFrequency: 1,
      defaultIdealDurationMinutes: 1,
    })
  }

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!name) {
      toast('Template name is required')
      return
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          packageId: packageId || undefined,
          status,
          sitesAssets: assets,
        }),
      })

      const createdTemplate = await response.json()
      toast('Template created successfully')
      router.push(`/admin/templates`)
    } catch (error) {
      console.error('Error creating template:', error)
      toast('Failed to create template')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold ml-2">Create New Template</h1>
        <div className="ml-auto flex items-center space-x-2">
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-800 text-white hover:text-white">
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 p-6 border rounded-lg">
            <h2 className="text-lg font-medium">Template Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value)}
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
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4 p-6 border rounded-lg">
            <h2 className="text-lg font-medium">Site Assets</h2>
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg flex justify-between items-start"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{asset.name}</span>
                      <Badge variant="outline" className="capitalize">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                      {asset.isRequired && (
                        <Badge variant="default">Required</Badge>
                      )}
                    </div>
                    {asset.url && (
                      <div className="text-sm text-muted-foreground">
                        URL: {asset.url}
                      </div>
                    )}
                    {asset.description && (
                      <div className="text-sm text-muted-foreground">
                        {asset.description}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAsset(index)}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
              {assets.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No assets added yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-6 border rounded-lg">
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
                <Label htmlFor="asset-name">Name *</Label>
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
              <div className="flex items-center space-x-2 text-sm text-green-700 font-medium px-3 py-1 rounded w-fit">
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
                className="w-full bg-blue-600 hover:bg-blue-800 text-white hover:text-white"
                onClick={handleAddAsset}
                disabled={!newAsset.name}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}