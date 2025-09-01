// app/api/social-medias/[id]/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
// platform is now a free-form string in the DB
const normalizePlatform = (input: unknown): string => {
  const raw = String(input ?? "").trim()
  return raw || "OTHER"
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const body = await req.json() as {
      platform?: string | null
      url?: string | null
      username?: string | null
      email?: string | null
      phone?: string | null
      password?: string | null
      notes?: string | null
    }

    // Build a partial update object; leave fields undefined to skip updating
    const data: Record<string, any> = {
      // Only update platform if provided; normalize to non-empty string
      platform: body.platform === undefined ? undefined : (normalizePlatform(body.platform) as any),
      url: body.url ?? undefined,
      username: body.username ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      password: body.password ?? undefined,
      notes: body.notes ?? undefined,
    }

    const updated = await prisma.socialMedia.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    // Not found → 404
    if (error?.code === "P2025") {
      return NextResponse.json({ message: "Social media record not found" }, { status: 404 })
    }
    console.error(`Error updating social media ${id}:`, error)
    return NextResponse.json({ message: "Failed to update social media" }, { status: 500 })
  }
}
