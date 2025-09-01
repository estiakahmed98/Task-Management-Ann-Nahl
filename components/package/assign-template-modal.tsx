"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client } from "@/lib/data";

interface AssignTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  packageId: string;
  onAssignComplete?: (clientId: string) => void;
}

export function AssignTemplateModal({
  isOpen,
  onClose,
  templateId,
  templateName,
  packageId,
  onAssignComplete,
}: AssignTemplateModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientFilter, setClientFilter] = useState("all");
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  const [assignedClientIds, setAssignedClientIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
       const response = await fetch(`/api/clients?packageId=${packageId}`);
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        } else {
          toast.error("Failed to fetch clients");
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("An error occurred while fetching clients");
      } finally {
        setIsLoadingClients(false);
      }
    };

    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        const response = await fetch(
          `/api/assignments?templateId=${templateId}`
        );
        if (response.ok) {
          const data = await response.json();
          const ids = new Set<string>(data.map((a: any) => a.clientId));
          setAssignedClientIds(ids);
        } else {
          toast.error("Failed to fetch assignments");
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    if (isOpen) {
      fetchClients();
      fetchAssignments();
    }
  }, [isOpen, templateId]);

  const filteredClients = clients.filter((client) => {
    // Filter by status
    if (clientFilter !== "all" && client.status !== clientFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = client.name || '';
      const email = client.email || '';
      const company = client.company || '';
      
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        company.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleAssign = async () => {
    if (!selectedClient) {
      toast.error("Please select a client");
      return;
    }

    setIsLoading(true);

    try {
      // Create a new assignment
      const assignment = {
        id: `assignment-${Date.now()}`,
        templateId,
        clientId: selectedClient,
        assignedAt: new Date().toISOString(),
        status: "active",
      };

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignment),
      });

      if (!response.ok) {
        throw new Error("Failed to assign template");
      }

      const selectedClientData = clients.find(
        (client) => client.id === selectedClient
      );

      toast.success(
        `Template assigned to ${selectedClientData?.name} successfully`
      );

      // Call the onAssignComplete callback if provided
      if (onAssignComplete) {
        onAssignComplete(selectedClient);
      }

      onClose();
    } catch (error) {
      console.error("Error assigning template:", error);
      toast.error("Failed to assign template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Template to Client</DialogTitle>
          <DialogDescription>
            Assign "{templateName}" template to a client
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{packageId}</Badge>
              <span className="text-sm font-medium">{templateName}</span>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search clients..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs
            value={clientFilter}
            onValueChange={setClientFilter}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Clients</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoadingClients ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No clients found matching your search
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClients.map((client) => {
                    const isAssigned = assignedClientIds.has(client.id);
                    const isSelected = selectedClient === client.id;

                    return (
                      <div
                        key={client.id}
                        className={`p-3 rounded-md border flex items-center gap-3 transition-colors relative cursor-pointer ${
                          isAssigned
                            ? "bg-green-50 border-green-200 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          if (!isAssigned) setSelectedClient(client.id);
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={client.avatar || "/placeholder.svg"}
                            alt={client.name}
                          />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            {client.name}
                            <Badge
                              variant="outline"
                              className={
                                client.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : client.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }
                            >
                              {client.status.charAt(0).toUpperCase() +
                                client.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {client.company}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {client.email}
                          </div>
                        </div>

                        {isAssigned ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Assigned
                          </Badge>
                        ) : isSelected ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedClient || isLoading}
            className="bg-[#00b894] hover:bg-[#00a382]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
