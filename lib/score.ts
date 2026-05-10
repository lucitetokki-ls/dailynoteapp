import type { DailyAction } from "@/types/daily-action";

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
