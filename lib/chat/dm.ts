import prisma from "@/lib/prisma";

export async function getOrCreateDm(aId: string, bId: string) {
  // find existing DM with exactly these two members
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "dm",
      participants: {
        every: { userId: { in: [aId, bId] } },
        // ensure exactly 2 participants:
      },
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) return existing;

  // create a new DM
  const conv = await prisma.conversation.create({
    data: {
      type: "dm",
      participants: {
        create: [{ userId: aId }, { userId: bId }],
      },
    },
  });
  return conv;
}
