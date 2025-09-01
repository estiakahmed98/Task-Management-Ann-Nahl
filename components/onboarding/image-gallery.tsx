"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  ImageIcon,
  AlertCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import type { StepProps } from "@/types/onboarding";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

type DriveImage = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnail: string;
  viewUrl: string;
};

export function ImageGallery({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}: StepProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [images, setImages] = useState<DriveImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // NEW: copy UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  // -------- helpers --------
  const mediaUrl = (id: string, filename?: string) =>
    `/api/drive/media?id=${encodeURIComponent(id)}${
      filename ? `&filename=${encodeURIComponent(filename)}` : ""
    }`;

  const extractFolderId = (url: string) => {
    try {
      const u = new URL(url);
      const foldIdx = u.pathname.indexOf("/folders/");
      if (foldIdx !== -1) {
        const id = u.pathname.slice(foldIdx + "/folders/".length).split("/")[0];
        if (id) return id;
      }
      const viaQuery = u.searchParams.get("id");
      if (viaQuery) return viaQuery;
      return null;
    } catch {
      return null;
    }
  };

  const folderId = useMemo(
    () =>
      formData.imageDrivelink ? extractFolderId(formData.imageDrivelink) : null,
    [formData.imageDrivelink]
  );

  // -------- actions --------
  const validateDriveLink = async () => {
    setErrorMsg(null);

    if (!formData.imageDrivelink) {
      toast.error("Please enter a Google Drive folder link");
      return;
    }
    if (!folderId) {
      toast.error("Invalid Google Drive folder link format");
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch(
        `/api/drive/list?folderId=${encodeURIComponent(folderId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setImages([]);
        setErrorMsg(data?.error || "Failed to validate Drive link");
        toast.error(data?.error || "Failed to validate Drive link");
        return;
      }

      const list = (data.images as DriveImage[]) || [];
      setImages(list);

      updateFormData({
        imageFolderId: data.folder?.id,
        imageCount: data.count ?? list.length,
      });

      toast.success(`Drive link validated! Found ${list.length} image(s).`);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message ?? "Unexpected error");
      toast.error("Failed to validate Drive link");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownload = (img: DriveImage) => {
    try {
      const a = document.createElement("a");
      // server forces filename + original extension
      a.href = mediaUrl(img.id, img.name);
      a.download = img.name || `image-${img.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(img.webViewLink, "_blank");
    }
  };

  const handleCopy = async (img: DriveImage) => {
    setCopyingId(img.id);
    try {
      const res = await fetch(mediaUrl(img.id), { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch image");
      const blob = await res.blob();

      const mime =
        blob.type && blob.type.startsWith("image/") ? blob.type : "image/png";

      // Try native binary clipboard write
      // @ts-ignore
      if (
        navigator.clipboard &&
        "write" in navigator.clipboard &&
        typeof ClipboardItem !== "undefined"
      ) {
        try {
          // @ts-ignore
          await navigator.clipboard.write([
            new ClipboardItem({ [mime]: blob }),
          ]);
          setCopiedId(img.id);
          toast.success(
            "Image copied! এখন যেকোনো অ্যাপে Paste করুন (Ctrl/⌘+V)."
          );
        } catch {
          // Fallback: PNG convert then copy
          const pngBlob = await toPngBlob(blob);
          // @ts-ignore
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": pngBlob }),
          ]);
          setCopiedId(img.id);
          toast.success("Image copied as PNG! Paste করুন (Ctrl/⌘+V).");
        }
      } else {
        // No binary clipboard → copy link as a last resort
        await navigator.clipboard.writeText(img.webViewLink);
        setCopiedId(img.id);
        toast.success("Binary copy unavailable—link copied.");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(img.webViewLink);
        setCopiedId(img.id);
        toast.success("Binary copy ব্যর্থ—লিংক কপি করা হলো।");
      } catch {
        toast.error("Copy ব্যর্থ হয়েছে। Permission/HTTPS চেক করুন।");
      }
    } finally {
      setCopyingId(null);
      // reset button label after 2s
      setTimeout(
        () => setCopiedId((curr) => (curr === img.id ? null : curr)),
        2000
      );
    }
  };

  async function toPngBlob(src: Blob): Promise<Blob> {
    try {
      const bmp = await createImageBitmap(src);
      // @ts-ignore
      if (typeof OffscreenCanvas !== "undefined") {
        // @ts-ignore
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bmp, 0, 0);
        // @ts-ignore
        return await canvas.convertToBlob({ type: "image/png" });
      }
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      const pngBlob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
          "image/png"
        )
      );
      return pngBlob;
    } catch {
      return src; // ultimate fallback
    }
  }

  // -------- UI --------
  const CurrentGrid = isValidating ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-gray-100 animate-pulse"
        />
      ))}
    </div>
  ) : images.length === 0 ? (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center text-gray-500">
        No images yet. Paste a public Drive folder link and click{" "}
        <b>Validate</b>.
      </CardContent>
    </Card>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((img) => {
        const isCopied = copiedId === img.id;
        const isBusy = copyingId === img.id;
        return (
          <Card key={img.id} className="overflow-hidden group">
            <div className="relative aspect-square">
              <Image
                src={img.viewUrl}
                alt={img.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = img.thumbnail;
                }}
              />

              {/* hover actions */}
              <div className="absolute inset-0 flex items-end justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex gap-2">
                  {isCopied ? (
                    <Button size="sm" variant="secondary" disabled>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(img)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <>Copying…</>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                  <Button size="sm" onClick={() => handleDownload(img)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-3">
              <div className="text-sm font-medium truncate" title={img.name}>
                {img.name}
              </div>
              <div className="mt-2">
                <Link
                  href={img.webViewLink}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  View in Drive <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Image Gallery</h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="imageDrivelink">Google Drive Folder Link</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="imageDrivelink"
              placeholder="https://drive.google.com/drive/folders/XXXXXXXXXXXX"
              value={formData.imageDrivelink || ""}
              onChange={(e) =>
                updateFormData({ imageDrivelink: e.target.value })
              }
            />
            <Button
              onClick={validateDriveLink}
              disabled={isValidating || !formData.imageDrivelink}
              variant="outline"
            >
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>

          {folderId && (
            <div className="mt-2 text-sm text-gray-600">
              Extracted Folder ID: <span className="font-mono">{folderId}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 flex items-start gap-2 text-red-600">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Preview Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Preview
            </h2>
            {folderId && (
              <Link
                href={`https://drive.google.com/drive/folders/${folderId}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                Open folder <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>

          {CurrentGrid}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!images.length}>
          Next
        </Button>
      </div>
    </div>
  );
}
