// app/components/app-sidebar.tsx
"use client";

import * as React from "react";
import useSWR from "swr";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCog,
  Package,
  Boxes,
  FileText,
  Share2,
  ClipboardList,
  ClipboardCheck,
  ClipboardPlus,
  Briefcase,
  Folder,
  Key,
  Shield,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GalleryVerticalEnd,
  BellRing,
  Settings,
  Sparkles,
  ListChecks,
  History,
  BadgeCheck,
  MessageCircleMore,
  ShieldOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const iconMap: Record<string, React.ReactNode> = {
  // Dashboards
  Dashboard: <LayoutDashboard className="h-4 w-4" />,

  // Clients
  Clients: <Users className="h-4 w-4" />,
  "All Clients": <Users className="h-4 w-4" />,
  "Add Client": <UserPlus className="h-4 w-4" />,

  // Packages / Templates
  Packages: <Package className="h-4 w-4" />,
  "all Package": <Boxes className="h-4 w-4" />,
  "All Package": <Boxes className="h-4 w-4" />,
  Template: <FileText className="h-4 w-4" />,

  // Distribution
  Distribution: <Share2 className="h-4 w-4" />,
  "Task Creation": <ClipboardPlus className="h-4 w-4" />,
  "Clients to Agents": <Share2 className="h-4 w-4" />,

  // Tasks
  Tasks: <ClipboardList className="h-4 w-4" />,
  "All Tasks": <ListChecks className="h-4 w-4" />,
  "Task Categories": <ClipboardCheck className="h-4 w-4" />,

  // Agents
  Agents: <UserCog className="h-4 w-4" />,
  "All Agents": <Users className="h-4 w-4" />,
  "Add Agent": <UserPlus className="h-4 w-4" />,

  // Teams / QC / Roles / Users / Activity / Projects
  "Team Management": <Briefcase className="h-4 w-4" />,
  QC: <ShieldCheck className="h-4 w-4" />,
  "Role Permissions": <Key className="h-4 w-4" />,
  "User Management": <Users className="h-4 w-4" />,
  "Activity Logs": <History className="h-4 w-4" />,
  Projects: <Folder className="h-4 w-4" />,

  // Notifications
  Notifications: <BellRing className="h-4 w-4" />,

  // Chat
  Chat: <MessageCircleMore className="h-4 w-4" />,
};

interface AppSidebarProps {
  className?: string;
}

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r.status)
  );

