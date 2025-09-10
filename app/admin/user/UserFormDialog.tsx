// app/users/UserFormDialog.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useUserSession } from "@/lib/hooks/use-user-session";
import type { FormData, Role, UserInterface, UserStatus } from "@/types/user";

type Mode = "create" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  initialUser?: UserInterface | null;
  onSuccess?: () => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  mode,
  initialUser,
  onSuccess,
}: Props) {
  const { user: currentUser, loading: sessionLoading } = useUserSession();

  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [clients, setClients] = useState<
    Array<{
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      biography?: string | null;
    }>
  >([]);

  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [usersSnapshot, setUsersSnapshot] = useState<UserInterface[]>([]);

  // formData-এর ভেতরেই firstName/lastName যোগ করা হলো
  const [formData, setFormData] = useState<FormData>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "",
    phone: "",
    address: "",
    biography: "",
    category: "",
    clientId: "",
    teamId: "",
    status: "active",
  });

  /** ---------- Fetch helpers ---------- */
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) setRoles(json.data);
      else setRoles([]);
    } catch {
      setRoles([]);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const res = await fetch("/api/teams");
      const json = await res.json();
      if (res.ok && Array.isArray(json)) setTeams(json);
      else if (res.ok && json?.data && Array.isArray(json.data)) setTeams(json.data);
      else setTeams([]);
    } catch {
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const res = await fetch("/api/clients");
      const json = await res.json();
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      if (res.ok && Array.isArray(list)) {
        const mapped = list.map((c: any) => ({
          id: String(c.id),
          name: c.name ?? "",
          email: c.email ?? null,
          phone: c.phone ?? null,
          address: c.address ?? c.companyaddress ?? c.location ?? null,
          biography: c.biography ?? null,
        }));
        setClients(mapped);
      } else {
        setClients([]);
      }
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const fetchUsersSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/users?limit=50&offset=0`);
      const json = await res.json();
      if (res.ok && Array.isArray(json.users)) setUsersSnapshot(json.users);
      else setUsersSnapshot([]);
    } catch {
      setUsersSnapshot([]);
    }
  }, []);

  /** ---------- Effects ---------- */
  useEffect(() => {
    if (open) {
      fetchRoles();
      fetchTeams();
      fetchUsersSnapshot();
    }
  }, [open, fetchRoles, fetchTeams, fetchUsersSnapshot]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialUser) {
      // নাম split করে formData-তে বসাই
      const fn = (initialUser.firstName ?? "").trim();
      const ln = (initialUser.lastName ?? "").trim();

      let firstName = fn;
      let lastName = ln;

      if (!fn && !ln && initialUser.name) {
        const parts = initialUser.name.trim().split(/\s+/);
        firstName = parts[0] ?? "";
        lastName = parts.slice(1).join(" ") ?? "";
      }

      setFormData({
        name: initialUser.name || `${firstName}${lastName ? ` ${lastName}` : ""}`,
        firstName,
        lastName,
        email: initialUser.email,
        password: "",
        roleId: initialUser.roleId || "",
        phone: initialUser.phone || "",
        address: initialUser.address || "",
        biography: initialUser.biography || "",
        category: initialUser.category || "",
        clientId: initialUser.clientId || "",
        teamId: "",
        status: initialUser.status || "active",
      });

      if ((initialUser.role?.name || "").toLowerCase() === "client") {
        fetchClients();
      }
    } else {
      setFormData({
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        roleId: "",
        phone: "",
        address: "",
        biography: "",
        category: "",
        clientId: "",
        teamId: "",
        status: "active",
      });
    }
  }, [open, mode, initialUser, fetchClients]);

  /** ---------- Derived ---------- */
  const isClientRole = useMemo(() => {
    if (!formData.roleId) return false;
    const role = roles.find((r) => r.id === formData.roleId);
    return role?.name?.toLowerCase() === "client";
  }, [formData.roleId, roles]);

  const availableClients = useMemo(() => {
    const used = new Set((usersSnapshot || []).map((u) => u.clientId).filter(Boolean) as string[]);
    const currentId = formData.clientId || "";
    return clients.filter((c) => !used.has(c.id) || c.id === currentId);
  }, [clients, usersSnapshot, formData.clientId]);

  const getPasswordRequirement = (roleId: string): number => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return 8;
    switch (role.name.toLowerCase()) {
      case "admin":
        return 12;
      case "manager":
        return 11;
      case "agent":
        return 10;
      default:
        return 8;
    }
  };

  /** ---------- Assign helper ---------- */
  const assignTeam = useCallback(
    async (agentId: string, teamId: string) => {
      try {
        setAssigning(true);
        const res = await fetch("/api/users/assign-team", { // <-- সঠিক রুট
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            teamId,
            assignmentType: "template",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to assign team");
        toast.success("Team assignment updated");
      } catch (e: any) {
        toast.error(e?.message || "Failed to assign team");
      } finally {
        setAssigning(false);
      }
    },
    []
  );

  /** ---------- Handlers ---------- */
  const handleSubmit = async () => {
    try {
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        toast.error("First name and Last name are required");
        return;
      }
      if (!formData.email || !formData.roleId) {
        toast.error("Please fill all required fields");
        return;
      }
      if (isClientRole && !formData.clientId) {
        toast.error("Please select a client for the Client role");
        return;
      }
      if (mode === "create" || (formData.password && formData.password.trim() !== "")) {
        const requiredLength = getPasswordRequirement(formData.roleId);
        if ((formData.password || "").length < requiredLength) {
          const roleName = roles.find((r) => r.id === formData.roleId)?.name || "this role";
          toast.error(`Password must be at least ${requiredLength} characters for ${roleName} role`);
          return;
        }
      }

      setActionLoading(true);

      const selectedTeamName =
        formData.teamId ? (teams.find((t) => t.id === formData.teamId)?.name || "") : "";

      const composedName =
        `${formData.firstName?.trim() || ""}${formData.lastName ? ` ${formData.lastName.trim()}` : ""}`;

      if (mode === "create") {
        const dataToSend = {
          ...formData,
          name: composedName,
          firstName: formData.firstName?.trim(),
          lastName: formData.lastName?.trim(),
          category: selectedTeamName || formData.category || "",
          actorId: currentUser?.id,
        };

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to create user");
        toast.success("User created successfully");

        const newUserId =
          json?.user?.id || json?.data?.id || json?.data?.user?.id || json?.createdUser?.id;

        if (formData.teamId && newUserId) {
          await assignTeam(newUserId, formData.teamId);
        } else if (formData.teamId && !newUserId) {
          toast.info("User created. Edit and re-select team to finalize assignment.");
        }
      } else {
        if (!initialUser) return;

        const updateData: any = {
          id: initialUser.id,
          name: composedName,
          firstName: formData.firstName?.trim(),
          lastName: formData.lastName?.trim(),
          email: formData.email,
          roleId: formData.roleId,
          phone: formData.phone,
          address: formData.address,
          biography: formData.biography,
          category: selectedTeamName || formData.category,
          clientId: formData.clientId || null,
          teamId: formData.teamId || null,
          status: formData.status,
          actorId: currentUser?.id,
        };

        if (formData.password && formData.password.trim() !== "") {
          updateData.password = formData.password.trim();
        }

        const res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to update user");
        toast.success("User updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.message || "Operation failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* First/Last Name (required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">
                First name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="e.g. Jane"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">
                Last name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.roleId}
              onValueChange={(value) => {
                setFormData({ ...formData, roleId: value });
                const requiredLength = getPasswordRequirement(value);
                const roleName = roles.find((r) => r.id === value)?.name || "this role";
                toast.info(
                  `Password must be at least ${requiredLength} characters for ${roleName} role`
                );
                const selected = roles.find((r) => r.id === value)?.name?.toLowerCase();
                if (selected === "client") {
                  fetchClients();
                }
              }}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client (when client role) */}
          {isClientRole && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId ?? undefined}
                onValueChange={(value) => {
                  const selected = clients.find((c) => c.id === value);
                  setFormData((prev) => ({
                    ...prev,
                    clientId: value,
                    // optional auto-fill from client:
                    email: selected?.email ?? prev.email,
                    phone: selected?.phone ?? prev.phone,
                    address: selected?.address ?? prev.address,
                    biography: selected?.biography ?? prev.biography,
                  }));
                }}
              >
                <SelectTrigger id="client" className="w-full">
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select Client"} />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.length === 0 ? (
                    <SelectItem disabled value="no-clients">
                      No clients found
                    </SelectItem>
                  ) : (
                    availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="flex items-center gap-1">
                {mode === "edit" ? "New Password" : "Password"}
                {mode === "create" && <span className="text-red-500">*</span>}
                {formData.roleId && (
                  <span className="text-xs text-blue-600 block">
                    {`Min ${getPasswordRequirement(formData.roleId)} characters`}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    formData.roleId
                      ? `Min ${getPasswordRequirement(formData.roleId)} characters`
                      : "Select a role first"
                  }
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={mode === "create"}
                  disabled={!formData.roleId}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Biography */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
              placeholder="Write a short bio here..."
              className="h-[20vh]"
            />
          </div>

          {/* Team & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.teamId || "none"}
                onValueChange={async (value) => {
                  const teamName =
                    value === "none"
                      ? ""
                      : teams.find((t) => t.id === value)?.name || "";

                  setFormData((prev) => ({
                    ...prev,
                    teamId: value === "none" ? "" : value,
                    category: teamName,
                  }));

                  if (mode === "edit" && initialUser?.id && value !== "none") {
                    await assignTeam(initialUser.id, value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select team"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: UserStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={actionLoading || sessionLoading}
          >
            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
