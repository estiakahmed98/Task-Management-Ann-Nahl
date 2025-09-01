import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      include: {
        templates: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json(packages)
  } catch (error) {
    console.error("Error fetching packages:", error)
    return NextResponse.json({ message: "Failed to fetch packages" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }
    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
      },
    })
    return NextResponse.json(newPackage, { status: 201 })
  } catch (error) {
    console.error("Error creating package:", error)
    return NextResponse.json({ message: "Failed to create package" }, { status: 500 })
  }
}
