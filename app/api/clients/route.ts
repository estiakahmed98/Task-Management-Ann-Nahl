// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function asPositiveInt(v: string | null, def: number, cap: number) {
  const n = Number(v ?? "");
  if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), cap);
  return def;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const status = searchParams.get("status") || undefined; // e.g. active|inactive|all
    const limit = asPositiveInt(searchParams.get("limit"), 50, 200);

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        company: true,
        avatar: true,
        status: true,
        package: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ clients, meta: { limit, q, status: status ?? null } });
  } catch (err: any) {
    console.error("GET /api/clients error:", err);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
// POST /api/clients - Create new client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      birthdate,
      gender,
      company,
      designation,
      location,

      // ⬇️ NEW fields
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
      progress,
      status,
      packageId,
      startDate,
      dueDate,
      socialLinks = [],

      // ⬇️ NEW field
      amId,
      // ⬇️ Arbitrary JSON key/value pairs
      otherField,
    } = body;

    // (Optional but recommended) enforce AM role server-side
    if (amId) {
      const am = await prisma.user.findUnique({
        where: { id: amId },
        include: { role: true },
      });
      if (!am || am.role?.name !== "am") {
        return NextResponse.json({ error: "amId is not an Account Manager" }, { status: 400 });
      }
    }

    const normalizePlatform = (input: unknown): string => {
      const raw = String(input ?? "").trim();
      return raw || "OTHER";
    };

    const client = await prisma.client.create({
      data: {
        name,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        gender,
        company,
        designation,
        location,

        // ⬇️ NEW fields saved
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
        avatar,             // still a String? in the schema
        progress,
        status,
        packageId,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,

        // ⬇️ NEW: link AM
        amId: amId || undefined,

        // ⬇️ Persist arbitrary JSON if provided
        otherField: otherField ?? undefined,

        socialMedias: {
          create: Array.isArray(socialLinks)
            ? socialLinks
                .filter((l: any) => l && l.platform && l.url)
                .map((l: any) => ({
                  platform: normalizePlatform(l.platform) as any,
                  url: l.url as string,
                  username: l.username ?? null,
                  email: l.email ?? null,
                  phone: l.phone ?? null,
                  password: l.password ?? null,
                  notes: l.notes ?? null,
                }))
            : [],
        },
      } as any,
      include: {
        socialMedias: true,
        accountManager: { select: { id: true, name: true, email: true } }, // optional
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
