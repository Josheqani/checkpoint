"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface EmptyGoalsProps {
  onCreateGoal: () => void;
}

export function EmptyGoals({ onCreateGoal }: EmptyGoalsProps) {
  const t = useTranslations("goals");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-[28px] border border-dashed border-outline-variant/60 bg-surface-container-low/50">
      <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center mb-4 mx-auto shadow-xs">
        <Icon name="flag" size="xl" fill />
      </div>
      <h3 className="text-xl font-normal tracking-normal text-foreground mb-1.5">
        {t("emptyTitle")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {t("emptyDescription")}
      </p>
      <Button onClick={onCreateGoal} size="lg" className="gap-2 rounded-full h-11 px-6 cursor-pointer shadow-xs hover:shadow-sm">
        <Icon name="add" size="sm" />
        <span>{t("createFirstGoal")}</span>
      </Button>
    </div>
  );
}
