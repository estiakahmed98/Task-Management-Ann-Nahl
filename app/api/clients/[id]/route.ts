// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { TaskStatus } from "@prisma/client"

// --- helpers ---
async function computeClientProgress(clientId: string) {
  // সব টাস্ক নিয়ে groupBy করে কাউন্ট
  const grouped = await prisma.task.groupBy({
    by: ["status"],
    where: { clientId },
    _count: { _all: true },
  })

  // স্কিমার সব স্ট্যাটাস জিরো-ইনিশিয়ালাইজ
  const base: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    cancelled: 0,
    reassigned: 0,
    qc_approved: 0,
  }

  for (const row of grouped) {
    base[row.status] = row._count._all
  }

  const total =
    base.pending +
    base.in_progress +
    base.completed +
    base.overdue +
    base.cancelled +
    base.reassigned +
    base.qc_approved

  const progress = total > 0 ? Math.round((base.completed / total) * 100) : 0

  return {
    progress,
    taskCounts: {
      total,
      completed: base.completed,
      pending: base.pending,
      in_progress: base.in_progress,
      overdue: base.overdue,
      cancelled: base.cancelled,
      reassigned: base.reassigned,
      qc_approved: base.qc_approved,
    },
  }
}

async function recalcAndStoreClientProgress(clientId: string) {
  const { progress, taskCounts } = await computeClientProgress(clientId)
  await prisma.client.update({
    where: { id: clientId },
    data: { progress },
    select: { id: true }, // শুধু আপডেট নিশ্চিত করতে
  })
  return { progress, taskCounts }
}

// Optional: amId server-side role guard
async function assertIsAMOrNull(amId: string | null | undefined) {
  if (!amId) return
  const am = await prisma.user.findUnique({
    where: { id: amId },
    include: { role: true },
  })
  if (!am || am.role?.name !== "am") {
    throw new Error("amId is not an Account Manager (role 'am').")
  }
}

// --- GET ---
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // সর্বশেষ প্রগ্রেস DB-তে আপডেট করে নিন
    const fresh = await recalcAndStoreClientProgress(id)

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        socialMedias: true,
        package: true,
        // AM সম্পর্ক দেখাতে
        accountManager: { include: { role: true } },
        teamMembers: {
          include: {
            agent: { include: { role: true } },
            team: true,
          },
        },
        tasks: {
          include: {
            assignedTo: { include: { role: true } },
            templateSiteAsset: true,
            category: true,
          },
        },
        assignments: {
          include: {
            template: {
              include: {
                sitesAssets: true,
                templateTeamMembers: {
                  include: {
                    agent: { include: { role: true } },
                    team: true,
                  },
                },
              },
            },
            siteAssetSettings: { include: { templateSiteAsset: true } },
            tasks: { include: { assignedTo: true, templateSiteAsset: true } },
          },
        },
      },
    })

    if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 })

    // রেসপন্সে fresh progress + taskCounts যুক্ত করে পাঠাই
    return NextResponse.json({
      ...client,
      progress: fresh.progress,
      taskCounts: fresh.taskCounts,
    })
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error)
    return NextResponse.json({ message: "Failed to fetch client" }, { status: 500 })
  }
}

// --- PUT ---
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await req.json()
    const {
      name,
      birthdate,
      company,
      designation,
      location,
      website,
      website2,
      website3,
      companywebsite,
      companyaddress,
      biography,
      imageDrivelink,
      avatar,
      // progress - ক্লায়েন্ট থেকে নেবো না; আমরা নিজেই রিক্যালকুলেট করবো
      status,
      packageId,
      startDate,
      dueDate,

      // ⬇️ নতুন ফিল্ডগুলো (contact/credentials + AM)
      email,
      phone,
      password,
      recoveryEmail,
      amId,
    } = body

    // amId server-side validation (role must be 'am') — allow null to clear
    const amIdValue = typeof amId === "string" && amId.trim().length > 0 ? amId : null
    await assertIsAMOrNull(amIdValue)

    // আপডেট (progress বাদ)
    const updated = await prisma.client.update({
      where: { id },
      data: {
        name,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        company,
        designation,
        location,

        // নতুন ফিল্ডগুলো সংরক্ষণ
        email,
        phone,
        password,
        recoveryEmail,

        website,
        website2,
        website3,
        companywebsite,
        companyaddress,
        biography,
        imageDrivelink,
        avatar,
        status,
        packageId,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,

        // AM রিলেশন আপডেট
        amId: amIdValue, // null হলে unlink হবে
      },
      include: {
        socialMedias: true,
        package: true,
        accountManager: { include: { role: true } }, // AM দেখাতে
        teamMembers: {
          include: {
            agent: { include: { role: true } },
            team: true,
          },
        },
        tasks: {
          include: {
            assignedTo: { include: { role: true } },
            templateSiteAsset: true,
            category: true,
          },
        },
        assignments: {
          include: {
            template: {
              include: {
                sitesAssets: true,
                templateTeamMembers: {
                  include: {
                    agent: { include: { role: true } },
                    team: true,
                  },
                },
              },
            },
            siteAssetSettings: { include: { templateSiteAsset: true } },
            tasks: { include: { assignedTo: true, templateSiteAsset: true } },
          },
        },
      },
    })

    // আপডেটের পর progress রিক্যালকুলেট করে DB-তে লিখে নিন
    const fresh = await recalcAndStoreClientProgress(id)

    return NextResponse.json({
      ...updated,
      progress: fresh.progress,
      taskCounts: fresh.taskCounts,
    })
  } catch (error) {
    console.error(`Error updating client ${id}:`, error)
    // AM invalid হলে 400 দেওয়া হোক
    const message = error instanceof Error ? error.message : "Failed to update client"
    const status = message.includes("Account Manager") ? 400 : 500
    return NextResponse.json({ message }, { status })
  }
}
