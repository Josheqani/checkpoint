"use client";

import { useLocale, useTranslations } from "next-intl";
import { Target, Bell, Send, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTehranDateTime } from "@/lib/reminder-matching";

export interface DashboardStats {
  totalActiveGoals: number;
  totalActiveReminders: number;
  sentLast7Days: number;
  nextUpcoming: {
    reminderId: string;
    goalId: string;
    goalTitle: string;
    scheduleType: string;
    nextDate: string; // ISO string
  } | null;
}

interface DashboardSummaryStripProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function DashboardSummaryStrip({
  stats,
  loading = false,
}: DashboardSummaryStripProps) {
  const t = useTranslations("goals.summary");
  const locale = useLocale();

  const formatNextUpcoming = () => {
    if (!stats?.nextUpcoming?.nextDate) {
      return { timeText: t("noUpcoming"), titleText: "" };
    }

    try {
      const date = new Date(stats.nextUpcoming.nextDate);
      const now = new Date();
      const tehranDate = getTehranDateTime(date);
      const tehranNow = getTehranDateTime(now);

      const timeFormatted = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tehran",
      }).format(date);

      let dayText = "";
      if (tehranDate.dateString === tehranNow.dateString) {
        dayText = t("today");
      } else {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tehranTomorrow = getTehranDateTime(tomorrow);
        if (tehranDate.dateString === tehranTomorrow.dateString) {
          dayText = t("tomorrow");
        } else {
          dayText = new Intl.DateTimeFormat(locale, {
            weekday: "short",
            month: "numeric",
            day: "numeric",
            timeZone: "Asia/Tehran",
          }).format(date);
        }
      }

      return {
        timeText: `${dayText} ${timeFormatted}`,
        titleText: stats.nextUpcoming.goalTitle,
      };
    } catch {
      return { timeText: t("noUpcoming"), titleText: "" };
    }
  };

  const nextInfo = formatNextUpcoming();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Active Goals */}
      <Card className="rounded-2xl sm:rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {t("activeGoals")}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 tracking-tight">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-muted animate-pulse rounded-md" />
              ) : (
                stats?.totalActiveGoals ?? 0
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Active Reminders */}
      <Card className="rounded-2xl sm:rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {t("activeReminders")}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 tracking-tight">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-muted animate-pulse rounded-md" />
              ) : (
                stats?.totalActiveReminders ?? 0
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Sent in Last 7 Days */}
      <Card className="rounded-2xl sm:rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Send className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {t("sentLast7Days")}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 tracking-tight">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-muted animate-pulse rounded-md" />
              ) : (
                stats?.sentLast7Days ?? 0
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Next Upcoming Reminder */}
      <Card className="rounded-2xl sm:rounded-3xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all">
        <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-surface-container-highest text-foreground flex items-center justify-center shrink-0 shadow-xs">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">
              {t("nextReminder")}
            </p>
            {loading ? (
              <span className="inline-block w-16 h-6 bg-muted animate-pulse rounded-md mt-0.5" />
            ) : (
              <div className="mt-0.5">
                <p className="text-sm sm:text-base font-bold text-foreground truncate tracking-tight">
                  {nextInfo.timeText}
                </p>
                {nextInfo.titleText && (
                  <p className="text-[11px] text-muted-foreground truncate font-medium">
                    {nextInfo.titleText}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
