import { z } from "zod";

/**
 * Iranian mobile phone format:
 * Must start with 09XXXXXXXXX (11 digits) or +989XXXXXXXXX (13 chars).
 */
export const iranianPhoneRegex = /^(?:\+989\d{9}|09\d{9})$/;

export const phoneNumberSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .refine((val) => iranianPhoneRegex.test(val), {
    message:
      "Invalid phone number. Must be Iranian mobile (e.g. 09123456789 or +989123456789)",
  });

/**
 * Recurrence Pattern Specification:
 * - daysOfWeek: Array of integers 0 to 6 (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * - time: String in 24-hour "HH:mm" format (e.g. "09:00", "21:30")
 */
export const recurrencePatternObjectSchema = z.object({
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, "At least one day of week must be selected")
    .transform((arr) => Array.from(new Set(arr)).sort((a, b) => a - b)),
  time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Time must be in 24-hour HH:mm format (e.g. 09:00)"
    ),
});

export const recurrencePatternSchema = z.union([
  recurrencePatternObjectSchema,
  z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const res = recurrencePatternObjectSchema.safeParse(parsed);
      if (!res.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid recurrence pattern structure",
        });
        return z.NEVER;
      }
      return res.data;
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid JSON in recurrence pattern",
      });
      return z.NEVER;
    }
  }),
]);

export const createReminderSchema = z
  .object({
    channel: z.enum(["sms", "telegram"]).optional().default("sms"),
    phoneNumber: z.string().optional().default(""),
    telegramChatId: z.string().optional().nullable(),
    scheduleType: z.enum(["once", "recurring"]),
    scheduledAt: z
      .union([
        z.string().refine((val) => val === "" || !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }),
        z.number(),
        z.date(),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .transform((val) => (val && val !== "" ? new Date(val) : null)),
    recurrencePattern: recurrencePatternSchema.optional().nullable(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "sms") {
      const cleanPhone = (data.phoneNumber || "").replace(/[\s-]/g, "");
      if (!cleanPhone || !iranianPhoneRegex.test(cleanPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Invalid phone number. Must be Iranian mobile (e.g. 09123456789 or +989123456789)",
          path: ["phoneNumber"],
        });
      }
    } else if (data.channel === "telegram") {
      if (!data.telegramChatId || data.telegramChatId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telegram Chat ID is required",
          path: ["telegramChatId"],
        });
      }
    }

    if (data.scheduleType === "once") {
      if (!data.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduledAt is required for one-time reminders",
          path: ["scheduledAt"],
        });
      } else if (data.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduledAt must be in the future",
          path: ["scheduledAt"],
        });
      }
    } else if (data.scheduleType === "recurring") {
      if (!data.recurrencePattern) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "recurrencePattern is required for recurring reminders",
          path: ["recurrencePattern"],
        });
      }
    }
  });

export const updateReminderSchema = z
  .object({
    channel: z.enum(["sms", "telegram"]).optional(),
    phoneNumber: z.string().optional(),
    telegramChatId: z.string().optional().nullable(),
    scheduleType: z.enum(["once", "recurring"]).optional(),
    scheduledAt: z
      .union([
        z.string().refine((val) => val === "" || !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }),
        z.number(),
        z.date(),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .transform((val) => (val && val !== "" ? new Date(val) : null)),
    recurrencePattern: recurrencePatternSchema.optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "sms" && data.phoneNumber !== undefined) {
      const cleanPhone = data.phoneNumber.replace(/[\s-]/g, "");
      if (!cleanPhone || !iranianPhoneRegex.test(cleanPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid phone number",
          path: ["phoneNumber"],
        });
      }
    } else if (data.channel === "telegram" && data.telegramChatId !== undefined) {
      if (!data.telegramChatId || data.telegramChatId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telegram Chat ID is required",
          path: ["telegramChatId"],
        });
      }
    }

    if (data.scheduleType === "once") {
      if (data.scheduledAt && data.scheduledAt.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduledAt must be in the future",
          path: ["scheduledAt"],
        });
      }
    }
  });

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

