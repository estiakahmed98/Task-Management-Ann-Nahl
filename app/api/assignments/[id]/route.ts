import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function extractIdFromUrl(url: URL): string | null {
  const segments = url.pathname.split("/")
  return segments.pop() || null
}

export async function GET(request: NextRequest) {
  try {
    const id = extractIdFromUrl(request.nextUrl)

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        client: true,
        template: {
          include: {
            sitesAssets: true,
            templateTeamMembers: {
              include: {
                agent: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error("Error fetching assignment:", error)
    return NextResponse.json({ error: "Failed to fetch assignment", message: error.message }, { status: 500 })
  }
}

// ✅ DELETE /api/assignments/[id]
export async function DELETE(request: NextRequest) {
  try {
    const id = extractIdFromUrl(request.nextUrl)

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 })
    }

    // First, delete related tasks (if cascade not setup in schema)
    await prisma.task.deleteMany({
      where: {
        assignmentId: id,
      },
    })

    // Then delete the assignment
    await prisma.assignment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Assignment deleted" })
  } catch (error) {
    console.error("Error deleting assignment:", error)
    return NextResponse.json({ error: "Failed to delete assignment", message: error.message }, { status: 500 })
  }
}