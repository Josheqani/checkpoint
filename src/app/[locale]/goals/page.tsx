"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import { GoalCard } from "@/components/goals/goal-card";
import { EmptyGoals } from "@/components/goals/empty-goals";
import { GoalDialog } from "@/components/goals/goal-dialog";
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardSummaryStrip,
  type DashboardStats,
} from "@/components/goals/dashboard-summary-strip";
import type { GoalWithReminders } from "@/types/goal";

export default function GoalsPage() {
  const t = useTranslations("goals");

  const [goals, setGoals] = useState<GoalWithReminders[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Goal Form dialog state (create / edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithReminders | null>(null);

  // Delete confirmation dialog state
  const [deletingGoal, setDeletingGoal] = useState<GoalWithReminders | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = (await res.json()) as {
          success?: boolean;
          stats?: DashboardStats;
        };
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) {
        throw new Error("Failed to fetch goals");
      }
      const data = (await res.json()) as {
        success?: boolean;
        goals?: GoalWithReminders[];
      };
      if (data.success && Array.isArray(data.goals)) {
        setGoals(data.goals);
      } else {
        setGoals([]);
      }
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const refreshAll = useCallback(() => {
    fetchGoals();
    fetchStats();
  }, [fetchGoals, fetchStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleCreateOpen = () => {
    setSelectedGoal(null);
    setIsFormOpen(true);
  };

  const handleEdit = (goal: GoalWithReminders) => {
    setSelectedGoal(goal);
    setIsFormOpen(true);
  };

  const handleDelete = (goal: GoalWithReminders) => {
    setDeletingGoal(goal);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={handleCreateOpen}
          className="gap-2.5 rounded-full h-11 px-5 shrink-0 cursor-pointer shadow-xs hover:shadow-sm transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newGoal")}</span>
        </Button>
      </div>

      {/* Overview Summary Strip */}
      <DashboardSummaryStrip stats={stats} loading={statsLoading} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-surface-container-low border border-outline-variant/30 p-5 space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <Skeleton className="h-6 w-3/4 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="pt-3 border-t border-outline-variant/20 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-[28px] border border-destructive/25 bg-destructive/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive font-medium">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchGoals} className="rounded-full cursor-pointer">
            {t("retry")}
          </Button>
        </div>
      ) : goals.length === 0 ? (
        <EmptyGoals onCreateGoal={handleCreateOpen} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) elevated above MobileNav on mobile */}
      <div className="fixed bottom-20 end-5 z-40 sm:hidden">
        <Fab
          variant="primary"
          size="default"
          onClick={handleCreateOpen}
          aria-label={t("newGoal")}
          className="shadow-xl hover:shadow-2xl active:shadow-md"
        >
          <Plus className="w-6 h-6" />
        </Fab>
      </div>

      <GoalDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        goal={selectedGoal}
        onSaved={refreshAll}
      />

      <DeleteGoalDialog
        goal={deletingGoal}
        open={Boolean(deletingGoal)}
        onOpenChange={(open) => {
          if (!open) setDeletingGoal(null);
        }}
        onDeleted={refreshAll}
      />
    </div>
  );
}
