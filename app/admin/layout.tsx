//app/admin/layout.tsx

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUserFromSession } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieHeader = (await headers()).get("cookie");
  const token =
    cookieHeader
      ?.split(";")
      .find((c) => c.trim().startsWith("session-token="))
      ?.split("=")[1] ?? null;

  const user = token ? await getUserFromSession(token) : null;

  if (!user || user.role?.name !== "admin") {
    redirect("/");
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner /> {/* 🆕 */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>
        </header>
        <div>
          {children}
          <Toaster richColors closeButton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
