// lib/auth.ts
import NextAuth from "next-auth";
import type { NextAuthConfig, Session, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string | null;
      permissions: string[];
    };
  }
}

// 👉 তোমার বিদ্যমান Prisma schema-র সাথে 1:1 mapping করা Adapter
// টাইপিং ইস্যু এড়াতে Adapter-টাকে any হিসেবে রিটার্ন করলাম।
const CustomAdapter = (): any => {
  return {
    // --- Users ---
    async createUser(data: any) {
      return prisma.user.create({ data });
    },
    async getUser(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },
    async getUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    async getUserByAccount(params: {
      provider: string;
      providerAccountId: string;
    }) {
      const { provider, providerAccountId } = params;
      const acct = await prisma.account.findFirst({
        where: { providerId: provider, accountId: String(providerAccountId) },
        include: { user: true },
      });
      return acct?.user ?? null;
    },
    async updateUser(data: any) {
      return prisma.user.update({ where: { id: data.id! }, data });
    },
    async deleteUser(id: string) {
      await prisma.user.delete({ where: { id } });
    },

    // --- Accounts ---
    async linkAccount(account: any) {
      await prisma.account.create({
        data: {
          accountId: String(account.providerAccountId),
          providerId: account.provider!,
          userId: account.userId!,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          idToken: account.id_token ?? null,
          scope: account.scope ?? null,
          accessTokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          refreshTokenExpiresAt: null,
          password: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    },
    async unlinkAccount(params: {
      provider: string;
      providerAccountId: string;
    }) {
      const { provider, providerAccountId } = params;
      await prisma.account.deleteMany({
        where: { providerId: provider, accountId: String(providerAccountId) },
      });
    },

    // --- Sessions (⚠️ তোমার টেবিলের ফিল্ড `token`, `expiresAt`) ---
    async createSession(session: any) {
      const created = await prisma.session.create({
        data: {
          token: session.sessionToken,
          userId: session.userId,
          expiresAt: session.expires,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return {
        ...session,
        sessionToken: created.token,
        userId: created.userId,
        expires: created.expiresAt,
      };
    },
    async getSessionAndUser(sessionToken: string) {
      const s = await prisma.session.findUnique({
        where: { token: sessionToken },
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
      if (!s) return null;
      return {
        session: {
          sessionToken: s.token,
          userId: s.userId,
          expires: s.expiresAt,
        },
        user: s.user,
      };
    },
    async updateSession(session: any) {
      const updated = await prisma.session.update({
        where: { token: session.sessionToken },
        data: { expiresAt: session.expires, updatedAt: new Date() },
      });
      return {
        sessionToken: updated.token,
        userId: updated.userId,
        expires: updated.expiresAt,
      };
    },
    async deleteSession(sessionToken: string) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    },

    // --- Verification (⚠️ টেবিল: Verification; ফিল্ড: value, expiresAt) ---
    async createVerificationToken(token: {
      identifier: string;
      token: string;
      expires: Date;
    }) {
      const created = await prisma.verification.create({
        data: {
          identifier: token.identifier,
          value: token.token,
          expiresAt: token.expires,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return {
        identifier: created.identifier,
        token: created.value,
        expires: created.expiresAt,
      };
    },
    async useVerificationToken(params: { identifier: string; token: string }) {
      const { identifier, token } = params;
      const found = await prisma.verification.findFirst({
        where: { identifier, value: token },
      });
      if (!found) return null;
      await prisma.verification.delete({ where: { id: found.id } });
      return {
        identifier: found.identifier,
        token: found.value,
        expires: found.expiresAt,
      };
    },
  };
};

export const authConfig: NextAuthConfig = {
  adapter: CustomAdapter(),
  session: {
    strategy: "database",
  },
  // 👉 কুকির নাম আগের মতোই, যাতে তোমার existing `/api/auth/get-session` / `/api/auth/me` as-is থাকে
  cookies: {
    sessionToken: {
      name: "session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        if (!creds?.email || !creds?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          include: {
            accounts: { where: { providerId: "credentials" } },
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        });
        if (!user || user.accounts.length === 0) return null;

        const account = user.accounts[0];
        const ok = await bcrypt.compare(creds.password, account.password ?? "");
        if (!ok) return null;

        // lastSeenAt update (তোমার আগের আচরণ বজায়)
        await prisma.user.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    // চাইলে session().user-এ role/permissions যোগ করে দিচ্ছি
    async session({ session, user }): Promise<Session> {
      if (session.user) {
        const dbUser = user as any;
        return {
          ...session,
          user: {
            ...session.user,
            id: dbUser.id,
            role: dbUser?.role?.name ?? null,
            permissions: dbUser?.role?.rolePermissions?.map((rp: any) => rp.permission.name) || []
          }
        };
      }
      return session;
    },
  },
  // debug: true,
};

// Export the auth config, handlers, and auth functions
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Ensure we're using the correct base path for the API routes
  basePath: '/api/auth',
  // Trust the host header for production
  trustHost: process.env.NODE_ENV === 'production',
  // Add debug logging in development
  debug: process.env.NODE_ENV === 'development',
});

// আগের ডিফল্ট এক্সপোর্ট রাখা হলো (কোথাও import authDefault থাকলে)
export default auth;

// তোমার পুরনো helper সিগনেচার—যদি কোথাও ব্যবহার করো:
export async function getUserFromSession(token: string) {
  if (!token) return null;
  const s = await prisma.session.findUnique({
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
  return s?.user ?? null;
}
