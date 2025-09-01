"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Globe, Layout, Layers } from "lucide-react";
import { packageSites } from "@/Data/sites-data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
}

export function PackageDetailsModal({
  isOpen,
  onClose,
  packageId,
}: PackageDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("social");
  const sites = packageSites[packageId as keyof typeof packageSites];

  if (!sites) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className=" max-h-[85vh] p-0 gap-0 overflow-hidden"
        style={{ maxWidth: "1200px" }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium">
                {packageId}
              </span>
              <span>Site Directory</span>
            </DialogTitle>
          </div>
          <p className="text-muted-foreground mt-1">
            Browse all available sites included in this package
          </p>
        </DialogHeader>

        <Tabs
          defaultValue="social"
          className="w-full"
          onValueChange={setActiveTab}
          value={activeTab}
        >
          <div className="border-b">
            <TabsList className="h-14 w-full justify-start rounded-none bg-transparent p-0 pl-6">
              <TabsTrigger
                value="social"
                className="relative h-full rounded-none border-b-2 border-transparent px-4 pb-1 pt-2 font-medium data-[state=active]:border-primary"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Social Sites</span>
                  <Badge variant="secondary" className="ml-1">
                    {sites.socialSites.length}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="web2"
                className="relative h-full rounded-none border-b-2 border-transparent px-4 pb-1 pt-2 font-medium data-[state=active]:border-primary"
              >
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  <span>Web 2.0 Sites</span>
                  <Badge variant="secondary" className="ml-1">
                    {sites.web2Sites.length}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="additional"
                className="relative h-full rounded-none border-b-2 border-transparent px-4 pb-1 pt-2 font-medium data-[state=active]:border-primary"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>Additional Sites</span>
                  <Badge variant="secondary" className="ml-1">
                    {sites.additionalSites.length}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh]">
            <TabsContent value="social" className="p-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sites.socialSites.map((site, index) => (
                  <SiteLink key={index} url={site} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="web2" className="p-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sites.web2Sites.map((site, index) => (
                  <SiteLink key={index} url={site} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="additional" className="p-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sites.additionalSites.map((site, index) => (
                  <SiteLink key={index} url={site} />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SiteLink({ url }: { url: string }) {
  // Extract domain name for display
  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <a
      href={url.startsWith("http") ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-primary group"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary shrink-0">
        <Globe className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayUrl}</p>
        <p className="text-xs text-muted-foreground truncate">{url}</p>
      </div>
      <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
    </a>
  );
}
