// //app/api/activity/route.ts

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function GET() {
//   try {
//     const logs = await prisma.activityLog.findMany({
//       orderBy: { timestamp: "desc" },
//       include: { user: { select: { id: true, name: true, email: true } } },

//       take: 50, // শুধু 20টা লগ দেখাও
//     });

//     return NextResponse.json({ success: true, logs });
//   } catch (error: any) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to fetch activity logs",
//         message: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const q = searchParams.get("q") || ""
    const action = searchParams.get("action") || ""

    // Calculate offset for pagination
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}

    if (action && action !== "all") {
      where.action = action
    }

    if (q) {
      where.OR = [
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ]
    }

    const totalCount = await prisma.activityLog.count({ where })

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch activity logs",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
