// lib/auth.ts

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

// Server auth instance for Better Auth (used by API route and client types)
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
});

export default auth;

// Legacy helper kept for existing code paths that rely on the session token cookie
export async function getUserFromSession(token: string) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  return session?.user || null;
}
