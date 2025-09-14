// app/api/tasks/[id]/social-communications/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SCType = "like" | "comment" | "follow" | "share";
type IncomingEntry = {
  type: SCType;
  url: string;
  notes?: string;
  submittedAt?: string; // optional; will fill server-side if missing
};

function isValidUrl(u: string) {
  try {
    const x = new URL(u);
    return /^https?:$/.test(x.protocol);
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params?.id;
    if (!taskId) {
      return NextResponse.json({ message: "Missing task id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const entries: IncomingEntry[] = Array.isArray(body?.entries)
      ? body!.entries
      : [];

    if (!entries.length) {
      return NextResponse.json({ message: "No entries" }, { status: 400 });
    }

    // Validate + normalize
    const now = new Date().toISOString();
    const normalized = entries
      .map((e) => ({
        type: String(e?.type || "").toLowerCase() as SCType,
        url: String(e?.url || "").trim(),
        notes: typeof e?.notes === "string" ? e.notes.trim() : "",
        submittedAt: e?.submittedAt || now,
      }))
      .filter(
        (e) =>
          (["like", "comment", "follow", "share"] as const).includes(e.type) &&
          !!e.url &&
          isValidUrl(e.url)
      );

    if (!normalized.length) {
      return NextResponse.json(
        { message: "No valid entries (type/url invalid)" },
        { status: 400 }
      );
    }

    // Load existing JSON array (handle null gracefully)
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      select: { socialCommunications: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const current =
      Array.isArray(existing.socialCommunications) &&
      // Prisma’s JsonValue can be typed as any[], so guard:
      (existing.socialCommunications as any[]).every(
        (x) => typeof x === "object"
      )
        ? (existing.socialCommunications as any[])
        : [];

    // Append and save
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { socialCommunications: [...current, ...normalized] },
      select: { id: true, socialCommunications: true },
    });

    return NextResponse.json(
      {
        message: "Saved",
        taskId,
        countAdded: normalized.length,
        socialCommunications: updated.socialCommunications,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[SC] POST error", err);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
