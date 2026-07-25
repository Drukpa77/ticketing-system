import { NextResponse } from "next/server";
import { expireStaleBankHolds } from "@/lib/booking/expireHolds";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await expireStaleBankHolds();
    return NextResponse.json({ ok: true, ...result });
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
