"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, CheckCircle, ArrowLeft, User, Globe, Package, FileText, Image as ImageIcon, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AssignmentPreview } from "./assignment-preview";

type AMUser = { id: string; name: string | null; email: string | null };

export function ReviewInfo({ formData, onPrevious }: any) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [packageName, setPackageName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [ams, setAms] = useState<AMUser[]>([]);
  const [amName, setAmName] = useState<string | null>(null);
  const router = useRouter();

  // Resolve AM list + names for display
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // packages/templates
        if (formData.packageId) {
          const r = await fetch(`/api/packages/${formData.packageId}`);
          const j = await r.json();
          if (mounted && j?.name) setPackageName(j.name);
        }
        if (formData.templateId) {
          const r = await fetch(`/api/packages/templates/${formData.templateId}`);
          const j = await r.json();
          if (mounted && j?.name) setTemplateName(j.name);
        }

        // AMs
        const res = await fetch(`/api/users?role=am&limit=100`, { cache: "no-store" });
        const json = await res.json();
        const raw = (json?.users ?? json?.data ?? []) as any[];
        const list: AMUser[] = raw
          .filter((u) => u?.role?.name === "am")
          .map((u) => ({ id: u.id, name: u.name ?? null, email: u.email ?? null }));
        if (!mounted) return;
        setAms(list);
        if (formData.amId) {
          const found = list.find((u) => u.id === formData.amId);
          setAmName(found ? (found.name || found.email || found.id) : formData.amId);
        }
      } catch {
        // non-blocking
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [formData.packageId, formData.templateId, formData.amId]);

  const handleDownload = () => {
    const jsonData = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client-onboarding-data.json";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("JSON file downloaded successfully!");
  };

  const handleSubmit = async () => {
    setIsSaving(true);
  
    try {
      const clientData = {
        // core
        name: formData.name,
        birthdate: formData.birthdate,
        company: formData.company,
        designation: formData.designation,
        location: formData.location,
  
        // contact / credentials (new)
        email: formData.email || null,
        phone: formData.phone || null,
        password: formData.password || null,
        recoveryEmail: formData.recoveryEmail || null,
  
        // websites + meta
        website: formData.website,
        website2: formData.website2,
        website3: formData.website3,
        companywebsite: formData.companywebsite,
        companyaddress: formData.companyaddress,
        biography: formData.biography,
        imageDrivelink: formData.imageDrivelink,
  
        // avatar stays string (NOT binary) for now
        avatar: formData.avatar || null,
  
        // project
        progress: formData.progress,
        status: formData.status,
        packageId: formData.packageId,
        startDate: formData.startDate,
        dueDate: formData.dueDate,
  
        // AM (new)
        amId: formData.amId || null,
  
        // socials
        socialLinks: formData.socialLinks || [],
      };
  
      const clientRes = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
  
      const clientResult = await clientRes.json();
  
      if (!clientRes.ok) {
        toast.error(clientResult.error || "Failed to create client.");
        return;
      }
  
      const createdClientId: string =
        clientResult?.id ?? clientResult?.client?.id ?? clientResult?.data?.id;
  
      toast.success("Client created successfully!");
  
      // auto-assign template (unchanged)
      if (formData.templateId && createdClientId) {
        try {
          const assignment = {
            id: `assignment-${Date.now()}`,
            templateId: formData.templateId,
            clientId: createdClientId,
            assignedAt: new Date().toISOString(),
            status: "active",
          };
  
          const assignmentRes = await fetch("/api/assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(assignment),
          });
  
          if (assignmentRes.ok) {
            toast.success(`Template "${templateName || formData.templateId}" assigned successfully!`);
          } else {
            toast.warning("Client created but template assignment failed. You can assign it manually later.");
          }
        } catch {
          toast.warning("Client created but template assignment failed. You can assign it manually later.");
        }
      }
  
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };
  

  // Preview: build a local preview URL if we have a File
  const avatarPreviewUrl = useMemo(() => {
    if (formData?.profilePicture instanceof File) {
      return URL.createObjectURL(formData.profilePicture);
    }
    return null;
  }, [formData?.profilePicture]);

  if (isSubmitted) {
    return (
      <div className="text-center space-y-8 py-12">
        <div className="flex justify-center">
          <div className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-6">
            <CheckCircle className="h-20 w-20 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Submission Successful!
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Thank you for completing the onboarding process. Your client information has been saved successfully and is ready for processing.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button onClick={handleDownload} variant="outline" className="hover:bg-green-50 hover:text-green-700 hover:border-green-300">
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
          <Button
            onClick={() => router.push("/admin/clients")}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Personal Information",
      icon: User,
      color: "from-blue-500 to-cyan-500",
      items: [
        { label: "Full Name", value: formData.name },
        { label: "Birth Date", value: formData.birthdate ? new Date(formData.birthdate).toLocaleDateString() : null },
        { label: "Location", value: formData.location },
        { label: "Company", value: formData.company },
        { label: "Designation", value: formData.designation },
        { label: "Status", value: formData.status },
        { label: "Account Manager", value: amName },
      ].filter((i) => i.value),
    },
    {
      title: "Website Information",
      icon: Globe,
      color: "from-purple-500 to-pink-500",
      items: [
        { label: "Primary Website", value: formData.website },
        { label: "Secondary Website", value: formData.website2 },
        { label: "Third Website", value: formData.website3 },
        { label: "Company Website", value: formData.companywebsite },
        { label: "Company Address", value: formData.companyaddress },
      ].filter((i) => i.value),
    },
    {
      title: "Project Details",
      icon: Package,
      color: "from-green-500 to-emerald-500",
      items: [
        { label: "Package", value: packageName || formData.packageId },
        { label: "Template", value: templateName || formData.templateId },
        { label: "Start Date", value: formData.startDate ? new Date(formData.startDate).toLocaleDateString() : null },
        { label: "Due Date", value: formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : null },
        { label: "Progress", value: typeof formData.progress === "number" ? `${formData.progress}%` : null },
      ].filter((i) => i.value),
    },
    {
      title: "Contact & Credentials (Optional)",
      icon: FileText,
      color: "from-amber-500 to-orange-500",
      items: [
        { label: "Email", value: formData.email },
        { label: "Phone", value: formData.phone },
        // Do not display raw password in review for safety; show masked
        { label: "Password", value: formData.password ? "********" : null },
        { label: "Recovery Email", value: formData.recoveryEmail },
      ].filter((i) => i.value),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Review Your Information
        </h1>
        <p className="text-gray-500 text-lg">Please review all the information below before submitting your onboarding details.</p>
      </div>

      <div className="grid gap-6">
        {sections.map(
          (section, index) =>
            section.items.length > 0 && (
              <Card key={index} className="overflow-hidden border-0 shadow-lg">
                <CardHeader className={`bg-gradient-to-r ${section.color} text-white`}>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <section.icon className="w-6 h-6" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                        <span className="text-gray-900 font-medium break-words">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ),
        )}

        {/* Biography */}
        {formData.biography && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="w-6 h-6" />
                Biography
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{formData.biography}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Drive Link */}
        {formData.imageDrivelink && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <ImageIcon className="w-6 h-6" />
                Image Gallery
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <a
                href={formData.imageDrivelink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium"
              >
                {formData.imageDrivelink}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Avatar Preview (from file) */}
        {avatarPreviewUrl && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-sky-500 to-blue-600 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <ImageIcon className="w-6 h-6" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarPreviewUrl} alt="Avatar preview" className="h-24 w-24 rounded-full object-cover border" />
            </CardContent>
          </Card>
        )}

        {/* Social links */}
        {formData.socialLinks && formData.socialLinks.length > 0 && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Share2 className="w-6 h-6" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.socialLinks.map(
                  (link: any, index: number) =>
                    link.platform &&
                    link.url && (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="secondary" className="font-medium">
                          {link.platform}
                        </Badge>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1"
                        >
                          {link.url}
                        </a>
                      </div>
                    ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {formData.templateId && (
          <AssignmentPreview templateId={formData.templateId} packageId={formData.packageId || ""} templateName={templateName} />
        )}
      </div>

      <div className="flex justify-between pt-8">
        <Button
          variant="outline"
          onClick={onPrevious}
          className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 hover:border-purple-300"
        >
          Previous
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg px-8"
        >
          {isSaving ? "Saving..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
