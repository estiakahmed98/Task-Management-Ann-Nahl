"use client";

import { useState } from "react";
import { BarChart, Calendar, Clock, PieChart } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskTrendChart } from "@/components/charts/task-trend-chart";
import { AgentPerformanceChart } from "@/components/charts/agent-performance-chart";

export function TaskPerformance() {
  const [timeframe, setTimeframe] = useState("week");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Performance Metrics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track task efficiency and progress over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs
            defaultValue="week"
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion Rate
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">
              +0.5% from last {timeframe}
            </p>
            <div className="mt-4 h-[80px] w-full">
              <TaskTrendChart className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Completion Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2 days</div>
            <p className="text-xs text-muted-foreground">
              -0.5 days from last {timeframe}
            </p>
            <div className="mt-4 h-[80px] w-full">
              <TaskTrendChart className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasks by Category
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 total</div>
            <p className="text-xs text-muted-foreground">Across 3 categories</p>
            <div className="mt-4 h-[80px] w-full">
              <TaskTrendChart className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Deadlines
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 tasks</div>
            <p className="text-xs text-muted-foreground">
              Due in the next 7 days
            </p>
            <div className="mt-4 h-[80px] w-full">
              <TaskTrendChart className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>
            Task completion and efficiency metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <TaskTrendChart className="h-full w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>
              Task completion rates by team member
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <AgentPerformanceChart className="h-full w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Task completion rates by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="h-full w-full">
              <TaskTrendChart className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
