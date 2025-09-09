"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description?: string;
  status?: string;
  package?: {
    id: string;
    name: string;
  };
}

export default function TemplateDetailsInPackagePage() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/templates/${templateId}`);
        const data = await res.json();
        setTemplate(data);
      } catch (error) {
        console.error("Error loading template:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!template)
    return <p className="p-4 text-red-500">Template not found</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold">Template: {template.name}</h1>
      <p className="text-muted-foreground">
        Description: {template.description || "N/A"}
      </p>
      <p className="text-sm text-amber-600">
        Status: {template.status || "N/A"}
      </p>
      <p className="text-sm text-blue-600">
        Package: {template.package?.name || "No Package"}
      </p>
    </div>
  );
}
