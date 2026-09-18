"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import type { GoalWithReminders } from "@/types/goal";

const goalFormSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(255),
  description: z.string().max(2000).optional(),
  targetDate: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  goal?: GoalWithReminders | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function toDateInputValue(val: string | number | null | undefined): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const t = useTranslations("goals");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(goal && goal.id);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      targetDate: toDateInputValue(goal?.targetDate),
    },
  });

  useEffect(() => {
    form.reset({
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      targetDate: toDateInputValue(goal?.targetDate),
    });
  }, [goal, form]);

  const onSubmit = async (values: GoalFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description?.trim() || null,
        targetDate: values.targetDate ? new Date(values.targetDate).toISOString() : null,
      };

      const url = isEditing ? `/api/goals/${goal!.id}` : "/api/goals";
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("form.titleLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("form.titlePlaceholder")}
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              {fieldState.error && (
                <FormMessage>
                  {fieldState.error.message === "titleRequired"
                    ? t("form.titleRequired")
                    : fieldState.error.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.descriptionLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("form.descriptionPlaceholder")}
                  rows={3}
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.targetDateLabel")}</FormLabel>
              <FormControl>
                <CustomDatePicker
                  value={field.value || ""}
                  onChange={field.onChange}
                  disabled={submitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="cursor-pointer"
          >
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={submitting} className="cursor-pointer">
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
