"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Package, Sparkles, Clock, Users } from 'lucide-react';
import type { StepProps } from "@/types/onboarding";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  status: string;
  packageId: string;
  _count?: {
    sitesAssets: number;
    templateTeamMembers: number;
  };
}

export function TemplateSelection({ formData, updateFormData, onNext, onPrevious }: StepProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(formData.templateId || "");

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!formData.packageId) {
        toast.error("Please select a package first");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/packages/templates?packageId=${formData.packageId}`);
        const data = await res.json();
        
        if (res.ok) {
          setTemplates(data);
          if (data.length === 0) {
            toast.info("No templates found for this package");
          }
        } else {
          toast.error("Failed to fetch templates");
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
        toast.error("Something went wrong while fetching templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [formData.packageId]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    updateFormData({ templateId });
    toast.success("Template selected successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Select Template
          </h1>
          <p className="text-gray-500 mt-2">Loading available templates for your package...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Select Template
        </h1>
        <p className="text-gray-500 mt-2">
          Choose a template that best fits your project requirements and goals.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Templates Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            There are no templates available for the selected package. Please contact support or try a different package.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-purple-500 rounded-full p-1">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {template.description || "A comprehensive template designed to meet your project needs."}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium ${getStatusColor(template.status)}`}
                  >
                    {template.status || 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    {template._count?.sitesAssets && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{template._count.sitesAssets} Assets</span>
                      </div>
                    )}
                    {template._count?.templateTeamMembers && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{template._count.templateTeamMembers} Members</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  className={`w-full mt-4 transition-all duration-200 ${
                    selectedTemplate === template.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-purple-100 hover:to-pink-100 text-gray-700 hover:text-purple-700'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template.id);
                  }}
                >
                  {selectedTemplate === template.id ? 'Selected' : 'Select Template'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 hover:border-purple-300"
        >
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selectedTemplate}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
