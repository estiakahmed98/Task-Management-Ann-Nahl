"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AgentCardProps {
  agent: any;
  onViewDetails: (agent: any) => void;
}

export function AgentCard({ agent, onViewDetails }: AgentCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col space-y-1.5">
          <CardTitle>{agent.name}</CardTitle>
          <CardDescription>
            {agent.id} • {agent.department}
          </CardDescription>
        </div>
        <StatusBadge status={agent.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold">{agent.totalSlots}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Used</span>
            <span className="text-xl font-bold">{agent.usedSlots}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground">Free</span>
            <span className="text-xl font-bold">{agent.freeSlots}</span>
          </div>
        </div>

        <Progress
          className="mt-3 h-2"
          value={(agent.usedSlots / agent.totalSlots) * 100}
        />

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Clients: {agent.clients.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(agent)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
