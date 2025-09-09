import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TaskStatus } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the session from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;
    
    if (!sessionToken) {
      return new NextResponse('Unauthorized - No session token', { status: 401 });
    }
    
    // Get the user from the session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });
    
    const userId = session?.user?.id;
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const taskId = params.id;
    
    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    const { reason, timestamp } = await request.json();
    
    if (!reason) {
      return new NextResponse('Pause reason is required', { status: 400 });
    }

    // Get the current task to check if it exists and get current pause reasons
    // Using raw query to bypass TypeScript type checking for now
    const taskResult = await prisma.$queryRaw`
      SELECT "pauseReasons" FROM "Task" WHERE id = ${taskId} LIMIT 1
    `;
    const task = Array.isArray(taskResult) ? taskResult[0] : taskResult;

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Handle existing pause reasons (could be string, array, or null/undefined)
    let currentPauseReasons = [];
    try {
      if (task.pauseReasons) {
        currentPauseReasons = typeof task.pauseReasons === 'string' 
          ? JSON.parse(task.pauseReasons) 
          : Array.isArray(task.pauseReasons) 
            ? task.pauseReasons 
            : [];
      }
    
    } catch (error) {
      console.error('Error parsing pauseReasons:', error);
      currentPauseReasons = [];
    }

    // Add the new pause reason
    const newPauseReason = {
      reason,
      timestamp: timestamp || new Date().toISOString(),
      durationInSeconds: 0, // Will be updated when the task is resumed
      pausedBy: userId
    };

    // Update the task with the new pause reason and set status to paused
    // Using raw query to bypass TypeScript type checking for now
    const updatedTask = await prisma.$executeRaw`
      UPDATE "Task"
      SET 
        status = 'paused'::"TaskStatus",
        "pauseReasons" = ${JSON.stringify([...currentPauseReasons, newPauseReason])}::jsonb,
        "updatedAt" = NOW()
      WHERE id = ${taskId}
      RETURNING *
    `;

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error pausing task:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
