import { actionCategories, type ActionCategory, type DailyAction } from "@/types/daily-action";

export function calculateCompletionRate(actions: DailyAction[]) {
  if (actions.length === 0) {
    return 0;
  }

  const weightedTotal = actions.reduce((total, action) => {
    if (action.status === "done") {
      return total + 1;
    }

    if (action.status === "partial") {
      return total + 0.5;
    }

    return total;
  }, 0);

  return Math.round((weightedTotal / actions.length) * 100);
}

export function getCategoryActionCounts(actions: DailyAction[]) {
  return actionCategories.reduce<Record<ActionCategory, number>>(
    (counts, category) => {
      counts[category] = actions.filter((action) => action.category === category).length;
      return counts;
    },
    {
      diet_fitness: 0,
      vibe_coding: 0,
      writing: 0,
    },
  );
}

export function getDoneCount(actions: DailyAction[]) {
  return actions.filter((action) => action.status === "done").length;
}

export function getPartialCount(actions: DailyAction[]) {
  return actions.filter((action) => action.status === "partial").length;
}

export function getSkippedCount(actions: DailyAction[]) {
  return actions.filter((action) => action.status === "skipped").length;
}

export function getAverageSatisfaction(actions: DailyAction[]) {
  if (actions.length === 0) {
    return 0;
  }

  const total = actions.reduce((sum, action) => sum + action.satisfaction, 0);
  return Math.round((total / actions.length) * 10) / 10;
}
