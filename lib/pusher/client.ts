import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    // private/presence channel auth endpoint
    authEndpoint: "/api/chat/channels/auth",
    // কুকি দিয়ে auth করছেন — অতিরিক্ত হেডার লাগবে না
  }
);
