import { cookies } from "next/headers";

export const SESSION_COOKIE = "ts_session";

export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;
  // Middleware should normally set this; fallback for edge cases
  return "anonymous";
}
