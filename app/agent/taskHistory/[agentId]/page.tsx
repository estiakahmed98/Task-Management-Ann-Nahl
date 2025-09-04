import TaskHistory, { type TaskHistoryRow } from "@/components/client-tasks-view/TaskHistory";

export default async function Page({ params }: { params: { agentId: string } }) {
  const { agentId } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/tasks/history/${agentId}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return <TaskHistory rows={[]} />;
  }

  const rows = (await res.json()) as TaskHistoryRow[];
  return <TaskHistory rows={rows} />;
}
