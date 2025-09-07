// app/api/utils/validate-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";

export const runtime = "nodejs"; // needed for dns/net

function isPrivateIp(ip: string) {
  if (ip === "::1") return true; // IPv6 localhost
  if (ip.startsWith("127.")) return true; // IPv4 localhost
  if (ip.startsWith("0.")) return true; // 0.0.0.0/8
  const [a, b] = ip.split(".").map((n) => parseInt(n, 10));
  if (a === 10) return true; // 10/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  return false;
}

async function isReachable(raw: string): Promise<{ ok: boolean; reason?: string }> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "Enter a valid URL (e.g., https://example.com)" };
  }
  if (!/^https?:$/.test(url.protocol)) {
    return { ok: false, reason: "URL must start with http:// or https://" };
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return { ok: false, reason: "Local/loopback URLs are not allowed." };
  }

  // SSRF guard (best-effort): resolve and reject private ranges
  try {
    const { address } = await dns.lookup(host);
    if (net.isIP(address) && isPrivateIp(address)) {
      return { ok: false, reason: "Private network URLs are not allowed." };
    }
  } catch {
    // let fetch continue; DNS may still resolve during fetch
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // 5s timeout

  const commonOpts: RequestInit = {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "*/*",
    },
    cache: "no-store",
    signal: controller.signal,
  };

  try {
    let res = await fetch(url, { ...commonOpts, method: "HEAD" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { ...commonOpts, method: "GET" });
    }
    const ok =
      (res.status >= 200 && res.status < 400) ||
      res.status === 401 || // protected is fine (exists)
      res.status === 403;
    return ok ? { ok: true } : { ok: false, reason: `URL responded with status ${res.status}.` };
  } catch {
    return { ok: false, reason: "URL is not reachable (network/DNS/timeout)." };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") || "";
  const result = await isReachable(url);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
