// import { NextRequest, NextResponse } from "next/server";

// export function middleware(request: NextRequest) {
//   const token = request.cookies.get("session-token")?.value;

//   if (!token) {
//     return NextResponse.redirect(new URL("/auth/sign-in", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/admin/:path*",
//     "/agent/:path*",
//     "/manager/:path*",
//     "/qc/:path*",
//     "/am/:path*",
//     "/client/:path*",
//     "/data_entry/:path*",
//   ],
// };

// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Public (unauthenticated) API endpoints — keep minimal
const PUBLIC_API_ROUTES = new Set<string>([
  "/api/auth/sign-in",
  "/api/auth/get-session", // optional: you can remove if you want this guarded too
]);

export function middleware(req: NextRequest) {
  const { pathname, origin, host } = req.nextUrl;

  // ----------  A) Protect ALL API routes  ----------
  if (pathname.startsWith("/api/")) {
    // 1) Allow listed public endpoints
    if (PUBLIC_API_ROUTES.has(pathname)) {
      return NextResponse.next();
    }

    // 2) Same-origin enforcement (blocks "outside" fetches)
    //    If Origin header is present, it MUST equal our origin.
    const requestOrigin = req.headers.get("origin");
    if (requestOrigin && requestOrigin !== origin) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Forbidden: cross-origin blocked",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    //    If Referer is present, it MUST start with our origin.
    const referer = req.headers.get("referer");
    if (referer && !referer.startsWith(origin)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "Forbidden: external referer",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) Require session cookie for all non-public APIs
    const token = req.cookies.get("session-token")?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4) (Optional) Let OPTIONS preflight through if you use CORS internally
    if (req.method === "OPTIONS") {
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // ----------  B) Guard App Pages (your original logic) ----------
  const token = req.cookies.get("session-token")?.value;

  // Only for protected app sections
  const needsAuth =
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/agent/") ||
    pathname.startsWith("/manager/") ||
    pathname.startsWith("/qc/") ||
    pathname.startsWith("/am/") ||
    pathname.startsWith("/client/") ||
    pathname.startsWith("/data_entry/");

  if (needsAuth && !token) {
    // Redirect unauthenticated users to sign-in page
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to both app sections and ALL APIs
export const config = {
  matcher: [
    // App pages
    "/admin/:path*",
    "/agent/:path*",
    "/manager/:path*",
    "/qc/:path*",
    "/am/:path*",
    "/client/:path*",
    "/data_entry/:path*",
    // APIs
    "/api/:path*",
  ],
};
