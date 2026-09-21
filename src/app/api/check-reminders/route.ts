import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/db";
import { goals, reminders, sentLog } from "@/db/schema";
import { verifyCronRequest } from "@/lib/cron-auth";
import {
  DEFAULT_TOLERANCE_MINUTES,
  getTehranDateTime,
  isReminderDue,
} from "@/lib/reminder-matching";
import { sendSms } from "@/lib/sms";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Verify Authorization header against CRON_SECRET
  if (!verifyCronRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing bearer token" },
      { status: 401 }
    );
  }

  let env: Partial<CloudflareEnv> | undefined;
  try {
    const ctx = getCloudflareContext();
    env = ctx.env;
  } catch {
    // Non-Cloudflare fallback for local testing
  }

  try {
    const db = getDb(env?.DB);
    const now = new Date();
    const tehranNow = getTehranDateTime(now);
    const todayDateString = tehranNow.dateString;

    // 2. Query active reminders from D1, joined with their goal to get the goal title
    const activeReminders = await db
      .select({
        id: reminders.id,
        goalId: reminders.goalId,
        goalTitle: goals.title,
        channel: reminders.channel,
        phoneNumber: reminders.phoneNumber,
        telegramChatId: reminders.telegramChatId,
        scheduleType: reminders.scheduleType,
        scheduledAt: reminders.scheduledAt,
        recurrencePattern: reminders.recurrencePattern,
        isActive: reminders.isActive,
      })
      .from(reminders)
      .innerJoin(goals, eq(reminders.goalId, goals.id))
      .where(eq(reminders.isActive, true));

    if (activeReminders.length === 0) {
      return NextResponse.json({
        checked: 0,
        sent: 0,
        failed: 0,
      });
    }

    // 3. Query sent_log for these active reminders to avoid duplicate sends
    const activeReminderIds = activeReminders.map((r) => r.id);
    const logs = await db
      .select({
        reminderId: sentLog.reminderId,
        status: sentLog.status,
        sentAt: sentLog.sentAt,
      })
      .from(sentLog)
      .where(inArray(sentLog.reminderId, activeReminderIds));

    type LogEntry = (typeof logs)[number];
    const logsByReminder = new Map<string, LogEntry[]>();
    for (const log of logs) {
      const list = logsByReminder.get(log.reminderId) || [];
      list.push(log);
      logsByReminder.set(log.reminderId, list);
    }

    // 4. Filter down to due reminders using timezone-aware matching logic
    const dueReminders: typeof activeReminders = [];
    for (const reminder of activeReminders) {
      const reminderLogs = logsByReminder.get(reminder.id) || [];

      // A reminder has succeeded previously if any log has status 'sent' or 'delivered'
      const hasSentSuccessfully = reminderLogs.some(
        (l) => l.status === "sent" || l.status === "delivered"
      );

      // A recurring reminder has already been sent today if a successful log exists for today's Tehran date
      const hasSentToday = reminderLogs.some(
        (l) =>
          (l.status === "sent" || l.status === "delivered") &&
          getTehranDateTime(l.sentAt).dateString === todayDateString
      );

      // Consecutive failure count (total for once, today for recurring)
      const failureCount =
        reminder.scheduleType === "recurring"
          ? reminderLogs.filter(
              (l) =>
                l.status === "failed" &&
                getTehranDateTime(l.sentAt).dateString === todayDateString
            ).length
          : reminderLogs.filter((l) => l.status === "failed").length;

      const due = isReminderDue(reminder, {
        now,
        hasSentSuccessfully,
        hasSentToday,
        failureCount,
        toleranceMinutes: DEFAULT_TOLERANCE_MINUTES,
      });

      if (due) {
        dueReminders.push(reminder);
      }
    }

    let sentCount = 0;
    let failedCount = 0;

    // 5. Dispatch SMS or Telegram for each due reminder and record sent_log
    for (const reminder of dueReminders) {
      try {
        const isTelegram = reminder.channel === "telegram";
        let sendSuccess = false;
        let sendError: string | null = null;
        const targetIdentifier = isTelegram
          ? (reminder.telegramChatId || "unknown")
          : reminder.phoneNumber;

        if (isTelegram) {
          const message = `🎯 <b>یادآوری چک‌پوینت</b>\n\n📌 <b>هدف:</b> ${reminder.goalTitle}\n\nزمان آن رسیده است که این گام را بررسی و ثبت کنید.`;
          const tgResult = await sendTelegramMessage(env, reminder.telegramChatId!, message);
          sendSuccess = tgResult.success;
          sendError = tgResult.error || null;
        } else {
          const message = `یادآوری چک‌پوینت: ${reminder.goalTitle}`;
          const smsResult = await sendSms(env, reminder.phoneNumber, message);
          sendSuccess = smsResult.success;
          sendError = smsResult.error || null;
        }

        const status = sendSuccess ? "sent" : "failed";
        const errorCode = sendSuccess ? null : sendError || "UNKNOWN_ERROR";

        await db.insert(sentLog).values({
          id: crypto.randomUUID(),
          reminderId: reminder.id,
          channel: reminder.channel || "sms",
          phoneNumber: targetIdentifier,
          status,
          errorCode,
          sentAt: new Date(),
        });

        if (sendSuccess) {
          sentCount++;
        } else {
          failedCount++;
          console.error(
            `Failed to dispatch reminder ${reminder.id} (${reminder.channel}) to ${targetIdentifier}:`,
            sendError
          );
        }
      } catch (err) {
        // Wrap each reminder send in try/catch so one failure doesn't halt the whole batch
        failedCount++;
        console.error(`Unexpected exception processing reminder ${reminder.id}:`, err);
        try {
          await db.insert(sentLog).values({
            id: crypto.randomUUID(),
            reminderId: reminder.id,
            phoneNumber: reminder.phoneNumber,
            status: "failed",
            errorCode: err instanceof Error ? err.message : "UNEXPECTED_EXCEPTION",
            sentAt: new Date(),
          });
        } catch (logErr) {
          console.error(`Failed to log error to sent_log for reminder ${reminder.id}:`, logErr);
        }
      }
    }

    // 6. Return JSON summary
    return NextResponse.json({
      checked: activeReminders.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error) {
    console.error("Error in /api/check-reminders handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error while checking reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
