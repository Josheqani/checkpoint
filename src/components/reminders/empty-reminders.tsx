"use client";

import { useTranslations } from "next-intl";
import { BellRing, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyRemindersProps {
  onAddReminder: () => void;
}

export function EmptyReminders({ onAddReminder }: EmptyRemindersProps) {
  const t = useTranslations("reminders");

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <BellRing className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold tracking-tight mb-1">
        {t("emptyTitle")}
      </h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {t("emptyDescription")}
      </p>
      <Button onClick={onAddReminder} size="sm" className="gap-2 cursor-pointer">
        <Plus className="w-4 h-4" />
        <span>{t("addFirstReminder")}</span>
      </Button>
    </div>
  );
}
