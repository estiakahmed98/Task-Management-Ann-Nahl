"use client";

import { useState } from "react";
import {
  Calendar,
  Download,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExportHistoryProps {
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExportHistory({ onDownload, onDelete }: ExportHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Sample export history data
  const exports = [
    {
      id: "exp-001",
      name: "Task Summary Report",
      type: "PDF",
      date: "2023-04-10T14:30:00",
      size: "1.2 MB",
      creator: "John Smith",
    },
    {
      id: "exp-002",
      name: "Performance Metrics",
      type: "Excel",
      date: "2023-04-05T09:15:00",
      size: "3.5 MB",
      creator: "John Smith",
    },
    {
      id: "exp-003",
      name: "Agent Performance",
      type: "CSV",
      date: "2023-04-01T16:45:00",
      size: "0.8 MB",
      creator: "John Smith",
    },
    {
      id: "exp-004",
      name: "Monthly Task Report",
      type: "PDF",
      date: "2023-03-28T11:20:00",
      size: "2.1 MB",
      creator: "John Smith",
    },
    {
      id: "exp-005",
      name: "Category Distribution",
      type: "Excel",
      date: "2023-03-15T13:10:00",
      size: "1.7 MB",
      creator: "John Smith",
    },
  ];

  const filteredExports = exports.filter(
    (exp) =>
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Export History</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search exports..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExports.length > 0 ? (
              filteredExports.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium">{exp.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        exp.type === "PDF"
                          ? "bg-red-50 text-red-700"
                          : exp.type === "Excel"
                          ? "bg-green-50 text-green-700"
                          : "bg-blue-50 text-blue-700"
                      }
                    >
                      {exp.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatDate(exp.date)}</span>
                  </TableCell>
                  <TableCell>{exp.size}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDownload(exp.id)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDownload(exp.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete(exp.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-muted-foreground"
                >
                  No exports found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
