// components/auth/ImpersonationBanner.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImpersonationBanner() {
  const [state, setState] = useState<{
    isImpersonating: boolean;
    adminName?: string | null;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        if (d?.impersonation?.isImpersonating) {
          setState({
            isImpersonating: true,
            adminName:
              d?.impersonation?.realAdmin?.name ||
              d?.impersonation?.realAdmin?.email,
          });
        } else {
          setState({ isImpersonating: false });
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!state?.isImpersonating) return null;

  const stop = async () => {
    await fetch("/api/impersonate/stop", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-300 px-4 py-2 flex items-center justify-between">
      <div className="text-sm">
        <strong>Impersonating</strong> — You are acting as another user.
        {state.adminName ? (
          <span className="ml-2">Started by: {state.adminName}</span>
        ) : null}
      </div>
      <Button size="sm" variant="outline" onClick={stop}>
        Exit impersonation
      </Button>
    </div>
  );
}
