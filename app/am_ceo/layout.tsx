// app/am/layout.tsx
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import DynamicBreadcrumb from "@/components/DynamicBreadcrumb";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";

// ✅ তুমি এখন যেটা ইউজ করছো — server-side util
import { getAuthUser } from "@/lib/getAuthUser";

export default async function AmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ কুকি ম্যানুয়ালি পার্স করার দরকার নেই
  const user = await getAuthUser();
  if (!user) {
    redirect("/");
  }

  // ✅ role নাম normalize করে নাও (user.role?.name || user.role)
  const roleName = String(user.role?.name ?? user.role ?? "").toLowerCase();

  // ✅ AM অ্যাক্সেস: am অথবা am_ceo — দুটোই এলাউ
  const allowed = roleName === "am" || roleName === "am_ceo";
  if (!allowed) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
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
