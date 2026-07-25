import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "ts_admin";

function adminSecret() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

/** Signed opaque session: token.hmac — never stores the password in the cookie. */
export function createAdminSessionCookie(): string {
  const secret = adminSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD is not configured");
  const token = randomBytes(32).toString("hex");
  const sig = createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${sig}`;
}

export function verifyAdminSessionCookie(value: string | undefined): boolean {
  const secret = adminSecret();
  if (!secret || !value) return false;
  const [token, sig] = value.split(".");
  if (!token || !sig) return false;
  const expected = createHmac("sha256", secret).update(token).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdminAuthed() {
  const jar = await cookies();
  return verifyAdminSessionCookie(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthed())) {
    redirect("/admin?error=Unauthorized");
  }
}

export async function setAdminSessionCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, createAdminSessionCookie(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
