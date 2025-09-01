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

interface AgentPerformanceChartProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function AgentPerformanceChart({
  className,
}: AgentPerformanceChartProps) {
  // Sample data for the chart
  const data = [
    { name: "Alice", Completed: 12, InProgress: 3, Pending: 2 },
    { name: "Bob", Completed: 8, InProgress: 4, Pending: 3 },
    { name: "Charlie", Completed: 10, InProgress: 2, Pending: 1 },
    { name: "Diana", Completed: 15, InProgress: 1, Pending: 0 },
  ];

  return (
    <div className={className}>
      <h4 className="mb-4 text-sm font-semibold">Agent Performance</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Legend />
          <Bar dataKey="Completed" fill="#10b981" />
          <Bar dataKey="InProgress" fill="#3b82f6" />
          <Bar dataKey="Pending" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
