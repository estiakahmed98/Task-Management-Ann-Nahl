// app/api/users/stats/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const [totalUsers, activeUsers, inactiveUsers, verifiedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "inactive" } }),
      prisma.user.count({ where: { emailVerified: true } }),
    ])

    const unverifiedUsers = totalUsers - verifiedUsers

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers: 0, // set to 0 or remove if not supported
          verifiedUsers,
          unverifiedUsers,
          recentUsers: 0, // optional: implement logic later
        },
      },
    })
  } catch (error: any) {
    console.error("Failed to fetch user stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user stats",
        message: error.message,
      },
      { status: 500 }
    )
  }
}
