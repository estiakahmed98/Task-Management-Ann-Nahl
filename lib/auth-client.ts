// lib/auth-client.ts
"use client";

import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession as nextAuthUseSession,
} from "next-auth/react";

// 🔁 নাম একদম same রাখলাম: signIn, signUp, useSession, getSession, admin, signOut

export const signIn = async (email: string, password: string) => {
  // redirect:false → SPA flow
  const res = await nextAuthSignIn("credentials", {
    email,
    password,
    redirect: false,
  });
  return res;
};

export async function signOut(): Promise<boolean> {
  try {
    await nextAuthSignOut({ redirect: false });
    return true;
  } catch (e) {
    console.error("Sign out failed:", e);
    return false;
  }
}

export const useSession = nextAuthUseSession;

// আগের মতো getSession রাখলাম—তোমার `/api/auth/get-session` ঠিক আগের মতোই কাজ করবে
export async function getSession() {
  const res = await fetch("/api/auth/get-session", { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// Better Auth-এর admin() ফিচারের placeholder—ইম্পোর্ট না ভাঙার জন্য:
export const admin = new Proxy(
  {},
  {
    get: () => () => {
      throw new Error("admin() is not available with NextAuth.");
    },
  }
);

// Better Auth-এর signUp এখানে নেই—তুমি যেমন করো: /api/users (POST) দিয়ে ইউজার ক্রিয়েট, তারপর signIn()
export const signUp = async (..._args: any[]) => {
  throw new Error(
    "Use your existing /api/users (POST) to create users, then signIn()."
  );
};
