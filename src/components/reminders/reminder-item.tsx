"use client";

import { useLocale, useTranslations } from "next-intl";
import { Clock, Calendar, Repeat, Pencil, Trash2, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatScheduleSummary } from "@/lib/format-schedule";
import type { ReminderItem } from "@/types/reminder";

interface ReminderItemProps {
  reminder: ReminderItem;
  onToggleActive: (reminder: ReminderItem, active: boolean) => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (reminder: ReminderItem) => void;
}

export function ReminderItemCard({
  reminder,
  onToggleActive,
  onEdit,
  onDelete,
}: ReminderItemProps) {
  const t = useTranslations();
  const locale = useLocale();

  const summary = formatScheduleSummary(reminder, locale, t);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low hover:border-outline-variant/70 hover:shadow-xs transition-all duration-150 gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-foreground border border-outline-variant/40 font-mono text-xs font-semibold tracking-wide">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span dir="ltr">{reminder.phoneNumber}</span>
          </div>

          <Badge
            variant={reminder.scheduleType === "recurring" ? "secondary" : "default"}
            className="text-xs font-medium gap-1.5"
          >
            {reminder.scheduleType === "recurring" ? (
              <>
                <Repeat className="w-3 h-3" />
                <span>{t("reminders.schedule.recurringType")}</span>
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3" />
                <span>{t("reminders.schedule.onceType")}</span>
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 shrink-0 text-primary" />
          <span>{summary}</span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <Switch
            id={`switch-${reminder.id}`}
            checked={reminder.isActive}
            onCheckedChange={(checked) => onToggleActive(reminder, checked)}
            aria-label={
              reminder.isActive
                ? t("reminders.active")
                : t("reminders.inactive")
            }
          />
          <label
            htmlFor={`switch-${reminder.id}`}
            className="text-xs font-medium cursor-pointer select-none text-muted-foreground"
          >
            {reminder.isActive
              ? t("reminders.active")
              : t("reminders.inactive")}
          </label>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(reminder)}
            className="h-8 w-8 rounded-full p-0 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            title={t("goals.edit")}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="sr-only">{t("goals.edit")}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(reminder)}
            className="h-8 w-8 rounded-full p-0 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title={t("goals.delete")}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sr-only">{t("goals.delete")}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
