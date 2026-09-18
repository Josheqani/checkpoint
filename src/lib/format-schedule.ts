import type { ReminderItem, RecurrencePattern } from "@/types/reminder";

export function formatScheduleSummary(
  reminder: Pick<ReminderItem, "scheduleType" | "scheduledAt" | "recurrencePattern">,
  locale: string,
  t: (key: string, values?: Record<string, any>) => string
): string {
  if (reminder.scheduleType === "once") {
    if (!reminder.scheduledAt) return "";
    try {
      const d = new Date(reminder.scheduledAt);
      if (isNaN(d.getTime())) return "";

      const dateStr = new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(d);

      const timeStr = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);

      return t("reminders.schedule.once", { date: dateStr, time: timeStr });
    } catch {
      return "";
    }
  }

  if (reminder.scheduleType === "recurring") {
    if (!reminder.recurrencePattern) return "";
    try {
      const pattern: RecurrencePattern =
        typeof reminder.recurrencePattern === "string"
          ? JSON.parse(reminder.recurrencePattern)
          : reminder.recurrencePattern;

      if (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0) return "";

      if (pattern.daysOfWeek.length === 7) {
        return t("reminders.schedule.everyday", { time: pattern.time });
      }

      const separator = locale === "fa" ? "، " : ", ";
      const daysStr = pattern.daysOfWeek
        .map((day) => t(`reminders.days.short.${day}`))
        .join(separator);

      return t("reminders.schedule.every", {
        days: daysStr,
        time: pattern.time,
      });
    } catch {
      return "";
    }
  }

  return "";
}
