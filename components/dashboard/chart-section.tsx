import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, BarChart, PieChart } from "@/components/charts/charts";

interface ChartSectionProps {
  agentPerformanceData: any[];
  departmentDistribution: any[];
  weeklyTaskCompletion: any[];
}

export function ChartSection({
  agentPerformanceData,
  departmentDistribution,
  weeklyTaskCompletion,
}: ChartSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AgentPerformanceChart data={agentPerformanceData} />
      <div className="grid gap-4 grid-rows-2">
        <DepartmentDistributionChart data={departmentDistribution} />
        <WeeklyTaskCompletionChart data={weeklyTaskCompletion} />
      </div>
    </div>
  );
}

function AgentPerformanceChart({ data }) {
  // Ensure data is properly formatted for the bar chart
  const formattedData = data.map((item) => ({
    name: item.name,
    completed: item.completed || 0,
    inProgress: item.inProgress || 0,
    pending: item.pending || 0,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>Task completion rates by agent</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ChartContainer
            config={{
              completed: {
                label: "Completed",
                color: "hsl(142.1 76.2% 36.3%)",
              },
              inProgress: {
                label: "In Progress",
                color: "hsl(221.2 83.2% 53.3%)",
              },
              pending: {
                label: "Pending",
                color: "hsl(47.9 95.8% 53.1%)",
              },
            }}
          >
            <BarChart
              data={formattedData}
              dataKey="name"
              categories={["completed", "inProgress", "pending"]}
              colors={[
                "hsl(142.1 76.2% 36.3%)",
                "hsl(221.2 83.2% 53.3%)",
                "hsl(47.9 95.8% 53.1%)",
              ]}
              valueFormatter={(value) => `${value} tasks`}
              layout="vertical"
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentDistributionChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Distribution</CardTitle>
        <CardDescription>Agents by department</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ChartContainer
            config={{
              value: {
                label: "Percentage",
                color: "hsl(221.2 83.2% 53.3%)",
              },
            }}
          >
            <PieChart
              data={data}
              dataKey="name"
              category="value"
              valueFormatter={(value) => `${value}%`}
              colors={[
                "hsl(221.2 83.2% 53.3%)",
                "hsl(262.1 83.3% 57.8%)",
                "hsl(142.1 76.2% 36.3%)",
                "hsl(47.9 95.8% 53.1%)",
                "hsl(0 72.2% 50.6%)",
              ]}
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyTaskCompletionChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Task Completion</CardTitle>
        <CardDescription>Tasks completed by day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ChartContainer
            config={{
              tasks: {
                label: "Tasks",
                color: "hsl(221.2 83.2% 53.3%)",
              },
            }}
          >
            <BarChart
              data={data}
              dataKey="day"
              categories={["tasks"]}
              colors={["hsl(221.2 83.2% 53.3%)"]}
              valueFormatter={(value) => `${value} tasks`}
            />
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
