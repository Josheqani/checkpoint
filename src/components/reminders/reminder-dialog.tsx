"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReminderForm } from "@/components/reminders/reminder-form";
import type { ReminderItem } from "@/types/reminder";

interface ReminderDialogProps {
  goalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder?: ReminderItem | null;
  onSaved: () => void;
}

export function ReminderDialog({
  goalId,
  open,
  onOpenChange,
  reminder,
  onSaved,
}: ReminderDialogProps) {
  const t = useTranslations("reminders");
  const isEditing = Boolean(reminder && reminder.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t("form.editDescription")
              : t("form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <ReminderForm
          goalId={goalId}
          reminder={reminder}
          onSuccess={() => {
            onOpenChange(false);
            onSaved();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
