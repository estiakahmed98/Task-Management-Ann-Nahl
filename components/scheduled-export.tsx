"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Edit,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ScheduledExports() {
  const [schedules, setSchedules] = useState([
    {
      id: "sched-001",
      name: "Weekly Task Summary",
      frequency: "weekly",
      day: "Monday",
      time: "09:00",
      format: "PDF",
      recipients: ["john@example.com"],
      active: true,
      nextRun: "2023-04-17T09:00:00",
    },
    {
      id: "sched-002",
      name: "Monthly Performance Report",
      frequency: "monthly",
      day: "1",
      time: "08:00",
      format: "Excel",
      recipients: ["john@example.com", "team@example.com"],
      active: true,
      nextRun: "2023-05-01T08:00:00",
    },
    {
      id: "sched-003",
      name: "Daily Task Updates",
      frequency: "daily",
      time: "17:00",
      format: "CSV",
      recipients: ["john@example.com"],
      active: false,
      nextRun: "2023-04-11T17:00:00",
    },
  ]);

  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: "",
    frequency: "weekly",
    day: "Monday",
    time: "09:00",
    format: "PDF",
    recipients: [""],
    includeTaskDetails: true,
    includePerformanceMetrics: true,
    includeAgentData: false,
  });

  const handleToggleActive = (id: string) => {
    setSchedules(
      schedules.map((schedule) =>
        schedule.id === id
          ? { ...schedule, active: !schedule.active }
          : schedule
      )
    );
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id));
  };

  const handleAddSchedule = () => {
    const newId = `sched-${String(schedules.length + 1).padStart(3, "0")}`;

    // Calculate next run date based on frequency
    const now = new Date();
    let nextRun = new Date();

    if (newSchedule.frequency === "daily") {
      nextRun.setDate(now.getDate() + 1);
    } else if (newSchedule.frequency === "weekly") {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const targetDay = days.indexOf(newSchedule.day);
      const currentDay = now.getDay();
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      nextRun.setDate(now.getDate() + daysToAdd);
    } else if (newSchedule.frequency === "monthly") {
      const targetDay = Number.parseInt(newSchedule.day);
      nextRun = new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
    }

    // Set the time
    const [hours, minutes] = newSchedule.time.split(":").map(Number);
    nextRun.setHours(hours, minutes, 0, 0);

    const schedule = {
      id: newId,
      name: newSchedule.name,
      frequency: newSchedule.frequency,
      day: newSchedule.day,
      time: newSchedule.time,
      format: newSchedule.format,
      recipients: newSchedule.recipients.filter((r) => r.trim() !== ""),
      active: true,
      nextRun: nextRun.toISOString(),
    };

    setSchedules([...schedules, schedule]);
    setShowNewScheduleDialog(false);

    // Reset form
    setNewSchedule({
      name: "",
      frequency: "weekly",
      day: "Monday",
      time: "09:00",
      format: "PDF",
      recipients: [""],
      includeTaskDetails: true,
      includePerformanceMetrics: true,
      includeAgentData: false,
    });
  };

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getFrequencyText = (schedule: any) => {
    if (schedule.frequency === "daily") {
      return "Daily";
    } else if (schedule.frequency === "weekly") {
      return `Weekly on ${schedule.day}`;
    } else if (schedule.frequency === "monthly") {
      return `Monthly on day ${schedule.day}`;
    }
    return schedule.frequency;
  };

  const addRecipientField = () => {
    setNewSchedule({
      ...newSchedule,
      recipients: [...newSchedule.recipients, ""],
    });
  };

  const updateRecipient = (index: number, value: string) => {
    const updatedRecipients = [...newSchedule.recipients];
    updatedRecipients[index] = value;
    setNewSchedule({
      ...newSchedule,
      recipients: updatedRecipients,
    });
  };

  const removeRecipient = (index: number) => {
    if (newSchedule.recipients.length > 1) {
      const updatedRecipients = [...newSchedule.recipients];
      updatedRecipients.splice(index, 1);
      setNewSchedule({
        ...newSchedule,
        recipients: updatedRecipients,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Scheduled Exports</h2>
        <Dialog
          open={showNewScheduleDialog}
          onOpenChange={setShowNewScheduleDialog}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Scheduled Export</DialogTitle>
              <DialogDescription>
                Set up a recurring export that will be automatically generated
                and sent.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-name">Schedule Name</Label>
                <Input
                  id="schedule-name"
                  value={newSchedule.name}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, name: e.target.value })
                  }
                  placeholder="e.g., Weekly Task Report"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="schedule-frequency">Frequency</Label>
                <Select
                  value={newSchedule.frequency}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, frequency: value })
                  }
                >
                  <SelectTrigger id="schedule-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newSchedule.frequency === "weekly" && (
                <div className="grid gap-2">
                  <Label htmlFor="schedule-day">Day of Week</Label>
                  <Select
                    value={newSchedule.day}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, day: value })
                    }
                  >
                    <SelectTrigger id="schedule-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newSchedule.frequency === "monthly" && (
                <div className="grid gap-2">
                  <Label htmlFor="schedule-day">Day of Month</Label>
                  <Select
                    value={newSchedule.day}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, day: value })
                    }
                  >
                    <SelectTrigger id="schedule-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, time: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="schedule-format">Format</Label>
                <Select
                  value={newSchedule.format}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, format: value })
                  }
                >
                  <SelectTrigger id="schedule-format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Excel">Excel</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Recipients</Label>
                {newSchedule.recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input type="email" className="flex items-center gap-2" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeRecipient(index)}
                      disabled={newSchedule.recipients.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={addRecipientField}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>Include Data</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-tasks"
                      checked={newSchedule.includeTaskDetails}
                      onCheckedChange={(checked) =>
                        setNewSchedule({
                          ...newSchedule,
                          includeTaskDetails: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="include-tasks"
                      className="text-sm font-normal"
                    >
                      Task Details
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-performance"
                      checked={newSchedule.includePerformanceMetrics}
                      onCheckedChange={(checked) =>
                        setNewSchedule({
                          ...newSchedule,
                          includePerformanceMetrics: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="include-performance"
                      className="text-sm font-normal"
                    >
                      Performance Metrics
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-agents"
                      checked={newSchedule.includeAgentData}
                      onCheckedChange={(checked) =>
                        setNewSchedule({
                          ...newSchedule,
                          includeAgentData: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="include-agents"
                      className="text-sm font-normal"
                    >
                      Agent Information
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowNewScheduleDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSchedule} disabled={!newSchedule.name}>
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <Card
            key={schedule.id}
            className={!schedule.active ? "opacity-70" : undefined}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{schedule.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>
                <Badge
                  variant="outline"
                  className={
                    schedule.format === "PDF"
                      ? "bg-red-50 text-red-700"
                      : schedule.format === "Excel"
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700"
                  }
                >
                  {schedule.format}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{getFrequencyText(schedule)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>at {schedule.time}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {schedule.recipients.length} recipient
                  {schedule.recipients.length !== 1 ? "s" : ""}
                </div>
                {schedule.active && (
                  <div className="text-sm">
                    <span className="font-medium">Next run:</span>{" "}
                    <span className="text-muted-foreground">
                      {formatNextRun(schedule.nextRun)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-muted-foreground">
                  {schedule.active ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={schedule.active}
                  onCheckedChange={() => handleToggleActive(schedule.id)}
                />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
