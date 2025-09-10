"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Globe,
  Users,
  Calendar,
  Link,
  Target,
  Clock4,
  CheckCircle2,
  Clock,
  AlertCircle,
  Share2,
  Package,
  MapPin,
  Activity,
  TrendingUp,
  Star,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSiteAsset {
  id: number;
  type: "social_site" | "web2_site" | "other_asset";
  name: string;
  url?: string;
  description?: string;
  isRequired: boolean;
  defaultPostingFrequency?: number;
  defaultIdealDurationMinutes?: number;
}

interface TemplateTeamMember {
  agentId: string;
  role?: string;
  teamId?: string;
  assignedDate?: Date;
  agent: {
    id: string;
    name?: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  packageId?: string;
  package?: {
    id: string;
    name: string;
  };
  sitesAssets?: TemplateSiteAsset[];
  templateTeamMembers?: TemplateTeamMember[];
  _count?: {
    sitesAssets: number;
    templateTeamMembers: number;
    assignments: number;
  };
}

interface TemplateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export function TemplateViewModal({
  isOpen,
  onClose,
  template,
}: TemplateViewModalProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!template) return null;

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();
    if (statusLower === "active") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else if (statusLower === "draft") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
    } else if (statusLower === "inactive") {
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-600 border-slate-200"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getSiteTypeIcon = (type: string, className = "w-4 h-4") => {
    switch (type) {
      case "social_site":
        return <Share2 className={cn(className, "text-blue-600")} />;
      case "web2_site":
        return <Globe className={cn(className, "text-green-600")} />;
      case "other_asset":
        return <FileText className={cn(className, "text-purple-600")} />;
      default:
        return <FileText className={cn(className, "text-gray-600")} />;
    }
  };

  const getSiteTypeLabel = (type: string) => {
    switch (type) {
      case "social_site":
        return "Social Media";
      case "web2_site":
        return "Web 2.0 Site";
      case "other_asset":
        return "Additional Asset";
      default:
        return "Unknown";
    }
  };

  const getSiteTypeBadgeColor = (type: string) => {
    switch (type) {
      case "social_site":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "web2_site":
        return "bg-green-100 text-green-700 border-green-200";
      case "other_asset":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const socialSites =
    template.sitesAssets?.filter((site) => site.type === "social_site") || [];
  const web2Sites =
    template.sitesAssets?.filter((site) => site.type === "web2_site") || [];
  const otherAssets =
    template.sitesAssets?.filter((site) => site.type === "other_asset") || [];

  const requiredSites =
    template.sitesAssets?.filter((site) => site.isRequired) || [];
  const optionalSites =
    template.sitesAssets?.filter((site) => !site.isRequired) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                  {template.name}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(template.status)}
                  <Badge variant="outline" className="text-xs">
                    <Package className="w-3 h-3 mr-1" />
                    {template.package?.name || "No Package"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {template.description && (
            <p className="text-gray-600 mt-3 leading-relaxed">
              {template.description}
            </p>
          )}
        </DialogHeader>

        {/* Content with Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <div className="px-6 border-b bg-white">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="sites"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Sites & Assets
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4 text-center">
                      <div className="p-2 bg-blue-200 rounded-full w-fit mx-auto mb-2">
                        <Share2 className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {socialSites.length}
                      </div>
                      <div className="text-xs text-blue-700 font-medium">
                        Social Media
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-4 text-center">
                      <div className="p-2 bg-green-200 rounded-full w-fit mx-auto mb-2">
                        <Globe className="w-5 h-5 text-green-700" />
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {web2Sites.length}
                      </div>
                      <div className="text-xs text-green-700 font-medium">
                        Web 2.0 Sites
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-4 text-center">
                      <div className="p-2 bg-purple-200 rounded-full w-fit mx-auto mb-2">
                        <FileText className="w-5 h-5 text-purple-700" />
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {otherAssets.length}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">
                        Additional Assets
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                    <CardContent className="p-4 text-center">
                      <div className="p-2 bg-orange-200 rounded-full w-fit mx-auto mb-2">
                        <Users className="w-5 h-5 text-orange-700" />
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {template._count?.templateTeamMembers || 0}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">
                        Team Members
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Quick Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Required Sites
                        </span>
                        <Badge className="bg-red-100 text-red-700">
                          {requiredSites.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Optional Sites
                        </span>
                        <Badge className="bg-gray-100 text-gray-700">
                          {optionalSites.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Assignments
                        </span>
                        <Badge className="bg-blue-100 text-blue-700">
                          {template._count?.assignments || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Template Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <span className="text-sm text-gray-600">
                          Template ID
                        </span>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                          {template.id}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Package</span>
                        <p className="font-medium mt-1">
                          {template.package?.name || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          Current Status
                        </span>
                        <div className="mt-1">
                          {getStatusBadge(template.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="sites" className="mt-0 space-y-6">
                {/* Site Type Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Social Media Sites */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                        <Share2 className="w-5 h-5" />
                        Social Media Sites
                        <Badge className="bg-blue-200 text-blue-800 ml-auto">
                          {socialSites.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {socialSites.length > 0 ? (
                        socialSites.map((site) => (
                          <div
                            key={site.id}
                            className="p-3 border border-blue-100 rounded-lg bg-blue-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-blue-900">
                                {site.name}
                              </h4>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  site.isRequired
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                )}
                              >
                                {site.isRequired ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {site.url && (
                              <a
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2"
                              >
                                <Link className="w-3 h-3" />
                                {new URL(site.url).hostname}
                              </a>
                            )}
                            {site.description && (
                              <p className="text-xs text-blue-700 mb-2">
                                {site.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-blue-600">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {site.defaultPostingFrequency || 0} posts
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock4 className="w-3 h-3" />
                                {site.defaultIdealDurationMinutes || 0} mins
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-blue-600 text-center py-4">
                          No social media sites configured
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Web 2.0 Sites */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                      <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                        <Globe className="w-5 h-5" />
                        Web 2.0 Sites
                        <Badge className="bg-green-200 text-green-800 ml-auto">
                          {web2Sites.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {web2Sites.length > 0 ? (
                        web2Sites.map((site) => (
                          <div
                            key={site.id}
                            className="p-3 border border-green-100 rounded-lg bg-green-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-green-900">
                                {site.name}
                              </h4>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  site.isRequired
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                )}
                              >
                                {site.isRequired ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {site.url && (
                              <a
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:underline flex items-center gap-1 mb-2"
                              >
                                <Link className="w-3 h-3" />
                                {new URL(site.url).hostname}
                              </a>
                            )}
                            {site.description && (
                              <p className="text-xs text-green-700 mb-2">
                                {site.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-green-600">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {site.defaultPostingFrequency || 0} posts
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock4 className="w-3 h-3" />
                                {site.defaultIdealDurationMinutes || 0} mins
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-green-600 text-center py-4">
                          No Web 2.0 sites configured
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Assets */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                      <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                        <FileText className="w-5 h-5" />
                        Additional Assets
                        <Badge className="bg-purple-200 text-purple-800 ml-auto">
                          {otherAssets.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 max-h-64 overflow-y-auto">
                      {otherAssets.length > 0 ? (
                        otherAssets.map((site) => (
                          <div
                            key={site.id}
                            className="p-3 border border-purple-100 rounded-lg bg-purple-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-purple-900">
                                {site.name}
                              </h4>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  site.isRequired
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                )}
                              >
                                {site.isRequired ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {site.url && (
                              <a
                                href={site.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:underline flex items-center gap-1 mb-2"
                              >
                                <Link className="w-3 h-3" />
                                {new URL(site.url).hostname}
                              </a>
                            )}
                            {site.description && (
                              <p className="text-xs text-purple-700 mb-2">
                                {site.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-purple-600">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {site.defaultPostingFrequency || 0} posts
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock4 className="w-3 h-3" />
                                {site.defaultIdealDurationMinutes || 0} mins
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-purple-600 text-center py-4">
                          No additional assets configured
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
