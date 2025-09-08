// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { inferAdditionalFields, customSessionClient } from "better-auth/client/plugins";
import { auth } from "@/lib/auth";

export const {
  signIn,
  signUp,
  useSession,
  getSession,
  admin
} = createAuthClient({
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        roleId: { type: "string" },
        role: {
          type: "string",
          nullable: true,
          required: false,
          properties: {
            name: { type: "string" },
          },
        },
      },
    }),
    customSessionClient<typeof auth>(),
  ],
});

export async function signOut(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/sign-out", {
      method: "POST",
    });

    return res.ok;
  } catch (error) {
    console.error("Sign out failed:", error);
    return false;
  }
}
