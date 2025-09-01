// lib/chatClient.ts

export async function createConversation(body: {
  type?: string;
  title?: string;
  memberIds?: string[];
  clientId?: string;
  teamId?: string;
  assignmentId?: string;
  taskId?: string;
}) {
  const res = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  body: {
    type?: string;
    content?: string;
    attachments?: any;
    replyToId?: string;
  }
) {
  const res = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function markRead(conversationId: string) {
  await fetch(`/api/chat/conversations/${conversationId}/read`, {
    method: "POST",
  });
}

export async function openDM(userId: string): Promise<{ id: string }> {
  const res = await fetch("/api/chat/dm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to open DM");
  return res.json();
}

export async function leaveConversation(id: string) {
  const res = await fetch(`/api/chat/conversations/${id}?scope=self`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to leave conversation");
  return res.json();
}

export async function deleteConversationForAll(id: string) {
  const res = await fetch(`/api/chat/conversations/${id}?scope=all`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
  return res.json();
}
