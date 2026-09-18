/**
 * Timezone and Reminder Matching Engine
 * 
 * ============================================================================
 * TIMEZONE CONSIDERATION FOR IRAN (UTC+3:30):
 * ============================================================================
 * Reminders are configured by users in Iranian local time.
 * In Iran, Daylight Saving Time (DST) was officially abolished starting in
 * year 1402 AP (2023 CE), maintaining a permanent UTC+3:30 offset.
 * 
 * Cloudflare Workers and server environments execute with UTC system clocks.
 * Therefore, day-of-week (0=Sunday ... 6=Saturday) and time-of-day ("HH:mm")
 * cannot be derived from UTC getters (such as `Date.prototype.getDay()` or
 * `Date.prototype.getHours()`).
 * 
 * Instead, this module leverages `Intl.DateTimeFormat` with the explicit
 * `timeZone: "Asia/Tehran"` IANA identifier to accurately resolve:
 * 1. The local day of week in Tehran.
 * 2. The local hour and minute in Tehran.
 * 3. The current calendar date in Tehran ("YYYY-MM-DD") for deduplication.
 * ============================================================================
 */

export const TEHRAN_TIMEZONE = "Asia/Tehran";
export const DEFAULT_TOLERANCE_MINUTES = 15;
export const MAX_RETRY_ATTEMPTS = 3;

export interface RecurrencePattern {
  /** Days of week: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday */
  daysOfWeek: number[];
  /** 24-hour time formatted as "HH:mm" (e.g. "09:00", "21:30") */
  time: string;
}

export interface TehranDateTime {
  year: number;
  month: number;
  day: number;
  /** 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday */
  dayOfWeek: number;
  hour: number;
  minute: number;
  /** Total elapsed minutes from midnight (0..1439) */
  totalMinutes: number;
  /** Local Tehran calendar date formatted as "YYYY-MM-DD" */
  dateString: string;
  /** Local Tehran time formatted as "HH:mm" */
  timeString: string;
}

export interface ReminderMatchingContext {
  now?: Date;
  /** Whether a successful send has already been logged for this reminder (for one-time reminders) */
  hasSentSuccessfully?: boolean;
  /** Whether a successful send has already occurred today in Tehran time (for recurring reminders) */
  hasSentToday?: boolean;
  /** Number of previous consecutive delivery failures */
  failureCount?: number;
  /** Tolerance window in minutes for recurring schedule matching (default: 15) */
  toleranceMinutes?: number;
}

/**
 * Parses any Date instance into its local components in the Asia/Tehran timezone.
 */
export function getTehranDateTime(date: Date = new Date()): TehranDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = weekdayMap[map.weekday] ?? 0;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateString = `${year}-${pad(month)}-${pad(day)}`;
  const timeString = `${pad(hour)}:${pad(minute)}`;
  const totalMinutes = hour * 60 + minute;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hour,
    minute,
    totalMinutes,
    dateString,
    timeString,
  };
}

/**
 * Safely parses and validates a recurrence pattern from a JSON string or object.
 */
export function parseRecurrencePattern(
  pattern: unknown
): RecurrencePattern | null {
  if (!pattern) {
    return null;
  }

  let obj = pattern;
  if (typeof pattern === "string") {
    try {
      obj = JSON.parse(pattern);
    } catch {
      return null;
    }
  }

  if (typeof obj !== "object" || obj === null) {
    return null;
  }

  const candidate = obj as Record<string, unknown>;
  if (!Array.isArray(candidate.daysOfWeek) || typeof candidate.time !== "string") {
    return null;
  }

  const daysOfWeek = candidate.daysOfWeek
    .map((d) => (typeof d === "number" ? d : parseInt(String(d), 10)))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);

  if (daysOfWeek.length === 0) {
    return null;
  }

  const timeMatch = candidate.time.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!timeMatch) {
    return null;
  }

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  const normalizedTime = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  return {
    daysOfWeek: Array.from(new Set(daysOfWeek)).sort((a, b) => a - b),
    time: normalizedTime,
  };
}

/**
 * Calculates the shortest distance in minutes between two minute-of-day values
 * on a circular 24-hour clock (1440 minutes).
 */