type MeResponse = {
  user?: {
    id?: string;
    role?: string | null;
    name?: string | null;
    email?: string;
    permissions?: string[];
  } | null;
  impersonation?: {
    isImpersonating: boolean;
    realAdmin?: { id: string; name?: string | null; email: string } | null;
  };
};

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);
  const [submenuOpen, setSubmenuOpen] = React.useState<Record<string, boolean>>(
    {}
  );
  const { user } = useUserSession();
  const router = useRouter();
  const role = (user?.role as "admin" | "agent" | "qc" | "am") ?? "user";

  // Chat unread badge
  const { data: unreadData } = useSWR<{ count: number }>(
    "/api/chat/unread-count",
    fetcher,
    { refreshInterval: 15000, revalidateOnFocus: true }
  );
  const chatUnread = unreadData?.count ?? 0;

  // Impersonation state from /api/auth/me
  const { data: me } = useSWR<MeResponse>("/api/auth/me", fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
  });
  const isImpersonating = !!me?.impersonation?.isImpersonating;
  const startedBy =
    me?.impersonation?.realAdmin?.name ||
    me?.impersonation?.realAdmin?.email ||
    null;

  // Sign-out handler (direct API call)
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch { }
    try {
      localStorage.removeItem("chat:open");
    } catch { }
    router.push("/auth/sign-in");
  };

  const handleExitImpersonation = async () => {
    try {
      await fetch("/api/impersonate/stop", { method: "POST" });
    } catch { }
    router.refresh();
  };

  const data = {
    navItems: [
      {
        title: "Dashboard",
        url:
          role === "admin"
            ? "/admin"
            : role === "agent"
              ? "/agent"
              : role === "qc"
                ? "/qc"
                : "/am",
        roles: ["admin", "agent", "qc", "am"],
      },

      // Admin/AM Clients
      {
        title: "Clients",
        roles: ["admin"],
        children: [
          { title: "All Clients", url: "/admin/clients", roles: ["admin"] },
          {
            title: "Add Client",
            url: "/admin/clients/onboarding",
            roles: ["admin"],
          },
        ],
      },
      {
        title: "Clients",
        roles: ["am"],
        children: [
          { title: "All Clients", url: "/am/clients", roles: ["am"] },
          { title: "Add Client", url: "/am/clients/onboarding", roles: ["am"] },
        ],
      },

      // Packages & Templates
      {
        title: "Packages",
        roles: ["admin"],
        children: [
          { title: "all Package", url: "/admin/packages", roles: ["admin"] },
          { title: "Template", url: "/admin/templates", roles: ["admin"] },
        ],
      },

      // Distribution
      {
        title: "Distribution",
        roles: ["admin"],
        children: [
          {
            title: "Clients to Agents",
            url: "/admin/distribution/client-agent",
            roles: ["admin"],
          },
          {
            title: "Task Creation",
            url: "/admin/distribution/create-task",
            roles: ["admin"],
          },
        ],
      },

      // Tasks for Admin
      {
        title: "Tasks",
        roles: ["admin"],
        children: [
          { title: "All Tasks", url: "/admin/tasks", roles: ["admin"] },
          {
            title: "Task Categories",
            url: "/admin/tasks/tasks-categories",
            roles: ["admin"],
          },
        ],
      },

      // Tasks for Agent
      { title: "Tasks", url: "/agent/task", roles: ["agent"] },

      // Agents
      {
        title: "Agents",
        roles: ["admin"],
        children: [
          { title: "All Agents", url: "/admin/agents", roles: ["admin"] },
          { title: "Add Agent", url: "/admin/agents/create", roles: ["admin"] },
        ],
      },

      // Standalone admin links
      { title: "Team Management", url: "/admin/teams", roles: ["admin"] },
      { title: "QC", url: "/admin/qc-review", roles: ["admin"] },
      {
        title: "Role Permissions",
        url: "/admin/role-permissions",
        roles: ["admin"],
      },
      { title: "User Management", url: "/admin/user", roles: ["admin"] },
      { title: "Activity Logs", url: "/admin/activity", roles: ["admin"] },

      // Chat
      { title: "Chat", url: "/admin/chat", roles: ["admin"] },
      { title: "Chat", url: "/qc/chat", roles: ["qc"] },
      { title: "Chat", url: "/agent/chat", roles: ["agent"] },
      { title: "Chat", url: "/am/chat", roles: ["am"] },

      // Notifications
      { title: "Notifications", url: "/admin/notifications", roles: ["admin"] },
      { title: "Notifications", url: "/qc/notifications", roles: ["qc"] },
      { title: "Notifications", url: "/agent/notifications", roles: ["agent"] },
      { title: "Notifications", url: "/am/notifications", roles: ["am"] },
    ],
  };

  const toggleSubmenu = (title: string) => {
    setSubmenuOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Auto behaviors
  React.useEffect(() => {
    if (isMobile) setSidebarOpen(false);

    const next: Record<string, boolean> = {};
    for (const item of data.navItems) {
      if (item.children?.some((c) => c.url === pathname)) {
        next[item.title] = true;
      }
    }
    setSubmenuOpen((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="shadow-lg bg-white/95 backdrop-blur-sm border-gray-200/50 hover:bg-gray-50"
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -320,
          transition: { type: "spring", damping: 24, stiffness: 220 },
        }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64",
          "bg-gradient-to-b from-slate-50 via-white to-slate-50",
          "border-r border-gray-200/80 shadow-xl",
          "flex flex-col",
          className
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GalleryVerticalEnd className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Birds Of Eden
                </h1>
                <p className="text-xs text-gray-500">Enterprise Plan</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Role / quick actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1" />
                {role.charAt(0).toUpperCase() + role.slice(1)} Area
              </Badge>

              {isImpersonating && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                  Impersonating{startedBy ? ` (by ${startedBy})` : ""}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {data.navItems
              .filter((item) => !item.roles || item.roles.includes(role))
              .map((item) => {
                const hasChildren = !!item.children;
                const isActive = hasChildren
                  ? item.children?.some((c) => c.url === pathname)
                  : item.url === pathname;

                if (hasChildren) {
                  return (
                    <div key={item.title} className="space-y-1">
                      <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleSubmenu(item.title)}
                        className={cn(
                          "cursor-pointer p-2.5 rounded-lg flex items-center justify-between",
                          "transition-all duration-200 group",
                          "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50",
                          "hover:shadow-sm hover:border-gray-200/50 border border-transparent",
                          isActive &&
                          "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/50 shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg transition-all duration-200",
                              "bg-gradient-to-br from-gray-100 to-gray-200",
                              "group-hover:from-cyan-100 group-hover:to-blue-100",
                              isActive &&
                              "from-cyan-500 to-blue-500 text-white shadow-md"
                            )}
                          >
                            {iconMap[item.title] ?? (
                              <Folder className="h-4 w-4" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "font-medium transition-colors duration-200",
                              "text-gray-700 group-hover:text-gray-900",
                              isActive && "text-cyan-700"
                            )}
                          >
                            {item.title}
                          </span>
                        </div>
                        <motion.div
                          animate={{
                            rotate: submenuOpen[item.title] ? 90 : 0,
                            color: isActive ? "#0891b2" : "#6b7280",
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </motion.div>

                      <AnimatePresence>
                        {submenuOpen[item.title] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-6 space-y-1"
                          >
                            {item.children
                              ?.filter((child) => child.roles?.includes(role))
                              .map((child) => {
                                const childActive = child.url === pathname;
                                return (
                                  <Link
                                    key={child.title}
                                    href={child.url}
                                    className={cn(
                                      "flex items-center gap-3 p-2.5 rounded-lg",
                                      "transition-all duration-200 hover:bg-gray-50",
                                      childActive &&
                                      "bg-cyan-50 text-cyan-700 font-medium"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        childActive
                                          ? "bg-cyan-500"
                                          : "bg-gray-300"
                                      )}
                                    />
                                    <div className="p-1.5 rounded-md bg-gray-100">
                                      {iconMap[child.title] ?? (
                                        <FileText className="h-4 w-4" />
                                      )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                      {child.title}
                                    </span>
                                  </Link>
                                );
                              })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Single link item (includes Chat unread badge)
                return (
                  <Link
                    key={item.title}
                    href={item.url!}
                    className={cn(
                      "block p-2.5 rounded-lg transition-all duration-200 hover:bg-gray-50",
                      isActive &&
                      "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/50 shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200",
                          isActive &&
                          "from-cyan-500 to-blue-500 text-white shadow-md"
                        )}
                      >
                        {iconMap[item.title] ?? <Folder className="h-4 w-4" />}
                      </div>
                      <span
                        className={cn(
                          "font-medium text-gray-700",
                          isActive && "text-cyan-700"
                        )}
                      >
                        {item.title}
                      </span>

                      {/* Chat unread badge */}
                      {item.title === "Chat" && chatUnread > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          {chatUnread}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Footer / Profile */}
        <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm",
                  "border border-gray-200/50 shadow-sm hover:shadow transition"
                )}
              >
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage
                    src={user?.image ?? ""}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-500 text-white font-semibold">
                    {user?.name?.substring(0, 2)?.toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    {user?.name || "User"}
                    {role === "admin" && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px]"
                      >
                        Admin
                      </Badge>
                    )}
                    {role === "agent" && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px]"
                      >
                        Agent
                      </Badge>
                    )}
                    {role === "qc" && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px]"
                      >
                        QC
                      </Badge>
                    )}
                    {role === "am" && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px]"
                      >
                        AM
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Signed in as
                <span className="ml-1 font-medium text-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="w-full flex items-center gap-2"
                >
                  <BadgeCheck className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>

              {isImpersonating && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleExitImpersonation}
                    className="text-amber-700 focus:text-amber-800"
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Exit impersonation
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Spacer for desktop */}
      {sidebarOpen && <div className="w-64 flex-shrink-0 hidden md:block" />}
    </>
  );
}
