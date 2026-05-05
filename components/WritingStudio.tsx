"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";

import { updateStoredDay, useStoredDay, useSupabaseSyncStatus } from "@/lib/daily-store";
import { getActionForSlot } from "@/lib/slot-metrics";
import {
  addDaysToDateKey,
  cn,
  createId,
  formatDisplayDate,
  getTodayDateKey,
} from "@/lib/utils";
import { slotMeta } from "@/types/daily-action";

const writingSlot = "writing";

export function WritingStudio() {
  const [todayDate] = useState(() => getTodayDateKey());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const { actions } = useStoredDay(selectedDate);
  const syncStatus = useSupabaseSyncStatus(selectedDate);
  const writingAction = useMemo(() => getActionForSlot(actions, writingSlot), [actions]);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isToday = selectedDate === todayDate;

  function saveWriting(nextText = editorRef.current?.value ?? "") {
    const now = new Date().toISOString();
    const writingMeta = slotMeta[writingSlot];

    updateStoredDay(selectedDate, (currentDay) => {
      const existingAction = getActionForSlot(currentDay.actions, writingSlot);
      const log = {
        ...currentDay.dailyLog,
        updatedAt: now,
      };

      if (!existingAction) {
        return {
          dailyLog: log,
          actions: [
            {
              id: createId(),
              dailyLogId: log.id,
              slot: writingSlot,
              category: writingMeta.category,
              title: writingMeta.label,
              description: nextText,
              status: "done",
              satisfaction: 3,
              reflection: "",
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
                slot: writingSlot,
                category: writingMeta.category,
                title: writingMeta.label,
                description: nextText,
                status: "done",
                updatedAt: now,
              }
            : action,
        ),
      };
    });

    setHasUnsavedChanges(false);
  }

  return (
    <div className="grid gap-5 pb-10 sm:gap-6 sm:pb-12">
      <section className="survey-hero grid gap-4">
        <div className="text-left">
          <p className="survey-kicker">Writing</p>
          <h1 className="survey-title mt-3 text-4xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
            1일 1작문
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600 sm:text-xl sm:leading-8">
            하루에 하나의 글을 남기는 전용 작성 공간입니다.
          </p>
        </div>
      </section>

      <section className="survey-card grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
                hasUnsavedChanges && "border-amber-200 bg-amber-50 text-amber-700",
                !hasUnsavedChanges &&
                  syncStatus.status === "saved" &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                !hasUnsavedChanges &&
                  syncStatus.status === "saving" &&
                  "border-sky-200 bg-sky-50 text-sky-700",
                !hasUnsavedChanges &&
                  syncStatus.status === "error" &&
                  "border-red-200 bg-red-50 text-red-700",
                !hasUnsavedChanges &&
                  syncStatus.status === "local-only" &&
                  "border-zinc-200 bg-zinc-50 text-zinc-600",
              )}
            >
              {hasUnsavedChanges ? "저장 전" : syncStatus.message}
            </span>
            <button
              className="survey-control flex min-h-11 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950"
              onClick={() => saveWriting()}
              type="button"
            >
              <Save aria-hidden="true" size={18} />
              저장
            </button>
          </div>
        </div>

        <textarea
          className="survey-control min-h-[62dvh] w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-4 text-lg leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:min-h-[64dvh] sm:px-5 sm:py-5 sm:text-xl sm:leading-9"
          defaultValue={writingAction?.description ?? ""}
          key={`${selectedDate}-${writingAction?.id ?? "empty"}-${writingAction?.updatedAt ?? "new"}`}
          onBlur={(event) => saveWriting(event.currentTarget.value)}
          onChange={() => setHasUnsavedChanges(true)}
          placeholder="오늘의 작문을 여기에 작성하세요."
          ref={editorRef}
        />
      </section>
    </div>
  );
}
