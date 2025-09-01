"use client";

import type React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TaskTrendChartProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TaskTrendChart({ className }: TaskTrendChartProps) {
  // Sample data for the chart
  const data = [
    { name: "Jan", Tasks: 4, Completed: 2 },
    { name: "Feb", Tasks: 6, Completed: 4 },
    { name: "Mar", Tasks: 8, Completed: 5 },
    { name: "Apr", Tasks: 10, Completed: 7 },
    { name: "May", Tasks: 12, Completed: 8 },
    { name: "Jun", Tasks: 14, Completed: 10 },
  ];

  return (
    <div className={className}>
      <h4 className="mb-4 text-sm font-semibold">Task Trend Over Time</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="Tasks"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorTasks)"
          />
          <Area
            type="monotone"
            dataKey="Completed"
            stroke="#82ca9d"
            fillOpacity={1}
            fill="url(#colorCompleted)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
