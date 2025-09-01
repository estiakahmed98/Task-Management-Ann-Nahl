"use client";

import { useEffect, useState } from "react";
import { Edit, FileText, Plus, Save, Trash2, Users } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import data from separate files
import { initialProjects } from "@/data/projects";
import { taskCategories } from "@/data/task-categories";
import { packages } from "@/data/packages";

const AgentProjects = () => {
  const [projects, setProjects] = useState(initialProjects);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [organizedTasks, setOrganizedTasks] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTaskCategory, setCurrentTaskCategory] = useState("");
  const [currentTaskName, setCurrentTaskName] = useState("");
  const [taskFields, setTaskFields] = useState<any[]>([
    { id: 1, name: "", link: "", notes: "" },
  ]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedProjects = localStorage.getItem("agentProjects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save data to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem("agentProjects", JSON.stringify(projects));
  }, [projects]);

  const openProjectDetails = (project: any) => {
    setCurrentProject(project);
    setOrganizedTasks(project.organizedTasks || []);
    setIsProjectModalOpen(true);
  };

  const saveOrganizedTasks = () => {
    const updatedProjects = projects.map((project) => {
      if (project.id === currentProject.id) {
        return {
          ...project,
          organizedTasks: organizedTasks,
        };
      }
      return project;
    });

    setProjects(updatedProjects);
    setIsProjectModalOpen(false);
  };

  const openAddTaskModal = () => {
    setCurrentTaskCategory("");
    setCurrentTaskName("");
    setTaskFields([{ id: 1, name: "", link: "", notes: "" }]);
    setIsTaskModalOpen(true);
  };

  const addTaskField = () => {
    setTaskFields([
      ...taskFields,
      {
        id: taskFields.length + 1,
        name: "",
        link: "",
        notes: "",
      },
    ]);
  };

  const updateTaskField = (id: number, field: string, value: string) => {
    setTaskFields(
      taskFields.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeTaskField = (id: number) => {
    if (taskFields.length > 1) {
      setTaskFields(taskFields.filter((item) => item.id !== id));
    }
  };

  const saveTask = () => {
    if (!currentTaskCategory || !currentTaskName) return;

    const newTask = {
      id: Date.now(),
      category: currentTaskCategory,
      name: currentTaskName,
      fields: taskFields,
    };

    setOrganizedTasks([...organizedTasks, newTask]);
    setIsTaskModalOpen(false);
  };

  const removeTask = (taskId: number) => {
    setOrganizedTasks(organizedTasks.filter((task) => task.id !== taskId));
  };

  const getPackageDetails = (packageName: string) => {
    return packages.find((pkg) => pkg.name === packageName) || null;
  };

  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((project) => project.status === activeTab);

  return (
    <div>
      <div className="p-4">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-xl font-medium">Client Projects</h1>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const packageDetails = getPackageDetails(project.packageName);

              return (
                <Card
                  key={project.id}
                  className="border rounded-md overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          <Image
                            src={project.logo || "/placeholder.svg"}
                            alt={project.clientName}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {project.clientName}
                          </CardTitle>
                          <CardDescription>
                            {project.packageName}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        className={`
                          ${
                            project.status === "draft"
                              ? "bg-yellow-100 text-yellow-800"
                              : ""
                          }
                          ${
                            project.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : ""
                          }
                          ${
                            project.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        `}
                      >
                        {project.status === "draft" ? "Draft" : ""}
                        {project.status === "in-progress" ? "In Progress" : ""}
                        {project.status === "completed" ? "Completed" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 mb-4">
                      {project.description}
                    </div>

                    {packageDetails && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">
                            {packageDetails.duration}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Social Sites:</span>
                          <span className="font-medium">
                            {packageDetails.socialSites}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Web Profiles:</span>
                          <span className="font-medium">
                            {packageDetails.web2s}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Assets:</span>
                          <span className="font-medium">
                            {packageDetails.additionalAssets}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-gray-500" />
                        <span>{project.draftTasks.length} draft tasks</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gray-500" />
                        <span>
                          {project.organizedTasks.length} organized tasks
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-between pt-3">
                    <div className="text-xs text-gray-500">
                      Due: {new Date(project.dueDate).toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => openProjectDetails(project)}
                    >
                      Manage Tasks
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Details Modal */}
      {currentProject && (
        <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
          <DialogContent className="sm:max-w-[800px] p-0 max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {currentProject.clientName}
                    <Badge
                      className={`ml-2 text-xs
                        ${
                          currentProject.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : ""
                        }
                        ${
                          currentProject.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : ""
                        }
                        ${
                          currentProject.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      `}
                    >
                      {currentProject.status === "draft" ? "Draft" : ""}
                      {currentProject.status === "in-progress"
                        ? "In Progress"
                        : ""}
                      {currentProject.status === "completed" ? "Completed" : ""}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    Package: {currentProject.packageName} • Due:{" "}
                    {new Date(currentProject.dueDate).toLocaleDateString()}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 pt-2 overflow-y-auto flex-1">
              <Tabs defaultValue="draft">
                <TabsList className="mb-4">
                  <TabsTrigger value="draft">Draft Tasks</TabsTrigger>
                  <TabsTrigger value="organized">Organized Tasks</TabsTrigger>
                </TabsList>

                <TabsContent value="draft" className="space-y-4">
                  <div className="text-sm text-gray-500 mb-2">
                    These are unorganized tasks submitted by the client or team
                    members. Review and organize them into structured tasks.
                  </div>

                  <div className="border rounded-md divide-y">
                    {currentProject.draftTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="p-3 flex items-center justify-between"
                      >
                        <div className="text-sm">{task.text}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="organized" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500">
                      Organize tasks by category and add detailed fields for
                      each task.
                    </div>
                    <Button size="sm" onClick={openAddTaskModal}>
                      <Plus size={14} className="mr-1" /> Add Task
                    </Button>
                  </div>

                  {organizedTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No organized tasks yet. Click "Add Task" to create your
                      first task.
                    </div>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {organizedTasks.map((task) => {
                        const category = taskCategories.find(
                          (c) => c.id === task.category
                        );

                        return (
                          <AccordionItem
                            key={task.id}
                            value={`task-${task.id}`}
                            className="border rounded-md overflow-hidden"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2 text-left">
                                <Badge
                                  variant="outline"
                                  className="bg-white text-xs"
                                >
                                  {category?.name || task.category}
                                </Badge>
                                <span className="font-medium">{task.name}</span>
                                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                                  {task.fields.length} items
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-3 pt-0">
                              <div className="border rounded-md overflow-hidden">
                                <div className="grid grid-cols-12 gap-2 bg-gray-50 p-2 text-xs font-medium text-gray-500">
                                  <div className="col-span-1">#</div>
                                  <div className="col-span-3">Name</div>
                                  <div className="col-span-4">Link</div>
                                  <div className="col-span-4">Notes</div>
                                </div>

                                {task.fields.map(
                                  (field: any, index: number) => (
                                    <div
                                      key={field.id}
                                      className="grid grid-cols-12 gap-2 p-2 text-sm border-t"
                                    >
                                      <div className="col-span-1 text-gray-500">
                                        {index + 1}
                                      </div>
                                      <div className="col-span-3">
                                        {field.name || "-"}
                                      </div>
                                      <div className="col-span-4 truncate">
                                        {field.link ? (
                                          <a
                                            href={field.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate block"
                                          >
                                            {field.link}
                                          </a>
                                        ) : (
                                          "-"
                                        )}
                                      </div>
                                      <div className="col-span-4">
                                        {field.notes || "-"}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>

                              <div className="flex justify-end mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs text-red-600 hover:text-red-700"
                                  onClick={() => removeTask(task.id)}
                                >
                                  <Trash2 size={14} className="mr-1" /> Remove
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="p-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveOrganizedTasks}
                className="bg-[#00b894] hover:bg-[#00a382]"
              >
                <Save size={14} className="mr-1" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Task Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl">Add New Task</DialogTitle>
            <DialogDescription>
              Create a structured task with multiple fields
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2 overflow-y-auto flex-1">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-category">Category</Label>
                  <Select
                    value={currentTaskCategory}
                    onValueChange={setCurrentTaskCategory}
                  >
                    <SelectTrigger id="task-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    value={currentTaskName}
                    onChange={(e) => setCurrentTaskName(e.target.value)}
                    placeholder="e.g., Create Social Media Profiles"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Task Fields</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTaskField}
                    className="text-xs"
                  >
                    <Plus size={14} className="mr-1" /> Add Field
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-gray-50 p-2 text-xs font-medium text-gray-500">
                    <div className="col-span-1">#</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-3">Link</div>
                    <div className="col-span-4">Notes</div>
                    <div className="col-span-1"></div>
                  </div>

                  {taskFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 p-2 text-sm border-t"
                    >
                      <div className="col-span-1 flex items-center text-gray-500">
                        {index + 1}
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={field.name}
                          onChange={(e) =>
                            updateTaskField(field.id, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={field.link}
                          onChange={(e) =>
                            updateTaskField(field.id, "link", e.target.value)
                          }
                          placeholder="URL"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={field.notes}
                          onChange={(e) =>
                            updateTaskField(field.id, "notes", e.target.value)
                          }
                          placeholder="Additional notes"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTaskField(field.id)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                          disabled={taskFields.length === 1}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveTask}
              disabled={!currentTaskCategory || !currentTaskName}
              className="bg-[#00b894] hover:bg-[#00a382]"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentProjects;
