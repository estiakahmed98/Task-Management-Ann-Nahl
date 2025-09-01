//api/task-categories/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const created = await prisma.taskCategory.createMany({
        data: body.map((cat) => ({
          name: cat.name,
          description: cat.description,
        })),
        skipDuplicates: true,
      });

      return NextResponse.json(
        { message: `${created.count} categories created successfully` },
        { status: 201 }
      );
    }

    const category = await prisma.taskCategory.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create task category" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await prisma.taskCategory.findMany({
      include: { tasks: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Failed to fetch task categories" }, { status: 500 });
  }
}
