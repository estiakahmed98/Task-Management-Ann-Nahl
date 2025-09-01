"use client";

import type React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CategoryDistributionChartProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function CategoryDistributionChart({
  className,
}: CategoryDistributionChartProps) {
  // Sample data for the chart
  const data = [
    { name: "Social", value: 5, color: "#3b82f6" },
    { name: "Content", value: 3, color: "#f59e0b" },
    { name: "Design", value: 2, color: "#10b981" },
  ];

  return (
    <div className={className}>
      <h4 className="mb-2 text-sm font-semibold">
        Task Distribution by Category
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
