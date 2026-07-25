import { createHash, timingSafeEqual } from "crypto";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSessionId } from "@/lib/session";

function safeEqual(a: string, b: string) {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

/** Allow access with ?t=accessToken, owning checkout session, or admin session. */
export async function canAccessBooking(opts: {
  accessToken: string;
  quoteSessionId?: string | null;
  providedToken?: string | null;
}): Promise<boolean> {
  if (await isAdminAuthed()) return true;

  const token = (opts.providedToken ?? "").trim();
  if (token && safeEqual(token, opts.accessToken)) return true;

  const sessionId = await getSessionId();
  if (
    opts.quoteSessionId &&
    sessionId !== "anonymous" &&
    safeEqual(sessionId, opts.quoteSessionId)
  ) {
    return true;
  }
  return false;
}

export function withAccessToken(path: string, accessToken: string) {
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}t=${encodeURIComponent(accessToken)}`;
}
