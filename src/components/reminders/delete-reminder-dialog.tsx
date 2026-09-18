"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Phone, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatScheduleSummary } from "@/lib/format-schedule";
import type { ReminderItem } from "@/types/reminder";

interface DeleteReminderDialogProps {
  reminder: ReminderItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteReminderDialog({
  reminder,
  open,
  onOpenChange,
  onDeleted,
}: DeleteReminderDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [deleting, setDeleting] = useState(false);

  if (!reminder) return null;

  const summary = formatScheduleSummary(reminder, locale, t);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete reminder");
      }

      toast.success(t("reminders.toast.deleted"));
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error(t("reminders.toast.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{t("reminders.deleteDialog.title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/90">
            {t("reminders.deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-lg bg-muted/50 border border-border/80 space-y-2 text-sm">
          <div className="flex items-center gap-2 font-mono">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            <span dir="ltr">{reminder.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5 text-primary/70 shrink-0" />
            <span>{summary}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="cursor-pointer"
          >
            {t("reminders.form.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="cursor-pointer gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("reminders.deleteDialog.deleting")}</span>
              </>
            ) : (
              t("reminders.deleteDialog.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
