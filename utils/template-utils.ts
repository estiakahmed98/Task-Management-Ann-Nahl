import type { Template } from "@/data/template-types";
import { mockTemplates } from "@/data/mock-templates";

// Generate more templates for each package
export const generateTemplatesForPackage = (packageId: string): Template[] => {
  // Use the mock templates as a base and add some variation
  return mockTemplates.map((template, index) => ({
    ...template,
    id: `${packageId}-${template.id}`,
    clientName: template.clientName + (index % 2 === 0 ? " Jr." : " Sr."),
    companyName:
      template.companyName +
      (index % 3 === 0 ? " Global" : index % 3 === 1 ? " Ltd." : " Inc."),
  }));
};

// Status label mapping
export const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

// Status variant mapping for styling
export const statusVariants = {
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  "in-progress": "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
};
