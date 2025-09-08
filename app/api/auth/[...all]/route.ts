//app/api/auth/[...all]/route.ts

import authDefault, { auth as namedAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const auth = (namedAuth ?? authDefault)!;
export const { GET, POST } = toNextJsHandler(auth.handler);
