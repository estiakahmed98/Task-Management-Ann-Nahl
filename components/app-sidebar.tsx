// components/app-sidebar.tsx

"use client";

import * as React from "react";
import useSWR from "swr";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Package,
  Boxes,
  FileText,
  Share2,
  ClipboardList,
  ListChecks,
  UserCog,
  Folder,
  Key,
  ShieldCheck,
  History,
  BellRing,
  MessageCircleMore,
  GalleryVerticalEnd,
  Settings,
  Menu,
  X,
  ChevronRight,
  BadgeCheck,
  Shield,
  ShieldOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useUserSession } from "@/lib/hooks/use-user-session";
import { NotificationBell } from "@/components/notification-bell";

type Role =
  | "admin"
  | "manager"
  | "agent"
  | "qc"
  | "am"
  | "am_ceo"
  | "data_entry"
  | "client"
  | "user";

type NavLeaf = {
  title: string;
  url: string;
  roles?: Role[];
};

type NavGroup = {
  title: string;
  roles?: Role[];
  children: NavLeaf[];
};

type NavItem = NavLeaf | NavGroup;

const ICONS: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Clients: <Users className="h-4 w-4" />,
  "All Clients": <Users className="h-4 w-4" />,
  "Add Client": <UserPlus className="h-4 w-4" />,
  Packages: <Package className="h-4 w-4" />,
  "All Package": <Boxes className="h-4 w-4" />,
  Template: <FileText className="h-4 w-4" />,
  Distribution: <Share2 className="h-4 w-4" />,
  "Clients to Agents": <Share2 className="h-4 w-4" />,
  Tasks: <ClipboardList className="h-4 w-4" />,
  "All Tasks": <ListChecks className="h-4 w-4" />,
  Agents: <UserCog className="h-4 w-4" />,
  "All Agents": <Users className="h-4 w-4" />,
  "Add Agent": <UserPlus className="h-4 w-4" />,
  "Team Management": <UserCog className="h-4 w-4" />,
  QC: <ShieldCheck className="h-4 w-4" />,
  "QC Dashboard": <ShieldCheck className="h-4 w-4" />,
  "QC Review": <ShieldCheck className="h-4 w-4" />,
  "Role Permissions": <Key className="h-4 w-4" />,
  "User Management": <Users className="h-4 w-4" />,
  "Activity Logs": <History className="h-4 w-4" />,
  Projects: <Folder className="h-4 w-4" />,
  Notifications: <BellRing className="h-4 w-4" />,
  Chat: <MessageCircleMore className="h-4 w-4" />,
};

// --- Helpers: role base paths --------------------------------

const basePath: Record<Role, string> = {
  admin: "/admin",
  manager: "/manager",
  agent: "/agent",
  qc: "/qc",
  am: "/am",
  am_ceo: "/am_ceo",
  data_entry: "/data_entry",
  client: "/client",
  user: "/client", // sensible default
};

const p = (role: Role, suffix = "") => `${basePath[role]}${suffix}`;

// --- Fetcher --------------------------------------------------

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) =>
    r.ok ? r.json() : Promise.reject(r.status)
  );

// --- Nav model (single source of truth) -----------------------

