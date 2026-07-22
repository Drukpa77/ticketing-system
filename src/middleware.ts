import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ts_session";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
