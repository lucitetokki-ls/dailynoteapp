import type { DailyAction } from "@/types/daily-action";
import type { DailyLog } from "@/types/daily-log";

type LegacySampleDay = {
  dailyLog: Pick<DailyLog, "date">;
  actions: Array<Pick<DailyAction, "createdAt">>;
};

const legacySampleActionCreatedAt = Date.parse("2026-05-07T13:55:48.385Z");

export function isLegacySampleDay(day: LegacySampleDay) {
  if (
    day.dailyLog.date < "2026-05-01" ||
    day.dailyLog.date > "2026-05-07" ||
    day.actions.length === 0
  ) {
    return false;
  }

  return day.actions.every(
    (action) => Date.parse(action.createdAt) === legacySampleActionCreatedAt,
  );
}
