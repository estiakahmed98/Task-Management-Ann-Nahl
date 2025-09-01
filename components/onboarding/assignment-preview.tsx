"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Clock, Users, FileText, AlertCircle } from 'lucide-react';
import { toast } from "sonner";

interface AssignmentPreviewProps {
  templateId: string;
  packageId: string;
  templateName: string;
}

interface TemplateDetails {
  id: string;
  name: string;
  description: string;
  status: string;
  sitesAssets: Array<{
    id: number;
    name: string;
    type: string;
    isRequired: boolean;
    defaultPostingFrequency: number;
    defaultIdealDurationMinutes: number;
  }>;
  templateTeamMembers: Array<{
    agent: {
      name: string;
      email: string;
    };
    role: string;
  }>;
}

export function AssignmentPreview({ templateId, packageId, templateName }: AssignmentPreviewProps) {
  const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingAssignments, setExistingAssignments] = useState<number>(0);

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!templateId) return;
      
      setLoading(true);
      try {
        // Fetch template details with related data
        const templateRes = await fetch(`/api/packages/templates/${templateId}?include=sitesAssets,templateTeamMembers`);
        if (templateRes.ok) {
          const templateData = await templateRes.json();
          setTemplateDetails(templateData);
        }

        // Fetch existing assignments count
        const assignmentsRes = await fetch(`/api/assignments?templateId=${templateId}`);
        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          setExistingAssignments(assignmentsData.length);
        }
      } catch (error) {
        console.error("Error fetching template details:", error);
        toast.error("Failed to load template details");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [templateId]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <FileText className="w-6 h-6" />
            Assignment Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!templateDetails) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
          <CardTitle className="flex items-center gap-3 text-xl">
            <AlertCircle className="w-6 h-6" />
            Assignment Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load template details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="flex items-center gap-3 text-xl">
          <FileText className="w-6 h-6" />
          Assignment Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Template Overview */}
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            {templateDetails.name}
          </h3>
          <p className="text-gray-600 mb-3">{templateDetails.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              {templateDetails.status}
            </Badge>
            <Badge variant="secondary">
              {existingAssignments} existing assignments
            </Badge>
          </div>
        </div>

        {/* Sites & Assets */}
        {templateDetails.sitesAssets && templateDetails.sitesAssets.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Sites & Assets ({templateDetails.sitesAssets.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templateDetails.sitesAssets.map((asset) => (
                <div key={asset.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{asset.name}</span>
                    {asset.isRequired && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Type: {asset.type}</div>
                    {asset.defaultPostingFrequency && (
                      <div>Frequency: {asset.defaultPostingFrequency}/month</div>
                    )}
                    {asset.defaultIdealDurationMinutes && (
                      <div>Duration: {asset.defaultIdealDurationMinutes} min</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {templateDetails.templateTeamMembers && templateDetails.templateTeamMembers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              Team Members ({templateDetails.templateTeamMembers.length})
            </h4>
            <div className="space-y-2">
              {templateDetails.templateTeamMembers.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium text-sm">{member.agent.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{member.agent.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignment Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• An assignment will be automatically created</li>
            <li>• Team members will be notified</li>
            <li>• Tasks will be generated based on template assets</li>
            <li>• You'll receive a confirmation email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
