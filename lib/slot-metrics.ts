import {
  dailyActionSlots,
  slotMeta,
  type DailyAction,
  type DailyActionSlot,
} from "@/types/daily-action";

export function getActionForSlot(actions: DailyAction[], slot: DailyActionSlot) {
  const exactMatch = actions.find((action) => action.slot === slot);

  if (exactMatch) {
    return exactMatch;
  }

  return actions.find((action) => {
    if (slot === "diet") {
      return action.category === "diet_fitness" && action.title.includes("식단");
    }

    if (slot === "fitness") {
      return action.category === "diet_fitness" && action.title.includes("운동");
    }

    return action.category === slotMeta[slot].category;
  });
}

function isSlotFilled(actions: DailyAction[], slot: DailyActionSlot) {
  const action = getActionForSlot(actions, slot);

  return Boolean(action?.description.trim() || action?.reflection.trim());
}

export function getFilledSlotCount(actions: DailyAction[]) {
  return dailyActionSlots.filter((slot) => isSlotFilled(actions, slot)).length;
}

export function getSlotCompletionRate(actions: DailyAction[]) {
  return Math.round((getFilledSlotCount(actions) / dailyActionSlots.length) * 100);
}

export function getAverageSlotSatisfaction(actions: DailyAction[]) {
  const filledActions = dailyActionSlots
    .map((slot) => getActionForSlot(actions, slot))
    .filter((action): action is DailyAction =>
      Boolean(action?.description.trim() || action?.reflection.trim()),
    );

  if (filledActions.length === 0) {
    return 0;
  }

  return Number(
    (
      filledActions.reduce((total, action) => total + action.satisfaction, 0) /
      filledActions.length
    ).toFixed(1),
  );
}

export function getSlotFillMap(actions: DailyAction[]) {
  return Object.fromEntries(
    dailyActionSlots.map((slot) => [slot, isSlotFilled(actions, slot)]),
  ) as Record<DailyActionSlot, boolean>;
}
