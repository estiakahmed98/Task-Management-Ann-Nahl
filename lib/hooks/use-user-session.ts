// lib/hooks/use-user-session.ts
"use client";

import { useState, useEffect } from "react";

interface User {
  id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  roleId: string | null;
}

interface UserSession {
  user: User | null;
  loading: boolean;
}

export const useUserSession = (): UserSession => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/auth/get-session");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return { user, loading };
};
