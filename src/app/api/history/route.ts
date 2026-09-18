import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, reminders, sentLog } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Total count of sent_log records
    const [countRes] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(sentLog);
    const totalCount = countRes?.count ?? 0;

    // Fetch records with left join to retain history even if parent was pruned
    const rows = await db
      .select({
        id: sentLog.id,
        reminderId: sentLog.reminderId,
        phoneNumber: sentLog.phoneNumber,
        status: sentLog.status,
        errorCode: sentLog.errorCode,
        sentAt: sentLog.sentAt,
        goalId: goals.id,
        goalTitle: goals.title,
        scheduleType: reminders.scheduleType,
      })
      .from(sentLog)
      .leftJoin(reminders, eq(sentLog.reminderId, reminders.id))
      .leftJoin(goals, eq(reminders.goalId, goals.id))
      .orderBy(desc(sentLog.sentAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + rows.length < totalCount;

    return NextResponse.json({
      success: true,
      history: rows,
      totalCount,
      hasMore,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET /api/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS history" },
      { status: 500 }
    );
  }
}
