// app/admin/role-permissions/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Toaster, toast } from "sonner"; // ✅ Sonner
import { cn } from "@/lib/utils"; // optional helper; remove if you don't have it

type Role = {
  id: string;
  name: string;
  description?: string | null;
  _count?: { users: number };
};

type Permission = {
  id: string;
  name: string;
  description?: string | null;
};

export default function RolePermissionPage() {
  const { user } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState<{ id: string; permissions: string[] } | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formRole, setFormRole] = useState<{ name: string; description?: string }>({
    name: "",
    description: "",
  });
  const [submittingRole, setSubmittingRole] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });

  // ---------------- Loaders ----------------
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const res = await fetch("/api/roles", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load roles");
      setRoles(data.data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setPermLoading(true);
      const res = await fetch("/api/permissions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load permissions");
      setPermissions(data.data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load permissions");
    } finally {
      setPermLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRolePermissions = async (roleId: string) => {
    try {
      const res = await fetch(`/api/role-permissions/${roleId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load role permissions");
      setSelectedRole({
        id: roleId,
        permissions: (data.permissions || []).map((p: any) => p.id),
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load role permissions");
    }
  };

  // ---------------- CRUD: Roles ----------------
  const openCreateRole = () => {
    setEditingRole(null);
    setFormRole({ name: "", description: "" });
    setShowRoleModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setFormRole({ name: role.name, description: role.description || "" });
    setShowRoleModal(true);
  };

  const submitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRole(true);
    try {
      if (editingRole) {
        // UPDATE
        const res = await fetch(`/api/roles/${editingRole.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formRole.name, description: formRole.description }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to update role");

        toast.success("Role updated");
      } else {
        // CREATE (server auto-generates id)
        const res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formRole.name, description: formRole.description }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to create role");

        toast.success("Role created");
      }
      setShowRoleModal(false);
      await loadRoles();
    } catch (e: any) {
      toast.error(e.message || "Role save failed");
    } finally {
      setSubmittingRole(false);
    }
  };

  const confirmDeleteRole = (role: Role) => setConfirmDelete({ open: true, role });

  const doDeleteRole = async () => {
    if (!confirmDelete.role) return;
    try {
      const res = await fetch(`/api/roles/${confirmDelete.role.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete role");
      toast.success("Role deleted");
      // If the selected role was deleted, clear
      if (selectedRole?.id === confirmDelete.role.id) setSelectedRole(null);
      await loadRoles();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setConfirmDelete({ open: false, role: null });
    }
  };

  // ---------------- Toggle Permission ----------------
  const togglePermission = async (permissionId: string, checked: boolean) => {
    if (!selectedRole) return;

    try {
      if (checked) {
        const res = await fetch("/api/role-permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: selectedRole.id, permissionId }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || "Failed to assign permission");
        }
      } else {
        const res = await fetch(`/api/role-permissions/${selectedRole.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionId }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || "Failed to remove permission");
        }
      }
      await loadRolePermissions(selectedRole.id);
      toast.success("Permissions updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update permission");
    }
  };

  // ---------------- Derived ----------------
  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [roles, search]);

  const selectedRoleMeta = useMemo(
    () => roles.find((r) => r.id === selectedRole?.id),
    [roles, selectedRole?.id]
  );

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- Left: Role List ---------- */}
        <section className="lg:col-span-1 rounded-2xl border bg-white shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Roles</h2>
              <p className="text-sm text-muted-foreground">
                {rolesLoading ? "Loading…" : `${roles.length} total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateRole}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                + New
              </button>
            </div>
          </div>

          <div className="p-4 border-b">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles…"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <ul className="divide-y max-h-[60vh] overflow-auto">
            {filteredRoles.map((role) => (
              <li key={role.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                <button
                  className={cn(
                    "text-left flex-1",
                    selectedRole?.id === role.id ? "font-semibold text-emerald-700" : "text-slate-800"
                  )}
                  onClick={() => loadRolePermissions(role.id)}
                  title="Select to manage permissions"
                >
                  <div className="text-sm">{role.name.toUpperCase()}</div>
                  {!!role._count?.users && (
                    <div className="text-[11px] text-slate-500">{role._count.users} user(s)</div>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditRole(role)}
                    className="px-2 py-1 text-sm rounded-md border hover:bg-slate-100"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}

            {!rolesLoading && filteredRoles.length === 0 && (
              <li className="p-4 text-sm text-slate-500">No roles found.</li>
            )}
          </ul>
        </section>

        {/* ---------- Right: Permission Manager ---------- */}
        <section className="lg:col-span-2 rounded-2xl border bg-white shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Permissions</h2>
              <p className="text-sm text-muted-foreground">
                {permLoading ? "Loading…" : `${permissions.length} available`}
              </p>
            </div>

            {selectedRole ? (
              <div className="text-sm text-slate-600">
                Managing: <span className="font-semibold">{selectedRoleMeta?.name || selectedRole.id}</span>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Select a role to manage</div>
            )}
          </div>

          <div className="p-4">
            {!selectedRole && <p className="text-sm text-slate-500">Select a role to manage permissions.</p>}

            {selectedRole && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {permissions.map((p) => {
                  const checked = selectedRole.permissions.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => togglePermission(p.id, e.target.checked)}
                      />
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        {p.description ? (
                          <div className="text-xs text-slate-500">{p.description}</div>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ---------- Modal: Create / Edit Role ---------- */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{editingRole ? "Edit Role" : "Create Role"}</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-500 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form onSubmit={submitRole} className="p-4 space-y-3">
              {/* Role ID removed: now auto-generated on server */}
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  value={formRole.name}
                  onChange={(e) => setFormRole((s) => ({ ...s, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
                  placeholder="e.g. Admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={formRole.description}
                  onChange={(e) => setFormRole((s) => ({ ...s, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-300"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border hover:bg-slate-50"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingRole ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
