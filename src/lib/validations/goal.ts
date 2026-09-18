import { z } from "zod";

export const goalInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  targetDate: z
    .union([
      z
        .string()
        .refine((val) => val === "" || !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .transform((val) => (val && val !== "" ? new Date(val) : null)),
      z.number().transform((val) => new Date(val)),
      z.date(),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .transform((val) => (val instanceof Date ? val : null)),
});

export const updateGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title is too long")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  targetDate: z
    .union([
      z
        .string()
        .refine((val) => val === "" || !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        })
        .transform((val) => (val && val !== "" ? new Date(val) : null)),
      z.number().transform((val) => new Date(val)),
      z.date(),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .transform((val) => (val instanceof Date ? val : null)),
});

export type GoalInput = z.infer<typeof goalInputSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
