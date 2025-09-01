// components/presence/PresencePinger.tsx

"use client";
import { useEffect } from "react";

export default function PresencePinger() {
  useEffect(() => {
    const ping = () =>
      fetch("/api/presence/heartbeat", { method: "POST" }).catch(() => {});
    ping(); // প্রথমবার
    const t = setInterval(ping, 60_000); // প্রতি 60s
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
