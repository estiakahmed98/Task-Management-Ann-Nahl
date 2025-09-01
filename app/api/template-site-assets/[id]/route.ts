import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.templateSiteAsset.delete({
      where: { id: Number.parseInt(id) }, // id is an Int in Prisma schema
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Error deleting template site asset ${id}:`, error)
    return NextResponse.json({ message: "Failed to delete template site asset" }, { status: 500 })
  }
}
