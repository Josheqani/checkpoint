"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoalForm } from "@/components/goals/goal-form";
import type { GoalWithReminders } from "@/types/goal";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalWithReminders | null;
  onSaved: () => void;
}

export function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSaved,
}: GoalDialogProps) {
  const t = useTranslations("goals");
  const isEditing = Boolean(goal && goal.id);

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

        <GoalForm
          goal={goal}
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
