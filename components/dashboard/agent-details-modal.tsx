"use client";

import { Calendar, Check, Clock, FileText, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getInitials,
  calculateAgentStats,
  getAllTasks,
} from "@/lib/data-utils";

interface AgentDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAgent: any;
  agents: any[];
  reassignedTasks: Record<string, any>;
  handleReassignTask: (taskId: string, targetAgentId: string) => void;
}

export function AgentDetailsModal({
  isOpen,
  onOpenChange,
  selectedAgent,
  agents,
  reassignedTasks,
  handleReassignTask,
}: AgentDetailsModalProps) {
  if (!selectedAgent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: "1200px",
          maxHeight: "900px",
          overflowY: "auto",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              {getInitials(selectedAgent.name)}
            </div>
            {selectedAgent.name}
            <StatusBadge status={selectedAgent.status} />
          </DialogTitle>
          <DialogDescription>
            {selectedAgent.id} • {selectedAgent.department} •{" "}
            {selectedAgent.email} • {selectedAgent.phone}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <AgentOverviewTab selectedAgent={selectedAgent} />
          </TabsContent>

          <TabsContent value="clients">
            <AgentClientsTab selectedAgent={selectedAgent} />
          </TabsContent>

          <TabsContent value="tasks">
            <AgentTasksTab
              selectedAgent={selectedAgent}
              agents={agents}
              reassignedTasks={reassignedTasks}
              handleReassignTask={handleReassignTask}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AgentOverviewTab({ selectedAgent }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AgentStatisticsCard selectedAgent={selectedAgent} />
      <TaskDistributionCard selectedAgent={selectedAgent} />
    </div>
  );
}

function AgentStatisticsCard({ selectedAgent }) {
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-medium">Agent Statistics</h3>
        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Performance Rating</span>
              <span>{selectedAgent.performance}%</span>
            </div>
            <Progress value={selectedAgent.performance} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Join Date</p>
              <p className="text-lg font-medium">{selectedAgent.joinDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="text-lg font-medium">{selectedAgent.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border p-2 text-center">
              <p className="text-xs text-muted-foreground">Total Slots</p>
              <p className="text-lg font-bold">{selectedAgent.totalSlots}</p>
            </div>
            <div className="rounded-md border p-2 text-center">
              <p className="text-xs text-muted-foreground">Used Slots</p>
              <p className="text-lg font-bold">{selectedAgent.usedSlots}</p>
            </div>
            <div className="rounded-md border p-2 text-center">
              <p className="text-xs text-muted-foreground">Free Slots</p>
              <p className="text-lg font-bold">{selectedAgent.freeSlots}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDistributionCard({ selectedAgent }) {
  const stats = calculateAgentStats(selectedAgent);

  return (
    <div className="rounded-lg border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-medium">Task Distribution</h3>
        <div className="mt-4 space-y-4">
          {selectedAgent.clients.length > 0 ? (
            <div className="space-y-4">
              {stats.totalTasks > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-bold text-green-500">
                        {stats.completedTasks}
                      </p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        In Progress
                      </p>
                      <p className="text-lg font-bold text-blue-500">
                        {stats.inProgressTasks}
                      </p>
                    </div>
                    <div className="rounded-md border p-2 text-center">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold text-yellow-500">
                        {stats.pendingTasks}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>Completion Rate</span>
                      <span>{stats.completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                </>
              ) : (
                <div className="flex h-[150px] items-center justify-center">
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[150px] items-center justify-center">
              <p className="text-muted-foreground">No clients assigned yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentClientsTab({ selectedAgent }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {selectedAgent.clients.length > 0 ? (
        selectedAgent.clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))
      ) : (
        <div className="col-span-full flex h-40 items-center justify-center rounded-md border border-dashed">
          <div className="flex flex-col items-center gap-1 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Clients</h3>
            <p className="text-sm text-muted-foreground">
              This agent has no clients assigned yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }) {
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {getInitials(client.name)}
            </div>
            <div>
              <h4 className="text-base font-medium">{client.name}</h4>
              <p className="text-xs text-muted-foreground">{client.company}</p>
              <p className="text-xs text-muted-foreground">{client.position}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={client.status} />
            <span className="text-xs">Package: {client.package}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{client.progress}%</span>
            </div>
            <Progress value={client.progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Task Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tasks:</span>
                  <span>{client.tasks.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{client.tasks.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span>{client.tasks.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending:</span>
                  <span>{client.tasks.pending}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Timeline</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{client.timeline.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{client.timeline.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size:</span>
                  <span>{client.timeline.teamSize} members</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              View Team
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              View Tasks
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentTasksTab({
  selectedAgent,
  agents,
  reassignedTasks,
  handleReassignTask,
}) {
  const tasks = getAllTasks(selectedAgent, reassignedTasks);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className={task.reassigned ? "bg-muted/50" : ""}
            >
              <TableCell className="font-medium">{task.id}</TableCell>
              <TableCell>{task.name}</TableCell>
              <TableCell>{task.clientName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <StatusIcon status={task.status} />
                  <StatusBadge status={task.status} />
                  {task.reassigned && (
                    <Badge variant="outline" className="ml-2">
                      Reassigned to {task.newAgent}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {task.status === "pending" && !task.reassigned && (
                  <ReassignTaskPopover
                    task={task}
                    agents={agents}
                    selectedAgentId={selectedAgent.id}
                    handleReassignTask={handleReassignTask}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReassignTaskPopover({
  task,
  agents,
  selectedAgentId,
  handleReassignTask,
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Reassign
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>No free agents found</CommandEmpty>
            <CommandGroup>
              {agents
                .filter((a) => a.freeSlots > 0 && a.id !== selectedAgentId)
                .map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.id}
                    onSelect={() => handleReassignTask(task.id, agent.id)}
                  >
                    {agent.name}
                    <Badge variant="outline" className="ml-2">
                      {agent.freeSlots} slots
                    </Badge>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case "free":
      return <Badge className="bg-blue-500 hover:bg-blue-600">Free</Badge>;
    case "booked":
      return (
        <Badge className="bg-red-500 hover:bg-red-600">Fully Booked</Badge>
      );
    case "partial":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          Partially Available
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function StatusIcon({ status }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "in-progress":
      return <Wrench className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}
