"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface ExportPreviewProps {
  exportType: string;
  exportData: any;
  fileName: string;
  onDownload: () => void;
  onPrint: () => void;
  onClose: () => void;
}

export function ExportPreview({
  exportType,
  exportData,
  fileName,
  onDownload,
  onPrint,
  onClose,
}: ExportPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; // Simulated total pages

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {fileName}.{exportType.toLowerCase()}
          </h2>
          <p className="text-sm text-muted-foreground">
            Preview of your export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-md bg-white p-6">
        {exportData.title && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{exportData.title}</h1>
            <p className="text-muted-foreground">{exportData.description}</p>
            <div className="mt-2 text-sm text-muted-foreground">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
        )}

        {currentPage === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tasks Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-2xl font-bold">5</div>
                        <div className="text-xs text-muted-foreground">
                          Pending
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-xs text-muted-foreground">
                          In Progress
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">1</div>
                        <div className="text-xs text-muted-foreground">
                          Completed
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Overall Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">13%</div>
                    <Progress value={13} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Package Information
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm font-medium">Package Name</div>
                    <div>DFP90</div>
                    <div className="text-sm font-medium">Duration</div>
                    <div>90 Days</div>
                    <div className="text-sm font-medium">Start Date</div>
                    <div>March 15, 2023</div>
                    <div className="text-sm font-medium">End Date</div>
                    <div>June 13, 2023</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Task Details</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Create Facebook post",
                  status: "pending",
                  category: "Social",
                  agent: "Alice Johnson",
                  dueDate: "Apr 15, 2023",
                },
                {
                  title: "Design Instagram story",
                  status: "pending",
                  category: "Social",
                  agent: "Diana Miller",
                  dueDate: "Apr 18, 2023",
                },
                {
                  title: "Write blog article",
                  status: "in-progress",
                  category: "Content",
                  agent: "Bob Smith",
                  dueDate: "Apr 20, 2023",
                },
                {
                  title: "Design new logo",
                  status: "completed",
                  category: "Design",
                  agent: "Diana Miller",
                  dueDate: "Apr 10, 2023",
                  completedDate: "Apr 9, 2023",
                },
              ].map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        task.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : task.status === "in-progress"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    >
                      {task.status === "completed"
                        ? "Completed"
                        : task.status === "in-progress"
                        ? "In Progress"
                        : "Pending"}
                    </Badge>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{task.category}</span>
                        <span>•</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {task.agent
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.agent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    Task Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">12.5%</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      1 of 8 tasks completed
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      +0.5% from last month
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-lg font-medium mb-3">Agent Performance</h3>
                <div className="space-y-3">
                  {[
                    {
                      name: "Alice Johnson",
                      completed: 12,
                      inProgress: 3,
                      pending: 2,
                    },
                    {
                      name: "Bob Smith",
                      completed: 8,
                      inProgress: 4,
                      pending: 3,
                    },
                    {
                      name: "Diana Miller",
                      completed: 15,
                      inProgress: 1,
                      pending: 0,
                    },
                  ].map((agent, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {agent.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {agent.completed}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {agent.inProgress}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            In Progress
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {agent.pending}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Pending
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="text-sm">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
