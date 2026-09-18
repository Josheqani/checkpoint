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
    <Card className="flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow border-border/80">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg font-semibold leading-snug break-words">
            <Link
              href={`/goals/${goal.id}`}
              className="hover:text-primary transition-colors hover:underline"
            >
              {goal.title}
            </Link>
          </CardTitle>
          <Badge
            variant={goal.activeRemindersCount > 0 ? "default" : "secondary"}
            className="shrink-0 gap-1.5 text-xs font-normal"
          >
            <Bell className="w-3 h-3" />
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

        <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
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

      <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(goal)}
          className="gap-1.5 cursor-pointer text-xs h-8"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>{t("edit")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(goal)}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer text-xs h-8"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t("delete")}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
