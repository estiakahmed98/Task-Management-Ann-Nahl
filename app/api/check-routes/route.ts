import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Route checking endpoint",
    availableRoutes: {
      users: "/api/users",
      userStats: "/api/users/stats",
      individualUser: "/api/users/user/[id]",
      roles: "/api/roles",
      seed: "/api/users/seed",
      debug: "/api/debug",
      test: "/api/test",
    },
    instructions: [
      "1. First seed some data: POST /api/users/seed",
      "2. Then check users: GET /api/users",
      "3. Then check stats: GET /api/users/stats",
      "4. Check individual user: GET /api/users/user/[user-id]",
    ],
  })
}
