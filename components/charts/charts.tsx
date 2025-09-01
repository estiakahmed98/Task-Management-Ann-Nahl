import type * as React from "react";
import {
  XAxis,
  YAxis,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
} from "recharts";

interface ChartContainerProps {
  children: React.ReactNode;
  config: any;
}

export function ChartContainer({ children, config }: ChartContainerProps) {
  return <>{children}</>;
}

interface ChartTooltipProps {
  children: React.ReactNode;
}

export function ChartTooltip({ children }: ChartTooltipProps) {
  return <>{children}</>;
}

interface ChartTooltipContentProps {
  payload: any[];
  label: string;
  config: any;
}

export function ChartTooltipContent({
  payload,
  label,
  config,
}: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
      <div className="mb-2 text-sm font-bold">{label}</div>
      {Object.keys(config)
        .filter((key) => payload[0].payload[key] !== undefined)
        .map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <span
              className="block h-4 w-4 rounded-full"
              style={{ backgroundColor: config[key].color }}
            />
            <p className="text-xs">
              {config[key].label}: {payload[0].payload[key]}
            </p>
          </div>
        ))}
    </div>
  );
}

interface BarChartProps {
  data: any[];
  dataKey: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  layout?: "horizontal" | "vertical";
}

export function BarChart({
  data,
  dataKey,
  categories,
  colors,
  valueFormatter,
  layout = "horizontal",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} layout={layout}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={dataKey} type="category" />
        <YAxis
          tickFormatter={(value) => {
            if (valueFormatter) {
              return valueFormatter(value);
            }
            return value;
          }}
        />
        <Tooltip content={<ChartTooltipContent config={{}} />} />
        <Legend />
        {categories.map((category, index) => (
          <Bar key={category} dataKey={category} fill={colors[index]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";

interface PieChartProps {
  data: any[];
  dataKey: string;
  category: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

export function PieChart({
  data,
  dataKey,
  category,
  colors = ["#3b82f6", "#8b5cf6", "#22c55e", "#eab308", "#ef4444"],
  valueFormatter,
}: PieChartProps) {
  return (
    <RechartsResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={category}
          nameKey={dataKey}
          label={({ name, percent }) => {
            const formattedPercent = valueFormatter
              ? valueFormatter(percent * 100)
              : `${(percent * 100).toFixed(0)}%`;
            return `${name}: ${formattedPercent}`;
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent config={{}} />} />
        <Legend />
      </RechartsPieChart>
    </RechartsResponsiveContainer>
  );
}