export function getCircularMinuteDifference(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

/**
 * Evaluates whether a one-time reminder is due for execution.
 * 
 * Rules:
 * 1. Must be active (`isActive !== false`).
 * 2. Must not have been successfully sent already (`!hasSentSuccessfully`).
 * 3. Must not have exceeded the maximum consecutive failure limit.
 * 4. `scheduledAt` must be set and `<= now`.
 */
export function isOnceReminderDue(
  scheduledAt: Date | number | string | null | undefined,
  isActive: boolean | number | undefined,
  context: ReminderMatchingContext = {}
): boolean {
  if (!isActive) {
    return false;
  }

  if (context.hasSentSuccessfully) {
    return false;
  }

  if ((context.failureCount ?? 0) >= MAX_RETRY_ATTEMPTS) {
    return false;
  }

  if (!scheduledAt) {
    return false;
  }

  const scheduledTime =
    scheduledAt instanceof Date ? scheduledAt.getTime() : new Date(scheduledAt).getTime();

  if (isNaN(scheduledTime)) {
    return false;
  }

  const nowTime = (context.now ?? new Date()).getTime();
  return scheduledTime <= nowTime;
}

/**
 * Evaluates whether a recurring reminder is due for execution.
 * 
 * Rules:
 * 1. Must be active (`isActive !== false`).
 * 2. Must not have already been successfully sent today in Tehran (`!hasSentToday`).
 * 3. Must not have exceeded the maximum consecutive failure limit today.
 * 4. Current day of week in Tehran must match one of the pattern's `daysOfWeek`.
 * 5. Current time in Tehran must be within `toleranceMinutes` of the scheduled time.
 */
export function isRecurringReminderDue(
  pattern: unknown,
  isActive: boolean | number | undefined,
  context: ReminderMatchingContext = {}
): boolean {
  if (!isActive) {
    return false;
  }

  if (context.hasSentToday) {
    return false;
  }

  if ((context.failureCount ?? 0) >= MAX_RETRY_ATTEMPTS) {
    return false;
  }

  const parsed = parseRecurrencePattern(pattern);
  if (!parsed) {
    return false;
  }

  const tehranNow = getTehranDateTime(context.now ?? new Date());

  // 1. Day of week match in Tehran timezone
  if (!parsed.daysOfWeek.includes(tehranNow.dayOfWeek)) {
    return false;
  }

  // 2. Time-of-day match within tolerance window
  const [targetH, targetM] = parsed.time.split(":").map((n) => parseInt(n, 10));
  const targetTotalMinutes = targetH * 60 + targetM;

  const tolerance = context.toleranceMinutes ?? DEFAULT_TOLERANCE_MINUTES;
  const minuteDiff = getCircularMinuteDifference(
    tehranNow.totalMinutes,
    targetTotalMinutes
  );

  return minuteDiff <= tolerance;
}

export interface ReminderCandidate {
  scheduleType: "once" | "recurring" | string;
  scheduledAt?: Date | number | string | null;
  recurrencePattern?: unknown;
  isActive?: boolean | number | null;
}

/**
 * Universal dispatcher to check if any reminder candidate is due.
 */
export function isReminderDue(
  reminder: ReminderCandidate,
  context: ReminderMatchingContext = {}
): boolean {
  const active = Boolean(reminder.isActive);

  if (reminder.scheduleType === "once") {
    return isOnceReminderDue(reminder.scheduledAt, active, context);
  }

  if (reminder.scheduleType === "recurring") {
    return isRecurringReminderDue(reminder.recurrencePattern, active, context);
  }

  return false;
}

/**
 * Calculates the next upcoming occurrence for a recurring reminder in Iran time (Asia/Tehran).
 */
export function getNextOccurrenceForRecurring(
  pattern: unknown,
  fromTime: Date = new Date()
): Date | null {
  const parsed = parseRecurrencePattern(pattern);
  if (!parsed) return null;

  const [targetH, targetM] = parsed.time.split(":").map((n) => parseInt(n, 10));
  const targetMinutes = targetH * 60 + targetM;

  const tehranNow = getTehranDateTime(fromTime);

  // Check today (d = 0) through next 7 days (d = 7)
  for (let d = 0; d <= 7; d++) {
    const dayOfWeek = (tehranNow.dayOfWeek + d) % 7;
    if (parsed.daysOfWeek.includes(dayOfWeek)) {
      if (d === 0 && targetMinutes <= tehranNow.totalMinutes) {
        continue;
      }
      // Calendar day offset in Tehran
      const candidateDateInTehran = new Date(
        fromTime.getTime() + d * 24 * 60 * 60 * 1000
      );
      const targetTehran = getTehranDateTime(candidateDateInTehran);

      const utcMs =
        Date.UTC(
          targetTehran.year,
          targetTehran.month - 1,
          targetTehran.day,
          targetH,
          targetM
        ) - (3 * 60 + 30) * 60 * 1000;

      const nextDate = new Date(utcMs);
      if (nextDate.getTime() > fromTime.getTime()) {
        return nextDate;
      }
    }
  }

  return null;
}

export interface UpcomingCandidate {
  id: string;
  goalId: string;
  goalTitle: string;
  scheduleType: "once" | "recurring" | string;
  scheduledAt?: Date | number | string | null;
  recurrencePattern?: unknown;
  isActive?: boolean | number | null;
}

export interface UpcomingReminderResult {
  reminderId: string;
  goalId: string;
  goalTitle: string;
  scheduleType: string;
  nextDate: Date;
}

/**
 * Finds the single earliest upcoming reminder across all active goals/reminders.
 */
export function getNextUpcomingReminder(
  remindersList: UpcomingCandidate[],
  now: Date = new Date()
): UpcomingReminderResult | null {
  let nearest: UpcomingReminderResult | null = null;

  for (const r of remindersList) {
    if (!r.isActive) continue;

    let nextDate: Date | null = null;
    if (r.scheduleType === "once" && r.scheduledAt) {
      const d =
        r.scheduledAt instanceof Date ? r.scheduledAt : new Date(r.scheduledAt);
      if (d.getTime() > now.getTime()) {
        nextDate = d;
      }
    } else if (r.scheduleType === "recurring" && r.recurrencePattern) {
      nextDate = getNextOccurrenceForRecurring(r.recurrencePattern, now);
    }

    if (nextDate) {
      if (!nearest || nextDate.getTime() < nearest.nextDate.getTime()) {
        nearest = {
          reminderId: r.id,
          goalId: r.goalId,
          goalTitle: r.goalTitle,
          scheduleType: r.scheduleType,
          nextDate,
        };
      }
    }
  }

  return nearest;
}

