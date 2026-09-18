"use client";

import { useTranslations } from "next-intl";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyGoalsProps {
  onCreateGoal: () => void;
}

export function EmptyGoals({ onCreateGoal }: EmptyGoalsProps) {
  const t = useTranslations("goals");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Target className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight mb-1">
        {t("emptyTitle")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {t("emptyDescription")}
      </p>
      <Button onClick={onCreateGoal} className="gap-2 cursor-pointer">
        <Plus className="w-4 h-4" />
        <span>{t("createFirstGoal")}</span>
      </Button>
    </div>
  );
}
