import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing bearer token" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true, message: "Authorized" });
}
