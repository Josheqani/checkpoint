"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReminderItemCard } from "@/components/reminders/reminder-item";
import { EmptyReminders } from "@/components/reminders/empty-reminders";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import type { GoalWithReminders } from "@/types/goal";
import type { ReminderItem } from "@/types/reminder";

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GoalDetailPage({ params }: GoalDetailPageProps) {
  const { id: goalId } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "fa";

  const [goal, setGoal] = useState<GoalWithReminders | null>(null);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reminder Form Dialog state (create / edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [goalRes, remRes] = await Promise.all([
        fetch(`/api/goals/${goalId}`),
        fetch(`/api/goals/${goalId}/reminders`),
      ]);

      if (!goalRes.ok) {
        throw new Error("Failed to fetch goal");
      }

      const goalData = (await goalRes.json()) as {
        success?: boolean;
        goal?: GoalWithReminders;
      };
      if (goalData.success && goalData.goal) {
        setGoal(goalData.goal);
      }

      if (remRes.ok) {
        const remData = (await remRes.json()) as {
          success?: boolean;
          reminders?: ReminderItem[];
        };
        if (remData.success && Array.isArray(remData.reminders)) {
          setReminders(remData.reminders);
        }
      }
    } catch {
      setError(t("goals.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [goalId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleActive = async (reminder: ReminderItem, active: boolean) => {
    // Handled in Stage 4
    console.log("Toggle active:", reminder.id, active);
  };

  const handleEdit = (reminder: ReminderItem) => {
    setSelectedReminder(reminder);
    setIsFormOpen(true);
  };

  const handleDelete = (reminder: ReminderItem) => {
    // Handled in Stage 4
    console.log("Delete reminder:", reminder);
  };

  const handleAddReminder = () => {
    setSelectedReminder(null);
    setIsFormOpen(true);
  };

  const formatTargetDate = (dateVal: string | number | null | undefined) => {
    if (!dateVal) return t("goals.noTargetDate");
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return t("goals.noTargetDate");
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }).format(d);
    } catch {
      return t("goals.noTargetDate");
    }
  };

  const formatCreatedDate = (dateVal: string | number | undefined) => {
    if (!dateVal) return "";
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
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-2 -ms-2">
          <Link href="/goals">
            {isRtl ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
            <span>{t("reminders.backToGoals")}</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">{t("goals.loading")}</p>
        </div>
      ) : error || !goal ? (
        <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive font-medium">
            <AlertCircle className="w-5 h-5" />
            <span>{error || t("goals.fetchError")}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="cursor-pointer">
            {t("goals.retry")}
          </Button>
        </div>
      ) : (
        <>
          {/* Goal Overview Card */}
          <Card className="border-border/80">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <CardTitle className="text-xl sm:text-2xl font-bold break-words">
                  {goal.title}
                </CardTitle>
                <Badge
                  variant={
                    reminders.filter((r) => r.isActive).length > 0
                      ? "default"
                      : "secondary"
                  }
                  className="shrink-0 gap-1.5 text-xs font-normal self-start"
                >
                  <Bell className="w-3 h-3" />
                  <span>
                    {t("goals.activeReminders", {
                      count: reminders.filter((r) => r.isActive).length,
                    })}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {goal.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {goal.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/80" />
                  <span>
                    <span className="font-medium text-foreground/80">
                      {t("goals.targetDate")}:
                    </span>{" "}
                    {formatTargetDate(goal.targetDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/80" />
                  <span>
                    <span className="font-medium text-foreground/80">
                      {t("goals.created")}:
                    </span>{" "}
                    {formatCreatedDate(goal.createdAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {t("reminders.title")}
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono">
                    {reminders.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("reminders.subtitle")}
                </p>
              </div>

              <Button
                onClick={handleAddReminder}
                size="sm"
                className="gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t("reminders.addReminder")}</span>
              </Button>
            </div>

            {reminders.length === 0 ? (
              <EmptyReminders onAddReminder={handleAddReminder} />
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <ReminderItemCard
                    key={reminder.id}
                    reminder={reminder}
                    onToggleActive={handleToggleActive}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ReminderDialog
        goalId={goalId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        reminder={selectedReminder}
        onSaved={fetchData}
      />
    </div>
  );
}
