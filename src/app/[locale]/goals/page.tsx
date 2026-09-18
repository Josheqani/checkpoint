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
import type { GoalWithReminders } from "@/types/goal";

export default function GoalsPage() {
  const t = useTranslations("goals");

  const [goals, setGoals] = useState<GoalWithReminders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Goal Form dialog state (create / edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithReminders | null>(null);

  // Delete confirmation dialog state
  const [deletingGoal, setDeletingGoal] = useState<GoalWithReminders | null>(null);

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

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">{t("loading")}</p>
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

      {/* Floating Action Button (FAB) for mobile viewports */}
      <div className="fixed bottom-6 end-6 z-40 sm:hidden">
        <Fab
          variant="primary"
          size="default"
          onClick={handleCreateOpen}
          aria-label={t("newGoal")}
          className="shadow-lg hover:shadow-xl active:shadow-md"
        >
          <Plus className="w-6 h-6" />
        </Fab>
      </div>

      <GoalDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        goal={selectedGoal}
        onSaved={fetchGoals}
      />

      <DeleteGoalDialog
        goal={deletingGoal}
        open={Boolean(deletingGoal)}
        onOpenChange={(open) => {
          if (!open) setDeletingGoal(null);
        }}
        onDeleted={fetchGoals}
      />
    </div>
  );
}
