// lib/permissions.ts

import prisma from "@/lib/prisma";

/**
 * Fetch all permissions of a given user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!user || !user.role) return [];

  // return only permission names
  return user.role.rolePermissions.map((rp) => rp.permission.name);
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(requiredPermission);
}
