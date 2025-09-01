// app/api/social-medias/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
// platform is now a free-form string in the DB
const normalizePlatform = (input: unknown): string => {
  const raw = String(input ?? "").trim()
  return raw || "OTHER"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      clientId?: string
      platform?: string | null
      url?: string | null
      username?: string | null
      email?: string | null
      phone?: string | null
      password?: string | null
      notes?: string | null
    }

    if (!body.clientId) {
      return NextResponse.json({ message: "clientId is required" }, { status: 400 })
    }

    const created = await prisma.socialMedia.create({
      data: {
        clientId: body.clientId,
        platform: normalizePlatform(body.platform) as any,
        url: body.url ?? null,
        username: body.username ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        password: body.password ?? null,
        notes: body.notes ?? null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating social media:", error)
    return NextResponse.json({ message: "Failed to create social media" }, { status: 500 })
  }
}

// GET /api/social-medias?clientId=abc
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId") || undefined

  const items = await prisma.socialMedia.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items)
}
