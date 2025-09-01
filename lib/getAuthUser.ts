import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  });
  if (!session || new Date() > session.expiresAt) return null;
  return session.user; // { id, name, email, role, ... }
}
