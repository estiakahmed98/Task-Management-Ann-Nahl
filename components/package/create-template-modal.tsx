"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Share2,
  Globe,
  FileText,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Palette,
  PenTool,
  FileEdit,
  Link as LinkIcon,
  CheckCircle,
  Youtube,
  BarChart,
  ShieldAlert,
  FileBarChart,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  DEFAULT_SOCIAL_SITES,
  DEFAULT_WEB2_SITES,
  DEFAULT_ADDITIONAL_SITES,
  DEFAULT_GRAPHICS_DESIGN,
  DEFAULT_CONTENT_STUDIO,
  DEFAULT_CONTENT_WRITING,
  DEFAULT_BACKLINKS,
  DEFAULT_YOUTUBE_VIDEO_OPTIMIZATION,
  DEFAULT_MONITORING,
  DEFAULT_REVIEW_REMOVAL,
  DEFAULT_SUMMARY_REPORT,
} from "@/Data/template_site";

// === Types ===
type SiteAssetTypeTS =
  | "social_site"
  | "web2_site"
  | "additional_site"
  | "graphics_design"
  | "content_studio"
  | "content_writing"
  | "backlinks"
  | "completed_com"
  | "youtube_video_optimization"
  | "monitoring"
  | "review_removal"
  | "summary_report";

interface SiteAsset {
  type: SiteAssetTypeTS;
  name: string;
  url: string;
  description: string;
  isRequired: boolean;
  defaultPostingFrequency: number; // per month
  defaultIdealDurationMinutes: number;
}

