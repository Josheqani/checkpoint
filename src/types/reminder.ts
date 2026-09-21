/**
 * Recurrence Pattern Format Specification:
 * 
 * Serialized JSON string stored in `reminders.recurrence_pattern`:
 * {
 *   "daysOfWeek": number[], // Array of integers 0-6 (0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday)
 *   "time": string          // 24-hour time format "HH:mm", e.g. "09:00", "14:30"
 * }
 * 
 * Step 7 (cron notification runner) parses this JSON to determine if the reminder should trigger
 * at the current minute/day of week.
 */
export interface RecurrencePattern {
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  time: string; // "HH:mm" (24-hour format)
}

export type ScheduleType = "once" | "recurring";
export type ReminderChannel = "sms" | "telegram";

export interface ReminderItem {
  id: string;
  goalId: string;
  channel?: ReminderChannel;
  phoneNumber: string;
  telegramChatId?: string | null;
  scheduleType: ScheduleType;
  scheduledAt: string | number | null;
  recurrencePattern: string | null;
  isActive: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}
