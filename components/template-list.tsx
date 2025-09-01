"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { AssignTaskModal } from "@/components/assign-task-modal";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import types and utilities
import type { Task, TemplateStatus } from "@/types/template-type";
import {
  generateTemplatesForPackage,
  statusLabels,
  statusVariants,
} from "@/utils/template-utils";

export function TemplateList({ packageId }: { packageId: string }) {
  const [templates] = useState(generateTemplatesForPackage(packageId));
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TemplateStatus | "all">("all");

  const handleAssignTask = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsModalOpen(true);
  };

  const filteredTemplates =
    activeTab === "all"
      ? templates
      : templates.filter((template) => template.status === activeTab);

  return (
    <div>
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TemplateStatus | "all")}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-8">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader className="p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={template.clientAvatar}
                      alt={template.clientName}
                    />
                    <AvatarFallback>
                      {template.clientName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{template.clientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.companyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                  <StatusBadge status={template.status} large />
                  <div className="flex -space-x-2">
                    {template.teamMembers.map((member) => (
                      <Avatar
                        key={member.id}
                        className="border-2 border-background h-8 w-8"
                      >
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {template.teamMembers.length > 3 && (
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium">
                        +{template.teamMembers.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TaskColumn title="Social" tasks={template.tasks.social} />
                <TaskColumn title="Content" tasks={template.tasks.content} />
                <TaskColumn title="Design" tasks={template.tasks.design} />
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Button
                className="w-full"
                onClick={() => handleAssignTask(template.id)}
                disabled={template.status === "completed"}
              >
                Assign Task
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AssignTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateId={selectedTemplate}
      />
    </div>
  );
}

function TaskColumn({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div>
      <h4 className="font-medium mb-3">{title}</h4>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
          >
            <span className="text-sm">{task.name}</span>
            <StatusBadge status={task.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({
  status,
  large = false,
}: {
  status: TemplateStatus;
  large?: boolean;
}) {
  return (
    <Badge
      variant="outline"
      className={`${statusVariants[status]} ${
        large ? "px-3 py-1 text-sm" : "text-xs"
      }`}
    >
      {statusLabels[status]}
    </Badge>
  );
}
