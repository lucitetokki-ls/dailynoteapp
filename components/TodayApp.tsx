"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Target,
} from "lucide-react";

import { DailyReflection } from "@/components/DailyReflection";
import { DailyImagePanel } from "@/components/DailyImagePanel";
import { FixedDailyActions } from "@/components/FixedDailyActions";
import { updateStoredDay, useStoredDay, useSupabaseSyncStatus } from "@/lib/daily-store";
import { getActionForSlot, getFilledSlotCount } from "@/lib/slot-metrics";
import {
  addDaysToDateKey,
  cn,
  createId,
  formatDisplayDate,
  getTodayDateKey,
} from "@/lib/utils";
import {
  dailyActionSlots,
  slotMeta,
  type DailyAction,
  type DailyActionSlot,
} from "@/types/daily-action";
import type { DailyLog } from "@/types/daily-log";

export function TodayApp() {
  const [todayDate] = useState(() => getTodayDateKey());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const { dailyLog, actions } = useStoredDay(selectedDate);
  const syncStatus = useSupabaseSyncStatus(selectedDate);
  const isToday = selectedDate === todayDate;

  const recordedSlotCount = useMemo(() => getFilledSlotCount(actions), [actions]);
  const completionRate = Math.round((recordedSlotCount / dailyActionSlots.length) * 100);

  function updateSlot(slot: DailyActionSlot, updates: Partial<DailyAction>) {
    const now = new Date().toISOString();

    updateStoredDay(selectedDate, (currentDay) => {
      const log = {
        ...currentDay.dailyLog,
        updatedAt: now,
      };
      const existingAction = getActionForSlot(currentDay.actions, slot);
      const slotInfo = slotMeta[slot];

      if (!existingAction) {
        return {
          dailyLog: log,
          actions: [
            {
              id: createId(),
              dailyLogId: log.id,
              slot,
              category: slotInfo.category,
              title: slotInfo.label,
              description: updates.description ?? "",
              status: "done",
              satisfaction: updates.satisfaction ?? 3,
              reflection: updates.reflection ?? "",
              createdAt: now,
              updatedAt: now,
            },
            ...currentDay.actions,
          ],
        };
      }

      return {
        dailyLog: log,
        actions: currentDay.actions.map((action) =>
          action.id === existingAction.id
            ? {
                ...action,
                slot,
                category: slotInfo.category,
                title: slotInfo.label,
                ...updates,
                status: "done",
                updatedAt: now,
              }
            : action,
        ),
      };
    });
  }

  function updateDailyLog(updates: Partial<DailyLog>) {
    const now = new Date().toISOString();

    updateStoredDay(selectedDate, (currentDay) => {
      return {
        dailyLog: {
          ...currentDay.dailyLog,
          ...updates,
          updatedAt: now,
        },
        actions: currentDay.actions,
      };
    });
  }

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero grid gap-5">
        <div className="max-w-5xl pt-1 text-left">
          <p className="survey-kicker">
            Lucitetokki Daily Action Log
          </p>
          <h1 className="survey-title mt-3 text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            苟日新, 日日新, 又日新
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600 sm:text-xl">
            진실로 날로 새로워지려면, 날마다 새로워지고 또 새로워져야 한다
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="survey-card survey-stat rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 sm:text-base">
              <Target aria-hidden="true" size={18} />
              Slots
            </div>
            <p className="mt-1.5 text-3xl font-semibold text-zinc-950 sm:text-4xl">{dailyActionSlots.length}</p>
          </div>
          <div className="survey-card survey-stat rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 sm:text-base">
              <CheckCircle2 aria-hidden="true" size={18} />
              Filled
            </div>
            <p className="mt-1.5 text-3xl font-semibold text-emerald-700 sm:text-4xl">{recordedSlotCount}</p>
          </div>
          <div className="survey-card survey-stat rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 sm:text-base">
              <CircleDashed aria-hidden="true" size={18} />
              Rate
            </div>
            <p className="mt-1.5 text-3xl font-semibold text-sky-700 sm:text-4xl">{completionRate}%</p>
          </div>
        </div>
      </header>

      <div className="survey-divider flex flex-wrap items-center justify-between gap-3 border-y border-zinc-200 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="survey-control flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, -1))}
            title="이전 날짜"
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <div className="survey-control flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-700">
            <CalendarDays aria-hidden="true" size={18} />
            {formatDisplayDate(selectedDate)}
          </div>
          <button
            className="survey-control flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={isToday}
            onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, 1))}
            title="다음 날짜"
            type="button"
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          {!isToday ? (
            <button
              className="survey-control min-h-11 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
              onClick={() => setSelectedDate(todayDate)}
              type="button"
            >
              오늘
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-semibold",
              syncStatus.status === "saved" &&
                "border-emerald-200 bg-emerald-50 text-emerald-700",
              syncStatus.status === "saving" && "border-sky-200 bg-sky-50 text-sky-700",
              syncStatus.status === "error" && "border-red-200 bg-red-50 text-red-700",
              syncStatus.status === "local-only" &&
                "border-zinc-200 bg-zinc-50 text-zinc-600",
            )}
          >
            {syncStatus.message}
          </span>
          <p className="text-base text-zinc-500">입력칸에서 나오면 자동 저장됩니다.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-stretch">
          <DailyReflection
            dailyLog={dailyLog}
            key={`${dailyLog.id}-${dailyLog.updatedAt}`}
            onUpdateLog={updateDailyLog}
          />
          <DailyImagePanel />
        </div>
        <FixedDailyActions
          actions={actions}
          dateKey={selectedDate}
          onUpdateSlot={updateSlot}
        />
      </div>
    </div>
  );
}
