// app/api/auth/[...all]/route.ts
import { handlers } from "@/lib/auth";

// ⚠️ ফাইল/পাথ 100% আগের মতোই থাকছে (/api/auth/*),
// ভিতরে শুধু NextAuth এর handlers attach করা হলো।
export const { GET, POST } = handlers;
