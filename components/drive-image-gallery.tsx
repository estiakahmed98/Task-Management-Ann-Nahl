"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Images,
  Download,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  RefreshCw,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  thumbnail: string
  webViewLink: string
  viewUrl: string
}

interface DriveApiResponse {
  folder: {
    id: string
    name: string
  }
  count: number
  images: DriveFile[]
}

interface DriveImageGalleryProps {
  driveLink: string
  clientName: string
}

export function DriveImageGallery({ driveLink, clientName }: DriveImageGalleryProps) {
  const [images, setImages] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyingId, setCopyingId] = useState<string | null>(null)

  const mediaUrl = (id: string, filename?: string) =>
    `/api/drive/media?id=${encodeURIComponent(id)}${filename ? `&filename=${encodeURIComponent(filename)}` : ""}`

  // Extract folder ID from Google Drive link
  const extractFolderId = (url: string): string | null => {
    try {
      const u = new URL(url)
      const foldIdx = u.pathname.indexOf("/folders/")
      if (foldIdx !== -1) {
        const id = u.pathname.slice(foldIdx + "/folders/".length).split("/")[0]
        if (id) return id
      }
      const viaQuery = u.searchParams.get("id")
      if (viaQuery) return viaQuery
      return null
    } catch {
      return null
    }
  }

  const fetchDriveFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      const folderId = extractFolderId(driveLink)
      if (!folderId) {
        throw new Error("Invalid Google Drive link format")
      }

      const response = await fetch(`/api/drive/list?folderId=${folderId}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch drive files: ${response.status} ${errorText}`)
      }

      const data: DriveApiResponse = await response.json()
      setImages(data.images || [])
    } catch (err: any) {
      setError(err.message || "Failed to load drive files")
      console.error("Drive API error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (driveLink) {
      fetchDriveFiles()
    }
  }, [driveLink])

  const handleCopy = async (img: DriveFile) => {
    setCopyingId(img.id)
    try {
      const res = await fetch(mediaUrl(img.id), { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
      const blob = await res.blob()

      const mime = blob.type && blob.type.startsWith("image/") ? blob.type : "image/png"

      // Try native binary clipboard write
      // @ts-ignore
      if (navigator.clipboard && "write" in navigator.clipboard && typeof ClipboardItem !== "undefined") {
        try {
          // @ts-ignore
          await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })])
          setCopiedId(img.id)
          toast.success("Image copied successfully! You can now paste it anywhere (Ctrl/⌘+V).")
        } catch {
          // Fallback: PNG convert then copy
          const pngBlob = await toPngBlob(blob)
          // @ts-ignore
          await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })])
          setCopiedId(img.id)
          toast.success("Image copied as PNG! You can now paste it (Ctrl/⌘+V).")
        }
      } else {
        // No binary clipboard → copy link as a last resort
        await navigator.clipboard.writeText(img.webViewLink)
        setCopiedId(img.id)
        toast.success("Binary copy unavailable—Google Drive link copied instead.")
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(img.webViewLink)
        setCopiedId(img.id)
        toast.success("Image copy failed—Google Drive link copied instead.")
      } catch {
        toast.error("Copy operation failed. Please check permissions and ensure you're using HTTPS.")
      }
    } finally {
      setCopyingId(null)
      // Reset button label after 2 seconds
      setTimeout(() => setCopiedId((curr) => (curr === img.id ? null : curr)), 2000)
    }
  }

  async function toPngBlob(src: Blob): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(src)
      // @ts-ignore
      if (typeof OffscreenCanvas !== "undefined") {
        // @ts-ignore
        const canvas = new OffscreenCanvas(bmp.width, bmp.height)
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(bmp, 0, 0)
        // @ts-ignore
        return await canvas.convertToBlob({ type: "image/png" })
      }
      const canvas = document.createElement("canvas")
      canvas.width = bmp.width
      canvas.height = bmp.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(bmp, 0, 0)
      const pngBlob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas to blob conversion failed"))), "image/png"),
      )
      return pngBlob
    } catch {
      return src // Ultimate fallback
    }
  }

  const handleDownload = (img: DriveFile) => {
    try {
      const a = document.createElement("a")
      // Server forces filename + original extension
      a.href = mediaUrl(img.id, img.name)
      a.download = img.name || `image-${img.id}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(`Downloading "${img.name}"`)
    } catch {
      window.open(img.webViewLink, "_blank")
      toast.info("Direct download failed—opened in Google Drive instead.")
    }
  }

  if (!driveLink) return null

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-gray-900 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-b border-gray-100 dark:border-gray-800">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                <Images className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Drive Assets - {clientName}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {loading
                    ? "Loading files..."
                    : `${images.length} ${images.length === 1 ? "file" : "files"} available`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!loading && images.length > 0 && (
                <Link
                  href={driveLink}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Folder
                </Link>
              )}
              {!loading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDriveFiles}
                  className="hover:bg-white/60 dark:hover:bg-gray-800/60"
                  title="Refresh files"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-white/60 dark:hover:bg-gray-800/60"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4 max-w-md">
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-full w-fit mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Failed to Load Files</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchDriveFiles}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 bg-transparent"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <CardContent className="py-12 px-8 text-center">
                  <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Files Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    This Google Drive folder appears to be empty or contains no supported file types.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => {
                const isCopied = copiedId === img.id
                const isBusy = copyingId === img.id
                return (
                  <Card
                    key={img.id}
                    className="overflow-hidden group hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
                      <Image
                        src={img.viewUrl || "/placeholder.svg"}
                        alt={img.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = img.thumbnail || "/placeholder.svg"
                        }}
                      />

                      <div className="absolute inset-0 flex items-end justify-center p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                        <div className="flex gap-2">
                          {isCopied ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              className="bg-green-100 text-green-800 border-green-200"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Copied
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCopy(img)}
                              disabled={isBusy}
                              className="bg-white/90 hover:bg-white text-gray-900 shadow-sm"
                            >
                              {isBusy ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  Copying...
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleDownload(img)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <div className="text-sm font-medium truncate mb-2" title={img.name}>
                        {img.name}
                      </div>
                      <Link
                        href={img.webViewLink}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                      >
                        View in Drive <ExternalLink className="h-3 w-3" />
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
