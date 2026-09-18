import { NextResponse } from "next/server";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, reminders, sentLog } from "@/db/schema";
import { getNextUpcomingReminder } from "@/lib/reminder-matching";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total goals
    const [goalsResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(goals);
    const totalActiveGoals = goalsResult?.count ?? 0;

    // 2. Total active reminders
    const [remindersResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(reminders)
      .where(eq(reminders.isActive, true));
    const totalActiveReminders = remindersResult?.count ?? 0;

    // 3. Reminders sent in last 7 days
    const [sentResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(sentLog)
      .where(
        and(
          inArray(sentLog.status, ["sent", "delivered"]),
          gte(sentLog.sentAt, sevenDaysAgo)
        )
      );
    const sentLast7Days = sentResult?.count ?? 0;

    // 4. Next upcoming reminder across all active reminders
    const activeRemindersList = await db
      .select({
        id: reminders.id,
        goalId: reminders.goalId,
        goalTitle: goals.title,
        scheduleType: reminders.scheduleType,
        scheduledAt: reminders.scheduledAt,
        recurrencePattern: reminders.recurrencePattern,
        isActive: reminders.isActive,
      })
      .from(reminders)
      .innerJoin(goals, eq(reminders.goalId, goals.id))
      .where(eq(reminders.isActive, true));

    const nextUpcoming = getNextUpcomingReminder(activeRemindersList, now);

    return NextResponse.json({
      success: true,
      stats: {
        totalActiveGoals,
        totalActiveReminders,
        sentLast7Days,
        nextUpcoming: nextUpcoming
          ? {
              reminderId: nextUpcoming.reminderId,
              goalId: nextUpcoming.goalId,
              goalTitle: nextUpcoming.goalTitle,
              scheduleType: nextUpcoming.scheduleType,
              nextDate: nextUpcoming.nextDate.toISOString(),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
