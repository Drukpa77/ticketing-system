import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ts_session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function isRealSession(value: string | undefined | null) {
  return Boolean(value && value.trim() && value.trim() !== "anonymous");
}

/** Always returns a real session id — never the shared "anonymous" string. */
export async function getSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value?.trim();
  if (isRealSession(existing)) return existing!;

  const id = randomUUID();
  try {
    jar.set(SESSION_COOKIE, id, cookieOptions);
  } catch {
    // cookies().set can throw outside a Server Action / Route Handler;
    // middleware normally sets the cookie on the response instead.
  }
  return id;
}

/** Call at the start of checkout mutations to force a durable session cookie. */
export async function requireSessionId(): Promise<string> {
  return getSessionId();
}
