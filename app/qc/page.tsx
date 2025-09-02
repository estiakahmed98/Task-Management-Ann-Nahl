import QCDashboard from "@/components/QCDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  let tasks = [];
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(new URL("/api/tasks", base), {
      cache: "no-store",
    });
    if (res.ok) {
      tasks = await res.json();
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
