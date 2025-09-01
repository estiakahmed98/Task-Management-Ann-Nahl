import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/getAuthUser";
import { pusherServer } from "@/lib/pusher/server";

export const dynamic = "force-dynamic";

// pusher-js ফর্ম-এনকোডেড ডেটা পাঠায়; তাই text() ব্যবহার করছি
export async function POST(req: Request) {
  const me = await getAuthUser();
  if (!me)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const socketId = params.get("socket_id") || "";
  const channelName = params.get("channel_name") || "";

  const m = channelName.match(/^presence-conversation-(.+)$/);
  const conversationId = m?.[1];

  if (!socketId || !channelName || !conversationId) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }

  // কনভারসেশনের মেম্বার কিনা যাচাই
  const isMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: me.id } },
    select: { userId: true },
  });
  if (!isMember)
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  // ✅ lastSeen আপডেট
  await prisma.user.update({
    where: { id: me.id },
    data: { lastSeenAt: new Date() },
  });

  // presence data
  const presenceData = {
    user_id: me.id,
    user_info: { name: me.name, image: me.image },
  };

  const auth = pusherServer.authenticate(socketId, channelName, presenceData);
  return new NextResponse(JSON.stringify(auth), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
