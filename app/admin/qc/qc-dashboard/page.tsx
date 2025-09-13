// import QCDashboard from "@/components/QCDashboard";

// export const dynamic = "force-dynamic";

// export default async function Page() {
//   let tasks: any[] = [];

//   try {
//     // Use relative URL to ensure same-origin in both localhost and LAN
//     const res = await fetch("/api/tasks", { cache: "no-store" });
//     if (res.ok) {
//       tasks = await res.json();
//     } else {
//       console.error("Failed to fetch tasks:", res.status, res.statusText);
//     }
//   } catch (error) {
//     console.error("Failed to load tasks:", error);
//   }

//   return (
//     <div>
//       <QCDashboard tasks={tasks} />
//     </div>
//   );
// }


import QCDashboard from "@/components/QCDashboard";
import { headers, cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return ""; // should not happen in Next runtime
  return `${proto}://${host}`;
}

export default async function Page() {
  noStore(); // avoid caching
  let tasks: any[] = [];

  try {
    const baseUrl = getBaseUrl();

    // forward cookies so auth/session works if your /api/tasks needs it
    const cookieHeader = cookies()
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(`${baseUrl}/api/tasks`, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      // next: { revalidate: 0 } // optional
    });

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
  