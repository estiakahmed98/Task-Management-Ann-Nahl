import QCDashboard from "@/components/QCDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  let tasks: any[] = [];

  try {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const url = new URL("/api/tasks", base).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      tasks = await res.json();
    } else {
      console.error("Failed to fetch tasks:", res.status, res.statusText);
    }
  } catch (error) {
    console.error("Failed to load tasks:", error);
  }

  return (
    <div>
      <QCDashboard tasks={tasks} />
    </div>
  );
}
