'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from "@/context/auth-context";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import ImpersonationBanner from "@/components/auth/ImpersonationBanner";
import PresencePinger from "@/components/presence/PresencePinger";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <SessionProvider
      // Re-fetch the session every 5 minutes
      refetchInterval={5 * 60}
      // Re-fetch session when window is focused
      refetchOnWindowFocus={true}
    >
      <AuthProvider>
        <ImpersonationBanner />
        <PresencePinger />
        {children}
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </SessionProvider>
  );
}
