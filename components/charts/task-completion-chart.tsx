"use client";

import type React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TaskCompletionChartProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function TaskCompletionChart({ className }: TaskCompletionChartProps) {
  // Sample data for the chart
  const data = [
    { name: "Week 1", Completed: 2, Pending: 5, InProgress: 3 },
    { name: "Week 2", Completed: 3, Pending: 4, InProgress: 3 },
    { name: "Week 3", Completed: 4, Pending: 3, InProgress: 3 },
    { name: "Week 4", Completed: 5, Pending: 2, InProgress: 3 },
    { name: "Week 5", Completed: 6, Pending: 1, InProgress: 3 },
  ];

  return (
    <div className={className}>
      <h4 className="mb-4 text-sm font-semibold">Task Completion Trend</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Completed" fill="#10b981" />
          <Bar dataKey="Pending" fill="#f59e0b" />
          <Bar dataKey="InProgress" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