interface TemplateSiteAssetLike extends SiteAsset {}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  sitesAssets?: TemplateSiteAssetLike[];
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  onCreated: () => void;
  initialData?: Template | null;
  isEditMode?: boolean;
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  packageId,
  onCreated,
  initialData,
  isEditMode = false,
}: CreateTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  // Basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");

  // Per-type site-asset state
  const [socialSites, setSocialSites] = useState<SiteAsset[]>([]);
  const [web2Sites, setWeb2Sites] = useState<SiteAsset[]>([]);
  const [additionalSites, setAdditionalSites] = useState<SiteAsset[]>([]);
  const [graphicsDesign, setGraphicsDesign] = useState<SiteAsset[]>([]);
  const [contentStudio, setContentStudio] = useState<SiteAsset[]>([]);
  const [contentWriting, setContentWriting] = useState<SiteAsset[]>([]);
  const [backlinks, setBacklinks] = useState<SiteAsset[]>([]);
  const [completedCom, setCompletedCom] = useState<SiteAsset[]>([]);
  const [youtubeOptimization, setYoutubeOptimization] = useState<SiteAsset[]>([]);
  const [monitoring, setMonitoring] = useState<SiteAsset[]>([]);
  const [reviewRemoval, setReviewRemoval] = useState<SiteAsset[]>([]);
  const [summaryReport, setSummaryReport] = useState<SiteAsset[]>([]);

  const steps = [
    { id: 0, title: "Basic Info", description: "Template details", icon: FileText },
    { id: 1, title: "Social Sites", description: "Social media", icon: Share2 },
    { id: 2, title: "Web 2.0 Sites", description: "Blogging platforms", icon: Globe },
    { id: 3, title: "Additional Sites", description: "Other platforms", icon: Sparkles },
    { id: 4, title: "Graphics Design", description: "Design tasks", icon: Palette },
    { id: 5, title: "Content Studio", description: "Content production", icon: PenTool },
    { id: 6, title: "Content Writing", description: "Articles and posts", icon: FileEdit },
    { id: 7, title: "Backlinks", description: "Link-building", icon: LinkIcon },
    { id: 8, title: "Completed.com", description: "Profile tasks", icon: CheckCircle },
    { id: 9, title: "YouTube Optimization", description: "Video content", icon: Youtube },
    { id: 10, title: "Monitoring", description: "Performance tracking", icon: BarChart },
    { id: 11, title: "Review Removal", description: "Handle reviews", icon: ShieldAlert },
    { id: 12, title: "Summary Report", description: "Final reporting", icon: FileBarChart },
  ];

  // Helpers to create default SiteAsset from a simple default item
  const mapDefaults =
    (type: SiteAssetTypeTS) =>
    (site: { name: string; url?: string; isRequired?: boolean }) => ({
      type,
      name: site.name,
      url: site.url ?? "",
      description: "",
      isRequired: Boolean(site.isRequired),
      defaultPostingFrequency: 3,
      defaultIdealDurationMinutes: 30,
    });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setName(initialData.name);
        setDescription(initialData.description || "");
        setStatus(initialData.status || "draft");

        const assets = initialData.sitesAssets ?? [];
        const pick = (t: SiteAssetTypeTS) =>
          assets.filter((a) => a.type === t) as SiteAsset[];

        setSocialSites(
          pick("social_site").length
            ? pick("social_site")
            : DEFAULT_SOCIAL_SITES.map(mapDefaults("social_site"))
        );
        setWeb2Sites(
          pick("web2_site").length
            ? pick("web2_site")
            : DEFAULT_WEB2_SITES.map(mapDefaults("web2_site"))
        );
        setAdditionalSites(
          pick("additional_site").length
            ? pick("additional_site")
            : DEFAULT_ADDITIONAL_SITES.map(mapDefaults("additional_site"))
        );
        setGraphicsDesign(
          pick("graphics_design").length
            ? pick("graphics_design")
            : DEFAULT_GRAPHICS_DESIGN.map(mapDefaults("graphics_design"))
        );
        setContentStudio(
          pick("content_studio").length
            ? pick("content_studio")
            : DEFAULT_CONTENT_STUDIO.map(mapDefaults("content_studio"))
        );
        setContentWriting(
          pick("content_writing").length
            ? pick("content_writing")
            : DEFAULT_CONTENT_WRITING.map(mapDefaults("content_writing"))
        );
        setBacklinks(
          pick("backlinks").length
            ? pick("backlinks")
            : DEFAULT_BACKLINKS.map(mapDefaults("backlinks"))
        );
        setCompletedCom(
          pick("completed_com").length
            ? pick("completed_com")
            : [
                {
                  type: "completed_com",
                  name: "Completed.com",
                  url: "https://Completed.com",
                  description: "",
                  isRequired: false,
                  defaultPostingFrequency: 1,
                  defaultIdealDurationMinutes: 30,
                },
              ]
        );
        setYoutubeOptimization(
          pick("youtube_video_optimization").length
            ? pick("youtube_video_optimization")
            : DEFAULT_YOUTUBE_VIDEO_OPTIMIZATION.map(
                mapDefaults("youtube_video_optimization")
              )
        );
        setMonitoring(
          pick("monitoring").length
            ? pick("monitoring")
            : DEFAULT_MONITORING.map(mapDefaults("monitoring"))
        );
        setReviewRemoval(
          pick("review_removal").length
            ? pick("review_removal")
            : DEFAULT_REVIEW_REMOVAL.map(mapDefaults("review_removal"))
        );
        setSummaryReport(
          pick("summary_report").length
            ? pick("summary_report")
            : DEFAULT_SUMMARY_REPORT.map(mapDefaults("summary_report"))
        );
      } else {
        initializeDefaultAssets();
      }
      setCurrentStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, initialData]);

  const initializeDefaultAssets = () => {
    setName("");
    setDescription("");
    setStatus("draft");

    setSocialSites(DEFAULT_SOCIAL_SITES.map(mapDefaults("social_site")));
    setWeb2Sites(DEFAULT_WEB2_SITES.map(mapDefaults("web2_site")));
    setAdditionalSites(DEFAULT_ADDITIONAL_SITES.map(mapDefaults("additional_site")));
    setGraphicsDesign(DEFAULT_GRAPHICS_DESIGN.map(mapDefaults("graphics_design")));
    setContentStudio(DEFAULT_CONTENT_STUDIO.map(mapDefaults("content_studio")));
    setContentWriting(DEFAULT_CONTENT_WRITING.map(mapDefaults("content_writing")));
    setBacklinks(DEFAULT_BACKLINKS.map(mapDefaults("backlinks")));
    setCompletedCom([
      {
        type: "completed_com",
        name: "Completed.com",
        url: "https://Completed.com",
        description: "",
        isRequired: false,
        defaultPostingFrequency: 1,
        defaultIdealDurationMinutes: 30,
      },
    ]);
    setYoutubeOptimization(
      DEFAULT_YOUTUBE_VIDEO_OPTIMIZATION.map(
        mapDefaults("youtube_video_optimization")
      )
    );
    setMonitoring(DEFAULT_MONITORING.map(mapDefaults("monitoring")));
    setReviewRemoval(DEFAULT_REVIEW_REMOVAL.map(mapDefaults("review_removal")));
    setSummaryReport(DEFAULT_SUMMARY_REPORT.map(mapDefaults("summary_report")));
  };

  const resetForm = () => {
    initializeDefaultAssets();
    setCurrentStep(0);
  };

  // Generic helpers to operate on the correct list
  const getListAndSetter = (
    type: SiteAssetTypeTS
  ): [SiteAsset[], React.Dispatch<React.SetStateAction<SiteAsset[]>>] => {
    switch (type) {
      case "social_site":
        return [socialSites, setSocialSites];
      case "web2_site":
        return [web2Sites, setWeb2Sites];
      case "additional_site":
        return [additionalSites, setAdditionalSites];
      case "graphics_design":
        return [graphicsDesign, setGraphicsDesign];
      case "content_studio":
        return [contentStudio, setContentStudio];
      case "content_writing":
        return [contentWriting, setContentWriting];
      case "backlinks":
        return [backlinks, setBacklinks];
      case "completed_com":
        return [completedCom, setCompletedCom];
      case "youtube_video_optimization":
        return [youtubeOptimization, setYoutubeOptimization];
      case "monitoring":
        return [monitoring, setMonitoring];
      case "review_removal":
        return [reviewRemoval, setReviewRemoval];
      case "summary_report":
        return [summaryReport, setSummaryReport];
    }
  };

  const addSiteAsset = (type: SiteAssetTypeTS) => {
    const [list, setter] = getListAndSetter(type);
    const newAsset: SiteAsset = {
      type,
      name: "",
      url: "",
      description: "",
      isRequired: false,
      defaultPostingFrequency: 3,
      defaultIdealDurationMinutes: 30,
    };
    setter([...list, newAsset]);
  };

  const removeSiteAsset = (type: SiteAssetTypeTS, index: number) => {
    const [list, setter] = getListAndSetter(type);
    setter(list.filter((_, i) => i !== index));
  };

  const updateSiteAsset = (
    type: SiteAssetTypeTS,
    index: number,
    field: keyof SiteAsset,
    value: any
  ) => {
    const [list, setter] = getListAndSetter(type);
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value } as SiteAsset;
    setter(updated);
  };

  const nextStep = () =>
    currentStep < steps.length - 1 && setCurrentStep(currentStep + 1);
  const prevStep = () =>
    currentStep > 0 && setCurrentStep(currentStep - 1);
  const canProceed = () => (currentStep === 0 ? name.trim().length > 0 : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    setLoading(true);
    try {
      // Collect all lists
      const allSiteAssets = [
        socialSites,
        web2Sites,
        additionalSites,
        graphicsDesign,
        contentStudio,
        contentWriting,
        backlinks,
        completedCom,
        youtubeOptimization,
        monitoring,
        reviewRemoval,
        summaryReport,
      ]
        .flat()
        .filter((site) => site.name.trim());

      const templateData = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        packageId,
        sitesAssets: allSiteAssets,
      };

      const url =
        isEditMode && initialData
          ? `/api/templates/${initialData.id}`
          : "/api/templates";
      const method = isEditMode ? "PUT" : "POST";

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id && user.id.trim() !== "")
        headers["x-actor-id"] = user.id.trim();

      const payload: any = { ...templateData };
      if (user?.id && user.id.trim() !== "") payload.actorId = user.id.trim();

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          isEditMode
            ? "Template updated successfully"
            : "Template created successfully"
        );
        onCreated();
        onClose();
        resetForm();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.message || "Failed to save template");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving the template");
    } finally {
      setLoading(false);
    }
  };

  const renderSiteAssetFields = (
    sites: SiteAsset[],
    type: SiteAssetTypeTS,
    title: string,
    icon: React.ReactNode,
    colorClass: string
  ) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-md ${colorClass} text-white`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-500">
              Configure your {title.toLowerCase()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-gray-100">
          {sites.filter((site) => site.name.trim()).length} Sites
        </Badge>
      </div>

      <div className="space-y-3">
        {sites.map((site, index) => (
          <Card key={index} className="border shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">
                      Site Name *
                    </Label>
                    <Input
                      value={site.name}
                      onChange={(e) =>
                        updateSiteAsset(type, index, "name", e.target.value)
                      }
                      placeholder="e.g., Facebook, Medium, etc."
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">
                      URL
                    </Label>
                    <Input
                      value={site.url}
                      onChange={(e) =>
                        updateSiteAsset(type, index, "url", e.target.value)
                      }
                      placeholder="https://..."
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">
                      Description
                    </Label>
                    <Textarea
                      value={site.description || ""}
                      onChange={(e) =>
                        updateSiteAsset(type, index, "description", e.target.value)
                      }
                      placeholder="Brief description of this site/asset..."
                      rows={2}
                      className="bg-white"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSiteAsset(type, index)}
                  className="h-8 w-8 text-gray-400 hover:text-red-500 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  <Switch
                    checked={site.isRequired}
                    onCheckedChange={(checked) =>
                      updateSiteAsset(type, index, "isRequired", checked)
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Label className="text-xs font-medium text-gray-600">
                    Required
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Posts per Month
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={site.defaultPostingFrequency}
                    onChange={(e) =>
                      updateSiteAsset(
                        type,
                        index,
                        "defaultPostingFrequency",
                        Number.parseInt(e.target.value || "1", 10) || 1
                      )
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={site.defaultIdealDurationMinutes}
                    onChange={(e) =>
                      updateSiteAsset(
                        type,
                        index,
                        "defaultIdealDurationMinutes",
                        Number.parseInt(e.target.value || "30", 10) || 30
                      )
                    }
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => addSiteAsset(type)}
          className="flex-1 border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {title.slice(0, -1)}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={initializeDefaultAssets}
          className="flex-1"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Reset Defaults
        </Button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-blue-100 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <p className="text-sm text-gray-500">Set up your template details</p>
              </div>
            </div>

            <Card className="border shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">
                      Template Name *
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter template name"
                      className="bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-600">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Draft
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this template..."
                    rows={3}
                    className="bg-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1:
        return renderSiteAssetFields(
          socialSites,
          "social_site",
          "Social Sites",
          <Share2 className="w-5 h-5" />,
          "bg-blue-500"
        );

      case 2:
        return renderSiteAssetFields(
          web2Sites,
          "web2_site",
          "Web 2.0 Sites",
          <Globe className="w-5 h-5" />,
          "bg-purple-500"
        );

      case 3:
        return renderSiteAssetFields(
          additionalSites,
          "additional_site",
          "Additional Sites",
          <Sparkles className="w-5 h-5" />,
          "bg-green-500"
        );

      case 4:
        return renderSiteAssetFields(
          graphicsDesign,
          "graphics_design",
          "Graphics Design",
          <Palette className="w-5 h-5" />,
          "bg-rose-500"
        );

      case 5:
        return renderSiteAssetFields(
          contentStudio,
          "content_studio",
          "Content Studio",
          <PenTool className="w-5 h-5" />,
          "bg-emerald-500"
        );

      case 6:
        return renderSiteAssetFields(
          contentWriting,
          "content_writing",
          "Content Writing",
          <FileEdit className="w-5 h-5" />,
          "bg-indigo-500"
        );

      case 7:
        return renderSiteAssetFields(
          backlinks,
          "backlinks",
          "Backlinks",
          <LinkIcon className="w-5 h-5" />,
          "bg-sky-500"
        );

      case 8:
        return renderSiteAssetFields(
          completedCom,
          "completed_com",
          "Completed.com",
          <CheckCircle className="w-5 h-5" />,
          "bg-green-500"
        );

      case 9:
        return renderSiteAssetFields(
          youtubeOptimization,
          "youtube_video_optimization",
          "YouTube Optimization",
          <Youtube className="w-5 h-5" />,
          "bg-red-500"
        );

      case 10:
        return renderSiteAssetFields(
          monitoring,
          "monitoring",
          "Monitoring",
          <BarChart className="w-5 h-5" />,
          "bg-slate-500"
        );

      case 11:
        return renderSiteAssetFields(
          reviewRemoval,
          "review_removal",
          "Review Removal",
          <ShieldAlert className="w-5 h-5" />,
          "bg-amber-500"
        );

      case 12:
        return renderSiteAssetFields(
          summaryReport,
          "summary_report",
          "Summary Report",
          <FileBarChart className="w-5 h-5" />,
          "bg-fuchsia-500"
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] overflow-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            {isEditMode ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => {
              const Icon = step.icon as any;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isActive
                          ? "bg-blue-500 text-white shadow"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="mt-1 text-center">
                      <p
                        className={`text-xs font-medium ${
                          isActive ? "text-blue-600" : "text-gray-600"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full ${
                        isCompleted ? "bg-green-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="h-1 bg-gray-200"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1 pb-3">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update Template"
                ) : (
                  "Create Template"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}