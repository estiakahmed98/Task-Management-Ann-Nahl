// app/api/activity/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher/server"
import { getAuthUser } from "@/lib/getAuthUser"

// ---------- CREATE (with QC support) ----------
export async function POST(request: Request) {
  try {
    const me = await getAuthUser().catch(() => null)
    const raw = await request.json().catch(() => ({} as any))

    // Normal payloads
    const entityType = (raw?.entityType as string) || ""
    const entityId = (raw?.entityId as string) || ""
    const incomingAction = (raw?.action as string) || "" // still supported
    const incomingDetails = raw?.details ?? null

    // Keep existing behavior: allow body.userId or fallback to me?.id
    const userId = (raw?.userId as string | undefined) || (me?.id ?? undefined)

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, message: "entityType and entityId are required" },
        { status: 400 },
      )
    }

    // ---- QC smart mapping ----
    // If qcApproved or qcAction==='approved' => qc_approved
    // If qcReassigned or qcAction==='reassigned' => qc_reassigned
    const qcApproved =
      raw?.qcApproved === true || (typeof raw?.qcAction === "string" && raw.qcAction.toLowerCase() === "approved")
    const qcReassigned =
      raw?.qcReassigned === true || (typeof raw?.qcAction === "string" && raw.qcAction.toLowerCase() === "reassigned")

    let resolvedAction = incomingAction
    let mergedDetails: any = incomingDetails ?? {}

    if (qcApproved) {
      resolvedAction = "qc_approved"
      mergedDetails = {
        ...mergedDetails,
        qc: {
          status: "approved",
          notes: raw?.qcNotes ?? null,           // optional note
          approvedBy: userId ?? null,            // who approved
        },
      }
    } else if (qcReassigned) {
      resolvedAction = "qc_reassigned"
      mergedDetails = {
        ...mergedDetails,
        qc: {
          status: "reassigned",
          fromUserId: raw?.fromUserId ?? null,   // previous QC (optional)
          toUserId: raw?.toUserId ?? null,       // new QC (optional)
          reason: raw?.reason ?? null,           // optional reason
          reassignedBy: userId ?? null,          // who reassigned
        },
      }
    }

    // Final guard: action must exist from either normal action or QC mapping
    if (!resolvedAction) {
      return NextResponse.json(
        { success: false, message: "action is required (or use qcApproved / qcReassigned)" },
        { status: 400 },
      )
    }

    const log = await prisma.activityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        entityType,
        entityId,
        userId,
        action: resolvedAction,
        details: mergedDetails,
      },
    })

    // Realtime broadcast
    try {
      await pusherServer.trigger("activity", "activity:new", {
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        action: log.action,           // will be qc_approved / qc_reassigned too
        details: log.details,
        timestamp: (log as any).timestamp ?? new Date().toISOString(),
      })
    } catch {
      // swallow pusher errors
    }

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create activity log",
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}

// ---------- LIST (search/filter/pagination) ----------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const q = searchParams.get("q") || ""
    const action = searchParams.get("action") || ""

    const skip = (page - 1) * limit

    const where: any = {}

    if (action && action !== "all") {
      // works for 'qc_approved' and 'qc_reassigned' too
      where.action = action
    }

    if (q) {
      where.OR = [
        { entityType: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q, mode: "insensitive" } },
        // If your relation is optional, Prisma recommends `is: { ... }`
        { user: { is: { name: { contains: q, mode: "insensitive" } } } },
        { user: { is: { email: { contains: q, mode: "insensitive" } } } },
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
        message: error?.message || String(error),
      },
      { status: 500 },
    )
  }
}
