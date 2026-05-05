"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { readStoredDay, useStoredDays } from "@/lib/daily-store";
import {
  getActionForSlot,
  getFilledSlotCount,
  getSlotCompletionRate,
  getSlotFillMap,
} from "@/lib/slot-metrics";
import {
  addMonthsToMonthKey,
  cn,
  formatDisplayDate,
  formatDisplayMonth,
  getMonthDateKeys,
  getMonthKey,
  getTodayDateKey,
} from "@/lib/utils";
import { dailyActionSlots, slotMeta } from "@/types/daily-action";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

export function MonthlyCalendar() {
  useStoredDays();

  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateKey());

  const monthDates = useMemo(() => getMonthDateKeys(monthKey), [monthKey]);
  const leadingBlankCount = useMemo(() => {
    const firstDate = new Date(`${monthDates[0]}T00:00:00`);
    return (firstDate.getDay() + 6) % 7;
  }, [monthDates]);
  const selectedDay = readStoredDay(selectedDate);
  const selectedFilledCount = getFilledSlotCount(selectedDay.actions);
  const selectedRate = getSlotCompletionRate(selectedDay.actions);

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero grid gap-5">
        <div className="max-w-5xl text-left">
          <p className="survey-kicker">Calendar</p>
          <h1 className="survey-title mt-3 text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
            월간 로그 캘린더
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
            날짜별로 남긴 실행 내용을 가볍게 훑어봅니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2">
          <button
            className="survey-control flex h-12 w-12 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            onClick={() => setMonthKey((current) => addMonthsToMonthKey(current, -1))}
            title="이전 달"
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={21} />
          </button>
          <div className="survey-control flex h-12 min-w-40 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-lg font-semibold text-zinc-950">
            {formatDisplayMonth(monthKey)}
          </div>
          <button
            className="survey-control flex h-12 w-12 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            onClick={() => setMonthKey((current) => addMonthsToMonthKey(current, 1))}
            title="다음 달"
            type="button"
          >
            <ChevronRight aria-hidden="true" size={21} />
          </button>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="survey-card survey-grid-panel hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:p-4 md:block">
          <div className="min-w-[680px]">
            <div className="mb-3 grid grid-cols-7 gap-2">
              {weekdays.map((weekday) => (
                <div
                  className="flex h-10 items-center justify-center text-sm font-semibold text-zinc-500"
                  key={weekday}
                >
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: leadingBlankCount }).map((_, index) => (
                <div
                  className="min-h-24 rounded-md border border-zinc-200 bg-zinc-50/60 opacity-50"
                  key={`blank-${index}`}
                />
              ))}
              {monthDates.map((dateKey) => {
                const day = readStoredDay(dateKey);
                const filledCount = getFilledSlotCount(day.actions);
                const rate = getSlotCompletionRate(day.actions);
                const hasRecord = filledCount > 0 || day.dailyLog.dailyReflection;
                const dateNumber = Number(dateKey.slice(-2));

                return (
                  <button
                    className={cn(
                      "survey-control min-h-24 rounded-md border p-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50",
                      selectedDate === dateKey
                        ? "border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-950"
                        : "border-zinc-200 bg-white text-zinc-950",
                    )}
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-lg font-semibold">{dateNumber}</span>
                      {hasRecord ? (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-semibold",
                            selectedDate === dateKey
                              ? "bg-white/15 text-white"
                              : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {filledCount}/4
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-1">
                      {dailyActionSlots.map((slot) => (
                        <span
                          className={cn(
                            "h-1.5 rounded-full",
                            getSlotFillMap(day.actions)[slot]
                              ? selectedDate === dateKey
                                ? "bg-emerald-300"
                                : "bg-emerald-400"
                              : selectedDate === dateKey
                                ? "bg-white/20"
                                : "bg-zinc-200",
                          )}
                          key={slot}
                        />
                      ))}
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-sm font-semibold",
                        selectedDate === dateKey ? "text-white/75" : "text-zinc-500",
                      )}
                    >
                      {rate}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:hidden">
          {monthDates.map((dateKey) => {
            const day = readStoredDay(dateKey);
            const filledCount = getFilledSlotCount(day.actions);
            const fillMap = getSlotFillMap(day.actions);
            const isSelected = selectedDate === dateKey;

            return (
              <button
                className={cn(
                  "survey-card grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm",
                  isSelected && "border-zinc-950",
                )}
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-zinc-950">
                      {formatDisplayDate(dateKey)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">
                      {filledCount > 0 ? `${filledCount}개 로그` : "아직 로그 없음"}
                    </p>
                  </div>
                  <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm font-semibold text-zinc-600">
                    {filledCount}/4
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {dailyActionSlots.map((slot) => (
                    <span
                      className={cn(
                        "h-2 border border-zinc-200",
                        fillMap[slot] ? "bg-emerald-50" : "bg-zinc-50",
                      )}
                      key={slot}
                      title={slotMeta[slot].label}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <aside className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-zinc-500">선택 날짜</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
            {formatDisplayDate(selectedDate)}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm font-semibold text-zinc-500">Filled</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">
                {selectedFilledCount}/4
              </p>
            </div>
            <div className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm font-semibold text-zinc-500">Rate</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950">
                {selectedRate}%
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {dailyActionSlots.map((slot) => {
              const action = getActionForSlot(selectedDay.actions, slot);
              const filled = Boolean(action?.description.trim() || action?.reflection.trim());

              return (
                <div
                  className={cn(
                    "survey-chip rounded-md border p-3",
                    filled
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-zinc-200 bg-zinc-50",
                  )}
                  key={slot}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-semibold text-zinc-950">
                      {slotMeta[slot].label}
                    </p>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        filled ? "text-emerald-700" : "text-zinc-400",
                      )}
                    >
                      {filled ? "Filled" : "Empty"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {action?.description || action?.reflection || slotMeta[slot].description}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
}
