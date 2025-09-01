"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Agent } from "../task-distribution/distribution-types";
import { getInitialsFromParts, nameToColor } from "@/utils/avatar";
import { getStatusBadge } from "./status-badge";
import { getCategoryBadge } from "./category-badge";

interface AgentCardProps {
  agent: Agent;
  onDelete: (id: string) => void;
  onViewDetails: (agent: Agent) => void;
}

const formatJoinDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function AgentCard({ agent, onDelete, onViewDetails }: AgentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const goProfile = () => router.push(`/admin/agents/${agent.id}`);
  const goEdit = () => router.push(`/admin/agents/${agent.id}/edit`);

  return (
    <Card
      onClick={goProfile}
      className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900 hover:scale-[1.02] cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") goProfile();
      }}
      aria-label={`Open ${agent.firstName} ${agent.lastName} profile`}
      title="Open profile"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-3 border-white shadow-lg ring-2 ring-gray-100 dark:ring-gray-800">
              <AvatarImage
                src={agent.image || undefined}
                alt={`${agent.firstName} ${agent.lastName}`}
              />
              <AvatarFallback
                className="text-white font-bold text-lg"
                style={{ backgroundColor: nameToColor(`${agent.firstName} ${agent.lastName}`) }}
              >
                {getInitialsFromParts(agent.firstName, agent.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {agent.firstName} {agent.lastName}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                <Mail className="w-3 h-3 mr-1.5" />
                {agent.email}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(agent.status)}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Category
            </span>
            {getCategoryBadge(agent.category)}
          </div>

          {agent.phone && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Phone
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-50 flex items-center font-medium">
                <Phone className="w-3 h-3 mr-1.5" />
                {agent.phone}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Joined
            </span>
            <span className="text-sm text-gray-900 dark:text-gray-50 flex items-center font-medium">
              <Calendar className="w-3 h-3 mr-1.5" />
              {formatJoinDate(agent.createdAt)}
            </span>
          </div>
        </div>

        {/* Visible action toolbar */}
        <div
          className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => goProfile()}
            aria-label="View details"
          >
            <Eye className="h-4 w-4 mr-2" /> View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={goEdit}
            aria-label="Edit agent"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="h-9"
                aria-label="Delete agent"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete “{agent.firstName}{" "}
                  {agent.lastName}” and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(agent.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
