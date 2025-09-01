"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  MoreHorizontal,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskListProps {
  status?: string;
}

export function TaskList({ status }: TaskListProps) {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Create Facebook post",
      status: "pending",
      category: "Social",
      agent: { name: "Alice Johnson", avatar: "AJ" },
      dueDate: "Apr 15, 2023",
      comments: [
        {
          author: "John Smith",
          text: "Please include our new product line",
          time: "2 days ago",
        },
        {
          author: "Alice Johnson",
          text: "Will do, I'll prepare a draft by tomorrow",
          time: "1 day ago",
        },
      ],
    },
    {
      id: 2,
      title: "Design Instagram story",
      status: "pending",
      category: "Social",
      agent: { name: "Diana Miller", avatar: "DM" },
      dueDate: "Apr 18, 2023",
      comments: [
        {
          author: "Sarah Johnson",
          text: "Make sure to use the brand colors",
          time: "3 days ago",
        },
      ],
    },
    {
      id: 3,
      title: "Write blog article",
      status: "in-progress",
      category: "Content",
      agent: { name: "Bob Smith", avatar: "BS" },
      dueDate: "Apr 20, 2023",
      comments: [
        {
          author: "Robert Garcia",
          text: "The topic should focus on industry trends",
          time: "4 days ago",
        },
        {
          author: "Bob Smith",
          text: "I've started the research phase",
          time: "2 days ago",
        },
      ],
    },
    {
      id: 4,
      title: "Design new logo",
      status: "completed",
      category: "Design",
      agent: { name: "Diana Miller", avatar: "DM" },
      dueDate: "Apr 10, 2023",
      completedDate: "Apr 9, 2023",
      comments: [
        {
          author: "John Smith",
          text: "Looks great! Approved.",
          time: "5 days ago",
        },
      ],
    },
    {
      id: 5,
      title: "Create banner ads",
      status: "pending",
      category: "Design",
      agent: { name: "Edward Wilson", avatar: "EW" },
      dueDate: "Apr 25, 2023",
      comments: [],
    },
    {
      id: 6,
      title: "SEO optimization",
      status: "in-progress",
      category: "Content",
      agent: { name: "Charlie Davis", avatar: "CD" },
      dueDate: "Apr 30, 2023",
      comments: [
        {
          author: "Thomas Anderson",
          text: "Focus on these keywords: client, dashboard, management",
          time: "1 week ago",
        },
      ],
    },
    {
      id: 7,
      title: "Email newsletter",
      status: "pending",
      category: "Content",
      agent: { name: "Bob Smith", avatar: "BS" },
      dueDate: "May 5, 2023",
      comments: [],
    },
    {
      id: 8,
      title: "Product photography",
      status: "pending",
      category: "Design",
      agent: { name: "Diana Miller", avatar: "DM" },
      dueDate: "May 10, 2023",
      comments: [],
    },
  ]);

  const filteredTasks = status
    ? tasks.filter((task) => task.status === status)
    : tasks;

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id === selectedTask.id) {
        return {
          ...task,
          comments: [
            ...task.comments,
            {
              author: "John Smith",
              text: newComment,
              time: "Just now",
            },
          ],
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    setNewComment("");

    // Update the selected task with the new comment
    const updatedTask = updatedTasks.find(
      (task) => task.id === selectedTask.id
    );
    setSelectedTask(updatedTask);
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
          ...(newStatus === "completed"
            ? {
                completedDate: new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              }
            : {}),
        };
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  return (
    <div className="space-y-4">
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          className="flex flex-col rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3 sm:items-center">
            <div className="mt-0.5 sm:mt-0">
              {task.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : task.status === "in-progress" ? (
                <Clock className="h-5 w-5 text-blue-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <Badge variant="outline" className="ml-2">
                  {task.category}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{task.agent.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Due: {task.dueDate}</span>
                </div>
                {task.status === "completed" && task.completedDate && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed: {task.completedDate}</span>
                  </div>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2"
                      onClick={() => setSelectedTask(task)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{task.comments.length} comments</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>{task.title}</DialogTitle>
                      <DialogDescription>
                        Task comments and discussion
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] space-y-4 overflow-y-auto py-4">
                      {selectedTask?.comments.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                          No comments yet
                        </p>
                      ) : (
                        selectedTask?.comments.map(
                          (comment: any, index: number) => (
                            <div
                              key={index}
                              className="flex gap-3 rounded-lg border p-3"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {comment.author
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {comment.author}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {comment.time}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm">{comment.text}</p>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        className="flex-1"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button onClick={handleAddComment}>Post</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 sm:mt-0">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src="/placeholder.svg?height=32&width=32"
                alt={task.agent.name}
              />
              <AvatarFallback>{task.agent.avatar}</AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange(task.id, "pending")}
                >
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(task.id, "in-progress")}
                >
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(task.id, "completed")}
                >
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                <DropdownMenuItem>Delete Task</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
      {filteredTasks.length === 0 && (
        <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No tasks found</p>
          <Button variant="outline" size="sm" className="mt-4">
            Create a new task
          </Button>
        </div>
      )}
    </div>
  );
}
