export type GoalWithReminders = {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
  activeRemindersCount: number;
  totalRemindersCount: number;
};
