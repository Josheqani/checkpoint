"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { GoalWithReminders } from "@/types/goal";

interface DeleteGoalDialogProps {
  goal: GoalWithReminders | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteGoalDialog({
  goal,
  open,
  onOpenChange,
  onDeleted,
}: DeleteGoalDialogProps) {
  const t = useTranslations("goals");
  const [deleting, setDeleting] = useState(false);

  if (!goal) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete goal");
      }

      toast.success(t("toast.deleted"));
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error(t("toast.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <Icon name="warning" size="sm" className="text-destructive shrink-0" fill />
            <span>{t("deleteDialog.title")}</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/90">
            {t("deleteDialog.description", { title: goal.title })}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
          <Icon name="warning" size="xs" className="text-destructive shrink-0 mt-0.5" fill />
          <span className="leading-relaxed">
            {t("deleteDialog.cascadeWarning", { count: goal.totalRemindersCount })}
          </span>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="cursor-pointer"
          >
            {t("form.cancel")}
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
                <Icon name="progress_activity" size="sm" className="animate-spin" />
                <span>{t("deleteDialog.deleting")}</span>
              </>
            ) : (
              t("deleteDialog.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