function buildNav(role: Role): NavItem[] {
  return [
    {
      title: "Dashboard",
      url: p(role, role === "client" ? "" : ""),
      roles: ["admin", "agent", "qc", "am", "am_ceo", "manager", "client"],
    },

    {
      title: "Dashboard",
      url: p(role, "/clients"),
      roles: ["data_entry"],
    },

    {
      title: "Chat",
      url: p(role, "/chat"),
      roles: ["admin", "qc", "agent", "am", "am_ceo", "manager", "data_entry", "client"],
    },

    // Clients (admin, manager, am, data_entry)
    {
      title: "Clients",
      roles: ["admin", "manager", "am",],
      children: [
        {
          title: "All Clients",
          url: p(role, "/clients"),
          roles: ["admin", "manager", "am",],
        },
        {
          title: "Add Client",
          url: p(role, "/clients/onboarding"),
          roles: ["admin", "manager", "am",],
        },
      ],
    },

    // AM Clients (am_ceo)
    {
      title: "AM Clients",
      roles: ["am_ceo"],
      children: [
        {
          title: "All AM Clients",
          url: p(role, "/clients"),
          roles: ["am_ceo"],
        },
      ],
    },

    // Packages & Templates (admin, manager)
    {
      title: "Packages",
      roles: ["admin", "manager", "data_entry"],
      children: [
        {
          title: "All Package",
          url: p(role, "/packages"),
          roles: ["admin", "manager", "data_entry"],
        },
        // {
        //   title: "Template",
        //   url: p(role, "/templates"),
        //   roles: ["admin", "manager"],
        // },
      ],
    },

    // Distribution (admin, manager)
    {
      title: "Distribution",
      roles: ["admin", "manager"],
      children: [
        {
          title: "Clients to Agents",
          url: p(role, "/distribution/client-agent"),
          roles: ["admin", "manager"],
        },
      ],
    },

    // Tasks (admin/manager group; agent standalones; qc review)
    {
      title: "Tasks",
      roles: ["admin", "manager"],
      children: [
        {
          title: "All Tasks",
          url: p(role, "/tasks"),
          roles: ["admin", "manager"],
        },
      ],
    },
    { title: "Tasks", url: p("agent", "/tasks"), roles: ["agent"] },
    {
      title: "Tasks History",
      url: p("agent", "/taskHistory"),
      roles: ["agent"],
    },
    { title: "QC Review", url: p("qc", "/tasks"), roles: ["qc"] },

    // Agents (admin, manager)
    {
      title: "Agents",
      roles: ["admin", "manager"],
      children: [
        {
          title: "All Agents",
          url: p(role, "/agents"),
          roles: ["admin", "manager"],
        },
        {
          title: "Add Agent",
          url: p(role, "/agents/create"),
          roles: ["admin", "manager"],
        },
      ],
    },

    // Admin/Manager singletons
    {
      title: "Team Management",
      url: p(role, "/teams"),
      roles: ["admin", "manager"],
    },
    {
      title: "QC",
      roles: ["admin", "manager"],
      children: [
        {
          title: "QC Dashboard",
          url: p(role, "/qc/qc-dashboard"),
          roles: ["admin", "manager"],
        },
        {
          title: "QC Review",
          url: p(role, "/qc/qc-review"),
          roles: ["admin", "manager"],
        },
      ],
    },
    {
      title: "Role Permissions",
      url: "/admin/role-permissions",
      roles: ["admin"],
    },
    {
      title: "User Management",
      url: p(role, "/user"),
      roles: ["admin", "manager"],
    },
    {
      title: "Activity Logs",
      url: p(role, "/activity"),
      roles: ["admin", "manager"],
    },

    // Notifications
    {
      title: "Notifications",
      url: p(role, "/notifications"),
      roles: ["admin", "manager", "qc", "agent", "am", "am_ceo", "data_entry", "client"],
    },
  ];
}

// --- Small utils ---------------------------------------------

function isGroup(item: NavItem): item is NavGroup {
  return (item as NavGroup).children !== undefined;
}

