"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bell, Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GoalWithReminders } from "@/types/goal";

interface GoalCardProps {
  goal: GoalWithReminders;
  onEdit: (goal: GoalWithReminders) => void;
  onDelete: (goal: GoalWithReminders) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const t = useTranslations("goals");
  const locale = useLocale();

  const formatTargetDate = (dateVal: string | number | null) => {
    if (!dateVal) return t("noTargetDate");
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return t("noTargetDate");
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(d);
    } catch {
      return t("noTargetDate");
    }
  };

  const formatCreatedDate = (dateVal: string | number) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
      }).format(d);
    } catch {
      return "";
    }
  };

  return (
    <Card className="flex flex-col justify-between rounded-3xl bg-surface-container-low border border-outline-variant/40 hover:shadow-md hover:border-outline-variant/70 transition-all duration-200">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-medium leading-snug break-words">
            <Link
              href={`/goals/${goal.id}`}
              className="hover:text-primary transition-colors hover:underline"
            >
              {goal.title}
            </Link>
          </CardTitle>
          <Badge
            variant={goal.activeRemindersCount > 0 ? "default" : "secondary"}
            className="shrink-0 gap-1.5 text-xs font-medium"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {t("activeReminders", { count: goal.activeRemindersCount })}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        {goal.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap leading-relaxed">
            {goal.description}
          </p>
        )}

        <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
            <span>
              <span className="font-medium text-foreground/80">{t("targetDate")}:</span>{" "}
              {formatTargetDate(goal.targetDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" />
            <span>
              <span className="font-medium text-foreground/80">{t("created")}:</span>{" "}
              {formatCreatedDate(goal.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(goal)}
          className="gap-1.5 rounded-full h-8 px-3.5 text-xs cursor-pointer text-foreground/80 hover:text-primary hover:border-primary/40 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{t("edit")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(goal)}
          className="gap-1.5 rounded-full h-8 px-3.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 hover:border-destructive/60 cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t("delete")}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
