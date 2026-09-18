"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fab } from "@/components/ui/fab";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ReminderItemCard } from "@/components/reminders/reminder-item";
import { EmptyReminders } from "@/components/reminders/empty-reminders";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import { DeleteReminderDialog } from "@/components/reminders/delete-reminder-dialog";
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

  // Delete confirmation dialog state
  const [deletingReminder, setDeletingReminder] = useState<ReminderItem | null>(null);

  const handleToggleActive = async (reminder: ReminderItem, active: boolean) => {
    // 1. Optimistic update
    const previousReminders = [...reminders];
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, isActive: active } : r))
    );

    try {
      const res = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = (await res.json()) as {
        success?: boolean;
        reminder?: ReminderItem;
      };

      if (data.success && data.reminder) {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminder.id ? data.reminder! : r))
        );
      }
      toast.success(t("reminders.toast.statusUpdated"));
    } catch {
      // Rollback on failure
      setReminders(previousReminders);
      toast.error(t("reminders.toast.toggleError"));
    }
  };

  const handleEdit = (reminder: ReminderItem) => {
    setSelectedReminder(reminder);
    setIsFormOpen(true);
  };

  const handleDelete = (reminder: ReminderItem) => {
    setDeletingReminder(reminder);
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
        <Button variant="ghost" size="sm" asChild className="gap-2 -ms-2 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/5 cursor-pointer">
          <Link href="/goals">
            <Icon name={isRtl ? "arrow_forward" : "arrow_back"} size="sm" />
            <span>{t("reminders.backToGoals")}</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Icon name="progress_activity" size="lg" className="animate-spin text-primary" />
          <p className="text-sm">{t("goals.loading")}</p>
        </div>
      ) : error || !goal ? (
        <div className="p-6 rounded-[28px] border border-destructive/25 bg-destructive/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive font-medium">
            <Icon name="error" size="sm" />
            <span>{error || t("goals.fetchError")}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="rounded-full cursor-pointer">
            {t("goals.retry")}
          </Button>
        </div>
      ) : (
        <>
          {/* Goal Overview Card */}
          <Card className="rounded-3xl bg-surface-container-low border border-outline-variant/40">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <CardTitle className="text-xl sm:text-2xl font-medium tracking-normal break-words text-foreground">
                  {goal.title}
                </CardTitle>
                <Badge
                  variant={
                    reminders.filter((r) => r.isActive).length > 0
                      ? "default"
                      : "secondary"
                  }
                  className="shrink-0 gap-1.5 text-xs font-medium self-start"
                >
                  <Icon name="notifications" size="xs" fill />
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

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                  <Icon name="calendar_today" size="xs" className="text-muted-foreground/80 shrink-0" />
                  <span>
                    <span className="font-medium text-foreground/80">
                      {t("goals.targetDate")}:
                    </span>{" "}
                    {formatTargetDate(goal.targetDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Icon name="schedule" size="xs" className="text-muted-foreground/80 shrink-0" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-normal tracking-tight text-foreground">
                    {t("reminders.title")}
                  </h2>
                  <Badge variant="outline" className="text-xs font-mono font-medium">
                    {reminders.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t("reminders.subtitle")}
                </p>
              </div>

              <Button
                onClick={handleAddReminder}
                className="gap-2 rounded-full h-10 px-5 shrink-0 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Icon name="add" size="sm" />
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

          {/* Floating Action Button (FAB) for mobile viewports */}
          <div className="fixed bottom-6 end-6 z-40 sm:hidden">
            <Fab
              variant="primary"
              size="default"
              onClick={handleAddReminder}
              aria-label={t("reminders.addReminder")}
              className="shadow-lg hover:shadow-xl active:shadow-md"
            >
              <Icon name="add" size="md" />
            </Fab>
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

      <DeleteReminderDialog
        reminder={deletingReminder}
        open={Boolean(deletingReminder)}
        onOpenChange={(open) => {
          if (!open) setDeletingReminder(null);
        }}
        onDeleted={fetchData}
      />
    </div>
  );
}
