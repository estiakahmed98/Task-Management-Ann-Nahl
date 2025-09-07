import QCDashboard from "@/components/QCDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  let tasks: any[] = [];

  try {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    if (res.ok) {
      tasks = await res.json();
    } else {
      console.error("Failed to fetch tasks:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }

  return (
    <div className="p-6">
      <QCDashboard tasks={tasks} />
    </div>
  );
}
