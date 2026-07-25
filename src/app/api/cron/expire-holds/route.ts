import { NextResponse } from "next/server";
import {
  expireStaleBankHolds,
  expireStaleQuotes,
} from "@/lib/booking/expireHolds";

function authorize(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) {
      return NextResponse.json(
        { error: "CRON_SECRET is required in production" },
        { status: 503 },
      );
    }
    // Local/dev: allow without secret so developers can hit the endpoint.
    return null;
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  try {
    const quotes = await expireStaleQuotes();
    const holds = await expireStaleBankHolds();
    return NextResponse.json({ ok: true, quotes, holds });
  } catch (error) {
    console.error("expire-holds cron failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
