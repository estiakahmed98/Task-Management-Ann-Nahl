// lib/permissions-client.ts

// এইটা শুধুই UI control এর জন্য (API তে তো server-side check আছেই)
export function hasPermissionClient(
  userPermissions: string[] | undefined,
  permission: string
) {
  if (!userPermissions) return false;
  return userPermissions.includes(permission);
}
