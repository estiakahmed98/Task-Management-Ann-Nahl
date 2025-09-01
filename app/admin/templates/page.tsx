// src/app/admin/templates/page.tsx

'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Eye, List, Grid, Trash2, Edit, Download } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SiteAssetType } from '@prisma/client'
import { TemplateViewModal } from '@/components/TemplateViewModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { title } from 'process'

interface Template {
  id: string
  name: string
  description?: string
  status?: string
  packageId?: string
  createdAt: string
  updatedAt: string
  sitesAssets: {
    id: number
    name: string
    type: SiteAssetType
  }[]
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const handleView = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setViewModalOpen(true)
  }

  const handleViewSuccess = () => {
    fetchTemplates()
  }

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await fetch(`/api/templates/${id}`, {
          method: 'DELETE'
        })
        setTemplates(templates.filter(t => t.id !== id))
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handleExport = async (id: string) => {
    try {
      // Implement export functionality
      console.log(`Exporting template ${id}`)
      // Typically this would download a file
    } catch (error) {
      console.error('Error exporting template:', error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Library</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button asChild className="bg-amber-600 hover:bg-amber-800 text-white hover:text-white">
              <Link href="/admin/templates/new">
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name or description..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {[...Array(6)].map((_, i) => (
              viewMode === 'grid' ? (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <Skeleton key={i} className="h-16 w-full" />
              )
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <button
                        onClick={() => handleView(template.id)}
                        className="hover:underline text-left"
                      >
                        {template.name}
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description || 'No description provided'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['social_site', 'web2_site', 'other_asset'].map((type) => {
                        const count = template.sitesAssets.filter(asset => asset.type === type).length
                        if (count === 0) return null
                        return (
                          <Badge
                            key={type}
                            variant="outline"
                            className="capitalize text-xs"
                          >
                            {type.replace('_', ' ')} ({count})
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Badge
                      variant="outline"
                      className={
                        template.status === 'active'
                          ? 'text-green-600 border-green-600 bg-green-100'
                          : 'text-red-600 border-red-600 bg-red-100'
                      }
                    >
                      {template.status || 'active'}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(template.id)}
                        title="View"
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-800 text-white hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                        View Template
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        title="Delete"
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Template
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleView(template.id)}
                          className="hover:underline text-left"
                        >
                          {template.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {template.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {['social_site', 'web2_site', 'other_asset'].map((type) => {
                            const count = template.sitesAssets.filter(asset => asset.type === type).length
                            if (count === 0) return null
                            return (
                              <Badge
                                key={type}
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {type.replace('_', ' ')} ({count})
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            template.status === 'active'
                              ? 'text-green-600 border-green-600 bg-green-100'
                              : 'text-red-600 border-red-600 bg-red-100'
                          }
                        >
                          {template.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(template.id)}
                            title="View"
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-800 text-white hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                            View Template
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            title="Delete"
                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Template
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : (
          <Button asChild className="bg-amber-600 hover:bg-amber-800 text-white hover:text-white">
            <Link href="/admin/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        )}
      </div>

      <TemplateViewModal
        templateId={selectedTemplateId}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        onSuccess={handleViewSuccess}
      />
    </div>
  )
}