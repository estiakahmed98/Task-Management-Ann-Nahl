import {
  Check,
  Clock,
  FileText,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/data-utils";

interface ClientDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClient: any;
}

export function ClientDetailsModal({
  isOpen,
  onOpenChange,
  selectedClient,
}: ClientDetailsModalProps) {
  if (!selectedClient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {getInitials(selectedClient.name)}
            </div>
            {selectedClient.name}
            <StatusBadge status={selectedClient.status} />
          </DialogTitle>
          <DialogDescription>
            {selectedClient.company} • {selectedClient.position} • Package:{" "}
            {selectedClient.package}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium">Project Progress</h3>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Overall Completion</span>
              <span>{selectedClient.progress}%</span>
            </div>
            <Progress value={selectedClient.progress} className="h-3" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TaskSummarySection client={selectedClient} />
            <TimelineSection client={selectedClient} />
          </div>

          <TaskListSection client={selectedClient} />

          <div className="flex justify-between">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              View Team Members
            </Button>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskSummarySection({ client }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Task Summary</h3>
      <div className="rounded-md border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Total Tasks</TableCell>
              <TableCell className="text-right">{client.tasks.total}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Completed</TableCell>
              <TableCell className="text-right">
                {client.tasks.completed}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">In Progress</TableCell>
              <TableCell className="text-right">
                {client.tasks.inProgress}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pending</TableCell>
              <TableCell className="text-right">
                {client.tasks.pending}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TimelineSection({ client }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Timeline</h3>
      <div className="rounded-md border">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Start Date</TableCell>
              <TableCell className="text-right">
                {client.timeline.startDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Due Date</TableCell>
              <TableCell className="text-right">
                {client.timeline.dueDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Team Size</TableCell>
              <TableCell className="text-right">
                {client.timeline.teamSize} members
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TaskListSection({ client }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Task List</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task ID</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.taskList.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.id}</TableCell>
                <TableCell>{task.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={task.status} />
                    <StatusBadge status={task.status} />
                  </div>
                </TableCell>
                <TableCell>
                  {task.status === "pending" && (
                    <Button variant="outline" size="sm">
                      Reassign
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  switch (status) {
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

export function getStatusIndicatorIcon(indicator) {
  switch (indicator) {
    case "new-comments":
      return (
        <div className="flex items-center text-blue-500">
          <MessageSquare className="h-4 w-4 mr-1" /> New comments
        </div>
      );
    case "issues-reported":
      return (
        <div className="flex items-center text-red-500">
          <Clock className="h-4 w-4 mr-1" /> Issues reported
        </div>
      );
    case "no-issues":
      return (
        <div className="flex items-center text-green-500">
          <Check className="h-4 w-4 mr-1" /> No Issues
        </div>
      );
    default:
      return null;
  }
}
