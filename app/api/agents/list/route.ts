import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// replace with your real agent role ID
const AGENT_ROLE_ID = "cmdfrtlm00001spw8i3n0bqer";

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: {
        roleId: AGENT_ROLE_ID,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(agents, { status: 200 });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { message: "Failed to fetch agents", error: error.message },
      { status: 500 }
    );
  }
}
