"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Calendar, Repeat, Smartphone, Send, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useSettings } from "@/lib/settings-context";
import type { ReminderItem, RecurrencePattern } from "@/types/reminder";

const reminderFormSchema = z
  .object({
    channel: z.enum(["sms", "telegram"]),
    scheduleType: z.enum(["once", "recurring"]),
    scheduledAt: z.string().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    time: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleType === "once") {
      if (!data.scheduledAt || data.scheduledAt.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "dateRequired",
          path: ["scheduledAt"],
        });
      } else {
        const d = new Date(data.scheduledAt);
        if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "dateFuture",
            path: ["scheduledAt"],
          });
        }
      }
    } else if (data.scheduleType === "recurring") {
      if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "daysRequired",
          path: ["daysOfWeek"],
        });
      }
      if (!data.time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "timeRequired",
          path: ["time"],
        });
      }
    }
  });

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface ReminderFormProps {
  goalId: string;
  reminder?: ReminderItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDateTimeLocalString(dateVal: string | number | null | undefined): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function ReminderForm({
  goalId,
  reminder,
  onSuccess,
  onCancel,
}: ReminderFormProps) {
  const t = useTranslations("reminders");
  const locale = useLocale();
  const isRtl = locale === "fa";
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(reminder && reminder.id);
  const {
    defaultPhoneNumber,
    defaultTelegramChatId,
    defaultTelegramUsername,
  } = useSettings();

  const activePhone = reminder?.phoneNumber || defaultPhoneNumber;
  const activeTelegramChatId = reminder?.telegramChatId || defaultTelegramChatId;
  const activeTelegramUsername = defaultTelegramUsername;

  // Parse recurrence pattern if editing
  const initialPattern: RecurrencePattern | null = (() => {
    if (!reminder?.recurrencePattern) return null;
    try {
      return typeof reminder.recurrencePattern === "string"
        ? JSON.parse(reminder.recurrencePattern)
        : reminder.recurrencePattern;
    } catch {
      return null;
    }
  })();

  const initialChannel =
    reminder?.channel ??
    (defaultTelegramChatId && !defaultPhoneNumber ? "telegram" : "sms");

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      channel: initialChannel,
      scheduleType: reminder?.scheduleType ?? "once",
      scheduledAt: toDateTimeLocalString(reminder?.scheduledAt),
      daysOfWeek: initialPattern?.daysOfWeek ?? [1, 2, 3, 4, 5],
      time: initialPattern?.time ?? "09:00",
    },
  });

  const channel = form.watch("channel");
  const scheduleType = form.watch("scheduleType");

  useEffect(() => {
    form.reset({
      channel:
        reminder?.channel ??
        (defaultTelegramChatId && !defaultPhoneNumber ? "telegram" : "sms"),
      scheduleType: reminder?.scheduleType ?? "once",
      scheduledAt: toDateTimeLocalString(reminder?.scheduledAt),
      daysOfWeek: initialPattern?.daysOfWeek ?? [1, 2, 3, 4, 5],
      time: initialPattern?.time ?? "09:00",
    });
  }, [reminder, form, initialPattern, isEditing, defaultPhoneNumber, defaultTelegramChatId]);

  const onSubmit = async (values: ReminderFormValues) => {
    if (values.channel === "sms" && !activePhone) {
      toast.error(t("form.errors.phoneMissing"));
      return;
    }
    if (values.channel === "telegram" && !activeTelegramChatId) {
      toast.error(t("form.errors.telegramMissing"));
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        channel: values.channel,
        phoneNumber: values.channel === "sms" ? activePhone : "",
        telegramChatId: values.channel === "telegram" ? activeTelegramChatId : null,
        scheduleType: values.scheduleType,
      };

      if (values.scheduleType === "once") {
        payload.scheduledAt = new Date(values.scheduledAt!).toISOString();
        payload.recurrencePattern = null;
      } else {
        payload.scheduledAt = null;
        payload.recurrencePattern = {
          daysOfWeek: Array.from(new Set(values.daysOfWeek || [])).sort((a, b) => a - b),
          time: values.time,
        };
      }

      const url = isEditing
        ? `/api/reminders/${reminder!.id}`
        : `/api/goals/${goalId}/reminders`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      toast.success(isEditing ? t("toast.updated") : t("toast.created"));
      onSuccess();
    } catch {
      toast.error(isEditing ? t("toast.updateError") : t("toast.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  // Weekday order: Saturday first in Persian, Sunday first in English
  const dayOrder = isRtl ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];

  const getErrorMessage = (errorKey?: string) => {
    if (!errorKey) return undefined;
    switch (errorKey) {
      case "dateRequired":
        return t("form.errors.dateRequired");
      case "dateFuture":
        return t("form.errors.dateFuture");
      case "daysRequired":
        return t("form.errors.daysRequired");
      case "timeRequired":
        return t("form.errors.timeRequired");
      default:
        return errorKey;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Channel selection toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium leading-none">
            {t("form.channelLabel")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={channel === "sms" ? "default" : "outline"}
              className="gap-2 cursor-pointer"
              onClick={() => form.setValue("channel", "sms")}
            >
              <Smartphone className="w-4 h-4" />
              <span>{t("channel.sms")}</span>
            </Button>
            <Button
              type="button"
              variant={channel === "telegram" ? "default" : "outline"}
              className="gap-2 cursor-pointer"
              onClick={() => form.setValue("channel", "telegram")}
            >
              <Send className="w-4 h-4" />
              <span>{t("channel.telegram")}</span>
            </Button>
          </div>
        </div>

        {/* Read-only SMS Recipient Info */}
        {channel === "sms" && (
          <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("form.smsRecipientLabel")}
                </div>
                {activePhone ? (
                  <div className="text-sm font-semibold font-mono text-foreground" dir="ltr">
                    {activePhone}
                  </div>
                ) : (
                  <div className="text-xs text-amber-500 font-medium">
                    {t("form.noPhoneConfigured")}
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              onClick={onCancel}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>{t("form.editInSettings")}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Read-only Telegram Recipient Info */}
        {channel === "telegram" && (
          <div className="p-3.5 rounded-2xl bg-surface border border-outline-variant/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  {t("form.telegramRecipientLabel")}
                </div>
                {activeTelegramChatId ? (
                  <div className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                    {activeTelegramUsername && (
                      <span className="text-sky-600 dark:text-sky-400 font-mono font-medium">
                        @{activeTelegramUsername}
                      </span>
                    )}
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      (ID: {activeTelegramChatId})
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-500 font-medium">
                    {t("form.noTelegramConfigured")}
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/settings"
              onClick={onCancel}
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>{t("form.editInSettings")}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Schedule type toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium leading-none">
            {t("form.scheduleTypeLabel")}
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={scheduleType === "once" ? "default" : "outline"}
              className="gap-2 cursor-pointer"
              onClick={() => form.setValue("scheduleType", "once")}
            >
              <Calendar className="w-4 h-4" />
              <span>{t("form.onceOption")}</span>
            </Button>
            <Button
              type="button"
              variant={scheduleType === "recurring" ? "default" : "outline"}
              className="gap-2 cursor-pointer"
              onClick={() => form.setValue("scheduleType", "recurring")}
            >
              <Repeat className="w-4 h-4" />
              <span>{t("form.recurringOption")}</span>
            </Button>
          </div>
        </div>

        {/* Conditional once fields: Date & Time */}
        {scheduleType === "once" && (
          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t("form.dateTimeLabel")}</FormLabel>
                <FormControl>
                  <CustomDatePicker
                    withTime
                    value={field.value || ""}
                    onChange={field.onChange}
                    disabled={submitting}
                  />
                </FormControl>
                {fieldState.error && (
                  <FormMessage>
                    {getErrorMessage(fieldState.error.message)}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />
        )}

        {/* Conditional recurring fields: Days of week + Time */}
        {scheduleType === "recurring" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="daysOfWeek"
              render={({ fieldState }) => (
                <FormItem>
                  <FormLabel>{t("form.daysOfWeekLabel")}</FormLabel>
                  <FormControl>
                    <Controller
                      control={form.control}
                      name="daysOfWeek"
                      render={({ field }) => {
                        const currentDays = field.value || [];
                        const toggleDay = (day: number) => {
                          const updated = currentDays.includes(day)
                            ? currentDays.filter((d) => d !== day)
                            : [...currentDays, day];
                          field.onChange(updated);
                        };

                        return (
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                            {dayOrder.map((day) => {
                              const isSelected = currentDays.includes(day);
                              return (
                                <Button
                                  key={day}
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  onClick={() => toggleDay(day)}
                                  className="h-9 px-2 text-xs font-medium cursor-pointer"
                                >
                                  {t(`days.short.${day}`)}
                                </Button>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage>
                      {getErrorMessage(fieldState.error.message)}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t("form.timeLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  {fieldState.error && (
                    <FormMessage>
                      {getErrorMessage(fieldState.error.message)}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="cursor-pointer"
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={
              submitting ||
              (channel === "sms" && !activePhone) ||
              (channel === "telegram" && !activeTelegramChatId)
            }
            className="cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                <span>
                  {isEditing
                    ? t("form.savingButton")
                    : t("form.creatingButton")}
                </span>
              </>
            ) : isEditing ? (
              t("form.saveButton")
            ) : (
              t("form.createButton")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
