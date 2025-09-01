// lib/logActivity.ts
import prisma from "@/lib/prisma";

type LogParams = {
  entityType: string; // "User", "Package", "Client"
  entityId: string; // user.id / client.id / package.id
  userId?: string; // যিনি action করলেন (admin/agent)
  action: string; // "create", "update", "delete"
  details?: any; // extra তথ্য (JSON আকারে)
};

export async function logActivity({
  entityType,
  entityId,
  userId,
  action,
  details,
}: LogParams) {
  return prisma.activityLog.create({
    data: {
      id: crypto.randomUUID(), // unique id
      entityType,
      entityId,
      userId,
      action,
      details,
    },
  });
}
