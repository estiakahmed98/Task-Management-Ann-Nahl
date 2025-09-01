"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { AgentStatsCards } from "@/components/agents/agent-stats-cards";
import { AgentFilters } from "@/components/agents/agent-filters";
import { AgentCard } from "@/components/agents/agent-card";
import { AgentListView } from "@/components/agents/agent-list-view";
import { AgentDetailsDialog } from "@/components/agents/agent-details-dialog";
import { EmptyState } from "@/components/agents/empty-state";
import { Agent } from "@/components/task-distribution/distribution-types";

export default function AllAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("card");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/agents");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Agent[] = await response.json();
      setAgents(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch agents.");
      console.error("Failed to fetch agents:", err);
      toast.error(err.message || "Failed to fetch agents. Please try again.", {
        description: "Error fetching agents",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const response = await fetch("/api/agents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: agentId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setAgents((prevAgents) =>
        prevAgents.filter((agent) => agent.id !== agentId)
      );
      toast.success("The agent has been successfully removed.", {
        description: "Agent Deleted",
      });
    } catch (err: any) {
      console.error("Failed to delete agent:", err);
      toast.error(err.message || "Failed to delete agent. Please try again.", {
        description: "Error deleting agent",
      });
    }
  };

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailsDialogOpen(true);
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || agent.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const pendingAgents = agents.filter((a) => a.status === "pending").length;
  const activePercentage =
    totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;

  const uniqueCategories = Array.from(
    new Set(agents.map((agent) => agent.category))
  ).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-900 dark:text-gray-50">
                  Loading agents...
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-6">
              <div className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto">
                <Users className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xl font-medium text-red-600 dark:text-red-400">
                    Something went wrong
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
                <Button
                  onClick={fetchAgents}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent py-1">
                All Agents
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                Manage and monitor all agents in your organization with powerful
                tools and insights
              </p>
            </div>
            <Link href="/admin/agents/create">
              <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-base font-medium rounded-md">
                <Plus className="h-5 w-5" />
                Add New Agent
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <AgentStatsCards
            totalAgents={totalAgents}
            activeAgents={activeAgents}
            pendingAgents={pendingAgents}
            activePercentage={activePercentage}
          />

          {/* Management Card */}
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-blue-500/20">
              <CardHeader className="pb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      Agent Management
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 text-base mt-1">
                      Search, filter, and manage all agents in your organization
                      with ease
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </div>

            <CardContent className="p-8">
              {/* Filters */}
              <div className="mb-8">
                <AgentFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  uniqueCategories={uniqueCategories}
                />
              </div>

              {/* Agents Display */}
              {viewMode === "list" ? (
                <AgentListView
                  agents={filteredAgents}
                  onDelete={handleDeleteAgent}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgents.length === 0 ? (
                    <EmptyState />
                  ) : (
                    filteredAgents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onDelete={handleDeleteAgent}
                        onViewDetails={handleViewDetails}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Results Summary */}
              {filteredAgents.length > 0 && (
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-50">
                      {filteredAgents.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-900 dark:text-gray-50">
                      {agents.length}
                    </span>{" "}
                    agents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-gray-200 dark:border-gray-700 text-gray-400 bg-transparent"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-gray-200 dark:border-gray-700 text-gray-400 bg-transparent"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Details Dialog */}
        <AgentDetailsDialog
          agent={selectedAgent}
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      </div>
    </div>
  );
}