function useActive(pathname: string) {
  const baseRoots = React.useMemo(() => new Set(Object.values(basePath)), []);

  return React.useCallback(
    (url: string) => {
      if (baseRoots.has(url) || url === "/" || url.endsWith("/dashboard")) {
        return pathname === url;
      }
      return (
        pathname === url ||
        (pathname.startsWith(url) &&
          (pathname.length === url.length ||
            pathname[url.length] === "/" ||
            pathname[url.length] === "?"))
      );
    },
    [pathname, baseRoots]
  );
}

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = React.useState(!isMobile);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const router = useRouter();

  const { user } = useUserSession();
  const role: Role = (user?.role as Role) ?? "user";

  // Chat unread badge
  const { data: unreadData } = useSWR<{ count: number }>(
    "/api/chat/unread-count",
    fetcher,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: true,
    }
  );
  const chatUnread = unreadData?.count ?? 0;

  // Impersonation state
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
  const { data: me } = useSWR<MeResponse>("/api/auth/me", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });
  const isImpersonating = !!me?.impersonation?.isImpersonating;
  const startedBy =
    me?.impersonation?.realAdmin?.name ||
    me?.impersonation?.realAdmin?.email ||
    null;

  const active = useActive(pathname);
  const nav = React.useMemo(() => buildNav(role), [role]);

  // Auto behaviors
  React.useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of nav) {
      if (isGroup(item) && item.children.some((c) => active(c.url)))
        next[item.title] = true;
    }
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [nav, active]);

  // Actions
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

  // Orientation: mobile = top bar; desktop = sidebar
  return (
    <div className="relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GalleryVerticalEnd className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Birds Of Eden</p>
              <p className="text-[10px] text-muted-foreground">
                Enterprise Plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              apiBase={
                role === "am" ? "/api/am/notifications" : "/api/notifications"
              }
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="px-2 pb-2"
              aria-label="Mobile navigation"
            >
              {nav
                .filter((i) => !i.roles || i.roles.includes(role))
                .map((item) => (
                  <MobileItem
                    key={item.title}
                    item={item}
                    active={active}
                    role={role}
                    expanded={expanded}
                    setExpanded={setExpanded}
                  />
                ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -300 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-screen w-64 z-40 flex-col",
          "bg-gradient-to-b from-slate-50 via-white to-slate-50",
          "border-r border-gray-200/80 shadow-xl",
          className
        )}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GalleryVerticalEnd className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold">Birds Of Eden</h1>
                <p className="text-xs text-muted-foreground">Enterprise Plan</p>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>

          {/* Role / quick actions */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1" />
                {role.charAt(0).toUpperCase() + role.slice(1)} Area
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell
                apiBase={
                  role === "am" ? "/api/am/notifications" : "/api/notifications"
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
                aria-label="Settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {nav
              .filter((i) => !i.roles || i.roles.includes(role))
              .map((item) =>
                isGroup(item) ? (
                  <GroupItem
                    key={item.title}
                    item={item}
                    active={active}
                    expanded={expanded}
                    setExpanded={setExpanded}
                  />
                ) : (
                  <LeafItem
                    key={item.title}
                    item={item}
                    active={active}
                    chatUnread={chatUnread}
                  />
                )
              )}
          </div>
        </div>

        {/* Footer / Profile */}
        <SidebarFooter
          userName={user?.name || "User"}
          userEmail={user?.email || ""}
          userImage={user?.image || ""}
          role={role}
          isImpersonating={isImpersonating}
          startedBy={startedBy}
          onExitImpersonation={handleExitImpersonation}
          onSignOut={handleSignOut}
        />
      </motion.aside>

      {/* Desktop spacer */}
      <div className="hidden md:block" style={{ width: 256 }} />
    </div>
  );
}

// --- Pieces ---------------------------------------------------

function GroupItem({
  item,
  active,
  expanded,
  setExpanded,
}: {
  item: NavGroup;
  active: (url: string) => boolean;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const isActive = item.children.some((c) => active(c.url));
  const open = !!expanded[item.title];

  return (
    <div className="space-y-1">
      <motion.button
        type="button"
        onClick={() =>
          setExpanded((s) => ({ ...s, [item.title]: !s[item.title] }))
        }
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full cursor-pointer p-2.5 rounded-lg flex items-center justify-between",
          "transition-all duration-200 group",
          "hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50",
          "hover:shadow-sm hover:border-gray-200/50 border border-transparent text-left",
          isActive &&
          "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200/50 shadow-sm"
        )}
        aria-expanded={open}
        aria-controls={`section-${item.title}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg transition-all duration-200 bg-gradient-to-br from-gray-100 to-gray-200",
              isActive && "from-cyan-500 to-blue-500 text-white shadow-md"
            )}
          >
            {ICONS[item.title] ?? <Folder className="h-4 w-4" />}
          </div>
          <span
            className={cn(
              "font-medium transition-colors duration-200 text-gray-700 group-hover:text-gray-900",
              isActive && "text-cyan-700"
            )}
          >
            {item.title}
          </span>
        </div>
        <motion.div
          animate={{
            rotate: open ? 90 : 0,
            color: isActive ? "#0891b2" : "#6b7280",
          }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`section-${item.title}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-6 space-y-1"
          >
            {item.children.map((child) => (
              <LeafItem key={child.title} item={child} active={active} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LeafItem({
  item,
  active,
  chatUnread,
}: {
  item: NavLeaf;
  active: (url: string) => boolean;
  chatUnread?: number;
}) {
  const isActive = active(item.url);
  return (
    <Link
      href={item.url}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg",
        "transition-all duration-200 hover:bg-gray-50",
        isActive && "bg-cyan-50 text-cyan-700 font-medium"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <div
        className={cn(
          "p-1.5 rounded-md bg-gray-100",
          isActive && "bg-cyan-100 text-cyan-700"
        )}
      >
        {ICONS[item.title] ?? <FileText className="h-4 w-4" />}
      </div>
      <span className="text-sm font-medium text-gray-700">{item.title}</span>
      {item.title === "Chat" && Number(chatUnread) > 0 && (
        <span className="ml-auto inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white">
          {chatUnread}
        </span>
      )}
    </Link>
  );
}

function MobileItem({
  item,
  active,
  role,
  expanded,
  setExpanded,
}: {
  item: NavItem;
  active: (url: string) => boolean;
  role: Role;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  if (!isGroup(item)) return <LeafItem item={item} active={active} />;
  const open = !!expanded[item.title];
  const isActive = item.children.some((c) => active(c.url));
  return (
    <div className="rounded-lg border border-gray-200/60 overflow-hidden mb-1">
      <button
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 bg-white",
          isActive && "bg-cyan-50"
        )}
        onClick={() =>
          setExpanded((s) => ({ ...s, [item.title]: !s[item.title] }))
        }
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg bg-gray-100",
              isActive && "bg-cyan-100 text-cyan-700"
            )}
          >
            {ICONS[item.title] ?? <Folder className="h-4 w-4" />}
          </div>
          <span className="text-sm font-medium">{item.title}</span>
        </div>
        <ChevronRight
          className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="bg-white"
          >
            <div className="px-3 py-2 space-y-1">
              {item.children.map((c) => (
                <LeafItem key={c.title} item={c} active={active} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarFooter({
  userName,
  userEmail,
  userImage,
  role,
  isImpersonating,
  startedBy,
  onExitImpersonation,
  onSignOut,
}: {
  userName: string;
  userEmail?: string;
  userImage: string;
  role: Role;
  isImpersonating: boolean;
  startedBy: string | null;
  onExitImpersonation: () => void;
  onSignOut: () => void;
}) {
  return (
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
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-500 text-white font-semibold">
                {userName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                {userName}
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 py-0 text-[10px]"
                >
                  {role.toUpperCase()}
                </Badge>
              </p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="ml-1 font-medium text-foreground">
              {userEmail}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="w-full flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="w-full flex items-center gap-2">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </DropdownMenuItem>

          {isImpersonating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onExitImpersonation}
                className="text-amber-700 focus:text-amber-800"
              >
                <ShieldOff className="h-4 w-4 mr-2" /> Exit impersonation
                {startedBy ? ` (by ${startedBy})` : ""}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-700"
            onClick={onSignOut}
          >
            <History className="hidden" />
            {/* Keep icon layout consistent if you want: <LogOut /> */}
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
