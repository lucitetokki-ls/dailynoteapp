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

import { DailyImagePanel } from "@/components/DailyImagePanel";
import { DailyReflection } from "@/components/DailyReflection";
import { FixedDailyActions } from "@/components/FixedDailyActions";
import { SyncToast } from "@/components/SyncToast";
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
    <div className="today-page grid gap-5 pb-9 sm:gap-8 sm:pb-12">
      <SyncToast syncStatus={syncStatus} />
      <header className="survey-hero today-hero grid gap-4 sm:gap-5">
        <div className="max-w-5xl pt-1 text-left">
          <p className="survey-kicker">Lucitetokki Daily Action Log</p>
          <h1 className="survey-title mt-2.5 text-4xl font-semibold leading-tight text-zinc-950 sm:mt-3 sm:text-6xl lg:text-7xl">
            苟日新, 日日新, 又日新
          </h1>
          <p className="mt-2.5 max-w-4xl text-[0.95rem] leading-7 text-zinc-600 sm:mt-4 sm:text-xl sm:leading-8">
            진실로 날로 새로워지려면, 날마다 새로워지고 또 새로워져야 한다
          </p>
        </div>

        <div className="today-stat-grid grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))] gap-2 sm:gap-3">
          <StatCard icon={Target} label="Slots" value={dailyActionSlots.length.toString()} />
          <StatCard icon={CheckCircle2} label="Filled" value={recordedSlotCount.toString()} />
          <StatCard icon={CircleDashed} label="Rate" value={`${completionRate}%`} accent />
        </div>
      </header>

      <div className="survey-divider mobile-date-sync-panel grid gap-3 border-y border-zinc-200 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:py-4">
        <div className="mobile-date-bar flex min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          <button
            className="survey-control flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
            data-tooltip="이전 날짜"
            onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, -1))}
            title="이전 날짜"
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <div className="survey-control mobile-date-label flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-700">
            <CalendarDays aria-hidden="true" size={18} />
            {formatDisplayDate(selectedDate)}
          </div>
          <button
            className="survey-control flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            data-tooltip="다음 날짜"
            disabled={isToday}
            onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, 1))}
            title="다음 날짜"
            type="button"
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          {!isToday ? (
            <button
              className="survey-control col-span-3 min-h-11 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:col-auto"
              onClick={() => setSelectedDate(todayDate)}
              type="button"
            >
              오늘
            </button>
          ) : null}
        </div>
        <div className="mobile-sync-row sync-status-cluster flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
          <span
            className={cn(
              "sync-status-pill rounded-md border px-3 py-1.5 text-sm font-semibold",
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
          <p className="w-full min-w-0 flex-none text-sm leading-6 text-zinc-500 sm:w-auto sm:text-base">
            입력은 자동 저장됩니다. 오류가 나면 로컬 기록은 유지됩니다.
          </p>
        </div>
      </div>

      <div className="mobile-today-grid grid gap-5 sm:gap-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-stretch">
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

type StatCardProps = {
  icon: React.ComponentType<{ "aria-hidden": true; size: number }>;
  label: string;
  value: string;
  accent?: boolean;
};

function StatCard({ icon: Icon, label, value, accent = false }: StatCardProps) {
  return (
    <div className="today-stat-card survey-card survey-stat min-w-0 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm sm:p-3">
      <div className="flex items-center gap-1 text-[0.7rem] font-semibold text-zinc-500 sm:gap-2 sm:text-base">
        <Icon aria-hidden={true} size={16} />
        {label}
      </div>
      <p className={cn("mt-1.5 text-2xl font-semibold sm:text-4xl", accent ? "text-sky-700" : "text-zinc-950")}>
        {value}
      </p>
    </div>
  );
}
