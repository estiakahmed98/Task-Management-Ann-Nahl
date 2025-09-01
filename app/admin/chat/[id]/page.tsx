"use client";

import ChatWindow from "@/components/chat/ChatWindow";
import { useParams } from "next/navigation";

export default function ChatByIdPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;

  if (!conversationId) {
    return (
      <div className="h-[calc(100vh-64px)] grid place-items-center text-gray-500">
        Invalid conversation.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)]">
      <ChatWindow conversationId={conversationId} />
    </div>
  );
}
