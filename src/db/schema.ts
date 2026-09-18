import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const goals = sqliteTable("goals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  cadence: text("cadence").notNull(), // "daily" | "weekly" | "custom"
  reminderTime: text("reminder_time").notNull(), // e.g. "09:00"
  timezone: text("timezone").notNull().default("UTC"),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull().default("active"), // "active" | "paused" | "completed"
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const reminders = sqliteTable(
  "reminders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    sentAt: integer("sent_at", { mode: "timestamp" }),
    status: text("status").notNull().default("pending"), // "pending" | "sent" | "failed"
    retryCount: integer("retry_count").notNull().default(0),
    errorMessage: text("error_message"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("reminders_goal_id_idx").on(table.goalId),
    index("reminders_scheduled_at_idx").on(table.scheduledAt),
  ]
);

export const sentLog = sqliteTable(
  "sent_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reminderId: text("reminder_id")
      .notNull()
      .references(() => reminders.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    status: text("status").notNull(), // "delivered" | "failed"
    errorCode: text("error_code"),
    sentAt: integer("sent_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("sent_log_reminder_id_idx").on(table.reminderId)]
);

export const goalsRelations = relations(goals, ({ many }) => ({
  reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({ one, many }) => ({
  goal: one(goals, {
    fields: [reminders.goalId],
    references: [goals.id],
  }),
  sentLogs: many(sentLog),
}));

export const sentLogRelations = relations(sentLog, ({ one }) => ({
  reminder: one(reminders, {
    fields: [sentLog.reminderId],
    references: [reminders.id],
  }),
}));

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type SentLog = typeof sentLog.$inferSelect;
export type NewSentLog = typeof sentLog.$inferInsert;
