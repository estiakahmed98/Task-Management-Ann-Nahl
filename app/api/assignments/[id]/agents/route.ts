// import { type NextRequest, NextResponse } from "next/server"
// import { PrismaClient } from "@prisma/client"

// const prisma = new PrismaClient()

// export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const body = await request.json()
//     const { agentIds } = body

//     if (!Array.isArray(agentIds) || agentIds.length === 0) {
//       return NextResponse.json({ message: "Agent IDs are required" }, { status: 400 })
//     }

//     // Create tasks for the new agents
//     const taskPromises = agentIds.map((agentId: string) =>
//       prisma.task.create({
//         data: {
//           id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//           assignmentId: params.id,
//           assignedToId: agentId,
//           status: "pending",
//           createdAt: new Date(),
//         },
//         include: {
//           assignedTo: true,
//         },
//       }),
//     )

//     const newTasks = await Promise.all(taskPromises)

//     // Update assignment status to in-progress if it was pending
//     await prisma.assignment.update({
//       where: { id: params.id },
//       data: {
//         status: "in-progress",
//       },
//     })

//     return NextResponse.json(newTasks, { status: 201 })
//   } catch (error) {
//     console.error("Error adding agents to assignment:", error)
//     return NextResponse.json({ message: "Failed to add agents to assignment" }, { status: 500 })
//   }
// }

// export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const agentId = searchParams.get("agentId")

//     if (!agentId) {
//       return NextResponse.json({ message: "Agent ID is required" }, { status: 400 })
//     }

//     // Delete tasks for the specific agent
//     await prisma.task.deleteMany({
//       where: {
//         assignmentId: params.id,
//         assignedToId: agentId,
//       },
//     })

//     return NextResponse.json({ message: "Agent removed from assignment" })
//   } catch (error) {
//     console.error("Error removing agent from assignment:", error)
//     return NextResponse.json({ message: "Failed to remove agent from assignment" }, { status: 500 })
//   }
// }
