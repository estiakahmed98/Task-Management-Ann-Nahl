"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  Timer,
  Check,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import types
import type { Task } from "@/types/task";

// Import data and utilities
import { tabsData } from "@/data/tabs-data";
import { formatTime } from "@/utils/time-utils";
import { initializeTabTasks } from "@/utils/task-utils";

const TasksPage = () => {
  // Create separate state for each tab
  const [tabStates, setTabStates] = useState<
    Record<
      string,
      {
        tasks: Task[];
        rowsPerPage: number;
        currentPage: number;
        showTimeExpiredAlert: boolean;
        expiredTaskId: number | null;
        selectedTaskId: number | null;
        pendingTimerTaskId: number | null;
      }
    >
  >(() => {
    const initialStates: Record<string, any> = {};
    tabsData.forEach((tab) => {
      initialStates[tab.id] = {
        tasks: initializeTabTasks(tab.links),
        rowsPerPage: 10,
        currentPage: 1,
        showTimeExpiredAlert: false,
        expiredTaskId: null,
        selectedTaskId: null,
        pendingTimerTaskId: null,
      };
    });
    return initialStates;
  });

  const [activeTab, setActiveTab] = useState("social-asset");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimerConflictModalOpen, setIsTimerConflictModalOpen] =
    useState(false);

  // Timer interval references for each tab
  const timerRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const extraTimeRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Get currently active task for the current tab
  const getActiveTask = () => {
    const currentTabState = tabStates[activeTab];
    return currentTabState.tasks.find((task) => task.timerActive);
  };

  // Effect to handle the countdown timer for the current tab
  useEffect(() => {
    const currentTabState = tabStates[activeTab];
    const activeTask = currentTabState.tasks.find((task) => task.timerActive);

    if (activeTask) {
      timerRefs.current[activeTab] = setInterval(() => {
        setTabStates((prev) => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            tasks: prev[activeTab].tasks.map((task) => {
              if (task.timerActive && task.timeRemaining !== null) {
                const newTimeRemaining = task.timeRemaining - 1;
                const newTotalTimeSpent = task.totalTimeSpent + 1;

                if (newTimeRemaining <= 0) {
                  // Timer expired logic
                  toast.error(
                    `Time Expired! The timer for task #${task.id} has expired.`
                  );
                  startExtraTimeTracking(task.id);

                  return {
                    ...task,
                    timeRemaining: 0,
                    timerActive: false,
                    timerExpired: true,
                    totalTimeSpent: newTotalTimeSpent,
                  };
                }

                return {
                  ...task,
                  timeRemaining: newTimeRemaining,
                  totalTimeSpent: newTotalTimeSpent,
                };
              }
              return task;
            }),
          },
        }));
      }, 1000);
    }

    return () => {
      if (timerRefs.current[activeTab]) {
        clearInterval(timerRefs.current[activeTab]!);
        timerRefs.current[activeTab] = null;
      }
    };
  }, [activeTab, tabStates]);

  // Start tracking extra time for a task in the current tab
  const startExtraTimeTracking = (taskId: number) => {
    if (extraTimeRefs.current[activeTab]) {
      clearInterval(extraTimeRefs.current[activeTab]!);
    }

    extraTimeRefs.current[activeTab] = setInterval(() => {
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          tasks: prev[activeTab].tasks.map((task) => {
            if (
              task.id === taskId &&
              task.timerExpired &&
              task.status !== "completed"
            ) {
              return {
                ...task,
                extraTimeSpent: task.extraTimeSpent + 1,
                totalTimeSpent: task.totalTimeSpent + 1,
              };
            }
            return task;
          }),
        },
      }));
    }, 1000);
  };

  // Stop tracking extra time for the current tab
  const stopExtraTimeTracking = () => {
    if (extraTimeRefs.current[activeTab]) {
      clearInterval(extraTimeRefs.current[activeTab]!);
      extraTimeRefs.current[activeTab] = null;
    }
  };

  const handleStartTimer = (id: number) => {
    const activeTask = getActiveTask();

    if (activeTask) {
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          pendingTimerTaskId: id,
        },
      }));
      setIsTimerConflictModalOpen(true);
      return;
    }

    startTimerForTask(id);
  };

  const startTimerForTask = (id: number) => {
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        tasks: prev[activeTab].tasks.map((task) => {
          if (task.id === id) {
            if (task.timerExpired) {
              stopExtraTimeTracking();
            }

            return {
              ...task,
              timeRemaining:
                task.timeRemaining === null
                  ? task.timeAllotted
                  : task.timeRemaining,
              timerActive: true,
              timerExpired: false,
            };
          }
          return task;
        }),
      },
    }));
  };

  const handlePauseCurrentTimer = () => {
    const currentTabState = tabStates[activeTab];

    // Pause current timer
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        tasks: prev[activeTab].tasks.map((task) => ({
          ...task,
          timerActive: false,
        })),
      },
    }));

    // Start pending timer if exists
    if (currentTabState.pendingTimerTaskId !== null) {
      startTimerForTask(currentTabState.pendingTimerTaskId);
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          pendingTimerTaskId: null,
        },
      }));
    }

    setIsTimerConflictModalOpen(false);
  };

  const handleCheckboxClick = (id: number) => {
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        selectedTaskId: id,
      },
    }));
    setIsModalOpen(true);
  };

  const handleTaskStatus = (status: "completed" | "not-completed") => {
    const currentTabState = tabStates[activeTab];

    if (currentTabState.selectedTaskId !== null) {
      const task = currentTabState.tasks.find(
        (t) => t.id === currentTabState.selectedTaskId
      );

      if (task?.timerExpired) {
        stopExtraTimeTracking();
      }

      setTabStates((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          tasks: prev[activeTab].tasks.map((task) =>
            task.id === currentTabState.selectedTaskId
              ? {
                  ...task,
                  status,
                  timerActive: false,
                  timerExpired:
                    status === "completed" ? false : task.timerExpired,
                }
              : task
          ),
          selectedTaskId: null,
        },
      }));

      if (status === "completed") {
        toast.success(
          `Task #${currentTabState.selectedTaskId} has been marked as completed.`
        );
      }
    }

    setIsModalOpen(false);
  };

  const handleResetTimer = (id: number) => {
    const task = tabStates[activeTab].tasks.find((t) => t.id === id);

    if (task?.timerExpired) {
      stopExtraTimeTracking();
    }

    setTabStates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        tasks: prev[activeTab].tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                timeRemaining: task.timeAllotted,
                timerActive: false,
                timerExpired: false,
              }
            : task
        ),
      },
    }));
  };

  // Get tasks with extra time spent for current tab
  const getTasksWithExtraTime = () => {
    return tabStates[activeTab].tasks.filter((task) => task.extraTimeSpent > 0);
  };

  // Get all tasks for the current tab
  const getAllTasks = () => {
    return tabStates[activeTab].tasks;
  };

  // Get paginated tasks for the current tab
  const getPaginatedTasks = () => {
    const { currentPage, rowsPerPage } = tabStates[activeTab];
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    // First get all tasks
    const allTasks = [...tabStates[activeTab].tasks];

    // Sort tasks: incomplete first, then completed
    allTasks.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      return 0;
    });

    // Return the slice for the current page
    return allTasks.slice(startIndex, endIndex);
  };

  // Get total tasks count for the current tab
  const getTotalTasksCount = () => {
    return tabStates[activeTab].tasks.length;
  };

  const tasksWithExtraTime = getTasksWithExtraTime();
  const paginatedTasks = getPaginatedTasks();
  const totalTasksCount = getTotalTasksCount();
  const currentTabState = tabStates[activeTab];

  // Calculate progress percentage for timer
  const calculateProgress = (task: Task): number => {
    if (task.timeRemaining === null) return 100;
    return (task.timeRemaining / task.timeAllotted) * 100;
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Tasks Management</h1>

      {currentTabState.showTimeExpiredAlert && (
        <Alert variant="destructive" className="mb-6 animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Time Expired!</AlertTitle>
          <AlertDescription>
            The timer for task #{currentTabState.expiredTaskId} has expired.
            Please complete this task as soon as possible.
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTabStates((prev) => ({
                ...prev,
                [activeTab]: {
                  ...prev[activeTab],
                  showTimeExpiredAlert: false,
                  expiredTaskId: null,
                },
              }));
            }}
            className="ml-auto mt-2"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Extra Time Summary */}
      {tasksWithExtraTime.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <Timer className="h-5 w-5" />
              Tasks Exceeding Allotted Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-amber-800">
                      Task
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-amber-800">
                      Allotted Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-amber-800">
                      Extra Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-amber-800">
                      Total Time
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-amber-800">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasksWithExtraTime.map((task) => (
                    <tr
                      key={`extra-${task.id}`}
                      className="border-b border-amber-100"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            #{task.id}
                          </Badge>
                          <span className="text-sm truncate max-w-[200px]">
                            {task.link.split("/").pop()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-mono text-sm">
                        {formatTime(task.timeAllotted)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="destructive" className="font-mono">
                          +{formatTime(task.extraTimeSpent)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-sm">
                        {formatTime(task.totalTimeSpent)}
                      </td>
                      <td className="px-4 py-2">
                        {task.status === "completed" ? (
                          <Badge
                            variant="success"
                            className="bg-green-100 text-green-800 hover:bg-green-100"
                          >
                            Completed
                          </Badge>
                        ) : task.status === "not-completed" ? (
                          <Badge
                            variant="destructive"
                            className="bg-red-100 text-red-800 hover:bg-red-100"
                          >
                            Not Completed
                          </Badge>
                        ) : task.timerExpired ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 border-amber-300"
                          >
                            Time Expired
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100">
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          {tabsData.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-sm font-medium"
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <div className="overflow-x-auto rounded-lg border shadow-sm">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      <div className="flex items-center">
                        Timer
                        <ArrowUp className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      <div className="flex items-center">
                        Link
                        <ArrowUp className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      <div className="flex items-center">
                        Username
                        <ArrowUp className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      <div className="flex items-center">
                        Email
                        <ArrowUp className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-sm">
                      <div className="flex items-center">
                        Password
                        <ArrowUp className="h-4 w-4 ml-1" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tab.id === activeTab &&
                    paginatedTasks.map((task) => (
                      <tr
                        key={task.id}
                        className={`border-b hover:bg-muted/20 transition-colors ${
                          task.status === "completed"
                            ? "bg-green-50"
                            : task.status === "not-completed" ||
                              task.timerExpired
                            ? "bg-red-50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          {task.status === "completed" ? (
                            <div className="flex items-center justify-center w-6 h-6">
                              <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCheckboxClick(task.id)}
                              className="flex items-center justify-center w-6 h-6 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label={`Update status for task ${task.id}`}
                            >
                              {task.status === "not-completed" ? (
                                <XCircle className="h-6 w-6 text-red-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-sm" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[200px]">
                          {task.status === "completed" ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="success"
                                className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Completed
                              </Badge>

                              {task.totalTimeSpent > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 font-mono text-xs"
                                >
                                  {formatTime(task.totalTimeSpent)}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`font-mono font-medium text-sm ${
                                      task.timerExpired
                                        ? "text-red-600"
                                        : task.timeRemaining !== null &&
                                          task.timeRemaining < 10
                                        ? "text-red-600"
                                        : task.timeRemaining !== null &&
                                          task.timeRemaining < 30
                                        ? "text-amber-600"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {formatTime(
                                      task.timeRemaining !== null
                                        ? task.timeRemaining
                                        : task.timeAllotted
                                    )}
                                  </div>

                                  {task.extraTimeSpent > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200 text-xs"
                                    >
                                      +{formatTime(task.extraTimeSpent)}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {task.timerExpired ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleResetTimer(task.id)}
                                      className="h-7 w-7 rounded-full"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                                      <span className="sr-only">
                                        Reset timer
                                      </span>
                                    </Button>
                                  ) : task.timerActive ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setTabStates((prev) => ({
                                          ...prev,
                                          [activeTab]: {
                                            ...prev[activeTab],
                                            tasks: prev[activeTab].tasks.map(
                                              (t) =>
                                                t.id === task.id
                                                  ? { ...t, timerActive: false }
                                                  : t
                                            ),
                                          },
                                        }));
                                      }}
                                      className="h-7 w-7 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                    >
                                      <Pause className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Pause timer
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleStartTimer(task.id)}
                                      className="h-7 w-7 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                    >
                                      <Play className="h-3.5 w-3.5" />
                                      <span className="sr-only">
                                        Start timer
                                      </span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <Progress
                                value={calculateProgress(task)}
                                className={`h-1.5 ${
                                  task.timerExpired
                                    ? "bg-red-200"
                                    : task.timeRemaining !== null &&
                                      task.timeRemaining < 10
                                    ? "bg-red-200"
                                    : task.timeRemaining !== null &&
                                      task.timeRemaining < 30
                                    ? "bg-amber-200"
                                    : "bg-slate-200"
                                }`}
                                indicatorClassName={`${
                                  task.timerExpired
                                    ? "bg-red-600"
                                    : task.timeRemaining !== null &&
                                      task.timeRemaining < 10
                                    ? "bg-red-600"
                                    : task.timeRemaining !== null &&
                                      task.timeRemaining < 30
                                    ? "bg-amber-600"
                                    : "bg-blue-600"
                                }`}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={task.link}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                          >
                            {task.link}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{task.username}</td>
                        <td className="px-4 py-3">{task.email}</td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {task.password}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-center justify-end mt-4 gap-2">
        <div className="flex items-center">
          <span className="mr-2 text-sm text-muted-foreground">
            Rows per page
          </span>
          <select
            value={tabStates[activeTab].rowsPerPage}
            onChange={(e) => {
              setTabStates((prev) => ({
                ...prev,
                [activeTab]: {
                  ...prev[activeTab],
                  rowsPerPage: Number(e.target.value),
                },
              }));
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="ml-4 text-sm text-muted-foreground">
          {tabStates[activeTab].tasks.length > 0
            ? `${
                (tabStates[activeTab].currentPage - 1) *
                  tabStates[activeTab].rowsPerPage +
                1
              }-${Math.min(
                tabStates[activeTab].currentPage *
                  tabStates[activeTab].rowsPerPage,
                totalTasksCount
              )} of ${totalTasksCount}`
            : "0-0 of 0"}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setTabStates((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                currentPage: Math.max(1, prev[activeTab].currentPage - 1),
              },
            }));
          }}
          disabled={tabStates[activeTab].currentPage === 1}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setTabStates((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                currentPage: Math.min(
                  Math.ceil(
                    prev[activeTab].tasks.length / prev[activeTab].rowsPerPage
                  ),
                  prev[activeTab].currentPage + 1
                ),
              },
            }));
          }}
          disabled={
            tabStates[activeTab].currentPage *
              tabStates[activeTab].rowsPerPage >=
            tabStates[activeTab].tasks.length
          }
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Update Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Is this task completed or not completed?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => handleTaskStatus("completed")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-5 w-5" />
              Completed
            </Button>
            <Button
              onClick={() => handleTaskStatus("not-completed")}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-5 w-5" />
              Not Completed
            </Button>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timer Conflict Modal */}
      <Dialog
        open={isTimerConflictModalOpen}
        onOpenChange={setIsTimerConflictModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Timer Already Running
            </DialogTitle>
            <DialogDescription>
              You already have an active timer running. Would you like to pause
              the current timer and start a new one?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Only one timer can be active at a time</AlertTitle>
              <AlertDescription>
                To maintain accurate time tracking, you can only run one timer
                at a time.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTabStates((prev) => ({
                  ...prev,
                  [activeTab]: {
                    ...prev[activeTab],
                    pendingTimerTaskId: null,
                  },
                }));
                setIsTimerConflictModalOpen(false);
              }}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePauseCurrentTimer}
              className="bg-blue-600 hover:bg-blue-700 sm:order-2"
            >
              Pause Current & Start New Timer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
