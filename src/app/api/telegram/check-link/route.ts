import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { telegramConnections } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(telegramConnections)
      .where(eq(telegramConnections.token, token))
      .limit(1);

    if (!row) {
      return NextResponse.json({ connected: false, notFound: true });
    }

    const isExpired = new Date(row.expiresAt).getTime() <= Date.now();
    if (isExpired && row.status === "pending") {
      return NextResponse.json({ connected: false, expired: true });
    }

    if (row.status === "connected" && row.chatId) {
      return NextResponse.json({
        connected: true,
        chatId: row.chatId,
        username: row.username || null,
        firstName: row.firstName || null,
      });
    }

    return NextResponse.json({ connected: false });
  } catch (err: any) {
    console.error("GET /api/telegram/check-link error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to check connection status" },
      { status: 500 }
    );
  }
}
