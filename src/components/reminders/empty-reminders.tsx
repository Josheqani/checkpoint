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
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-[28px] border border-dashed border-outline-variant/60 bg-surface-container-low/50">
      <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mb-3 mx-auto shadow-xs">
        <BellRing className="w-7 h-7" />
      </div>
      <h4 className="text-base font-medium tracking-normal text-foreground mb-1">
        {t("emptyTitle")}
      </h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed">
        {t("emptyDescription")}
      </p>
      <Button onClick={onAddReminder} size="sm" className="gap-2 rounded-full h-10 px-5 cursor-pointer shadow-xs hover:shadow-sm">
        <Plus className="w-4 h-4" />
        <span>{t("addFirstReminder")}</span>
      </Button>
    </div>
  );
}
