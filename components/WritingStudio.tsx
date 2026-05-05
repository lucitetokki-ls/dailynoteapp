"use client";

import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";

import {
  addDaysToDateKey,
  cn,
  formatDisplayDate,
  getTodayDateKey,
} from "@/lib/utils";
import { useWritingEntry, useWritingSyncStatus, writeWritingEntry } from "@/lib/writing-store";

export function WritingStudio() {
  const [todayDate] = useState(() => getTodayDateKey());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const writingEntry = useWritingEntry(selectedDate);
  const syncStatus = useWritingSyncStatus(selectedDate);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isToday = selectedDate === todayDate;

  function saveWriting(nextText = editorRef.current?.value ?? "") {
    writeWritingEntry(selectedDate, nextText);
    setHasUnsavedChanges(false);
  }

  return (
    <div className="grid gap-5 pb-9 sm:gap-6 sm:pb-12">
      <section className="survey-hero grid gap-4">
        <div className="text-left">
          <p className="survey-kicker">Writing</p>
          <h1 className="survey-title mt-2.5 text-4xl font-semibold leading-tight text-zinc-950 sm:mt-3 sm:text-6xl">
            1일 1작문
          </h1>
          <p className="mt-2.5 max-w-3xl text-[0.95rem] leading-7 text-zinc-600 sm:mt-3 sm:text-xl sm:leading-8">
            하루에 하나의 글을 남기는 전용 작성 공간입니다.
          </p>
        </div>
      </section>

      <section className="survey-card grid gap-3.5 rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:h-11 sm:w-11"
              onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, -1))}
              title="이전 날짜"
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <div className="survey-control flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 sm:min-h-11 sm:px-4 sm:text-base">
              <CalendarDays aria-hidden="true" size={18} />
              {formatDisplayDate(selectedDate)}
            </div>
            <button
              className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
              disabled={isToday}
              onClick={() => setSelectedDate((currentDate) => addDaysToDateKey(currentDate, 1))}
              title="다음 날짜"
              type="button"
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
            {!isToday ? (
              <button
                className="survey-control min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:min-h-11 sm:px-4 sm:text-base"
                onClick={() => setSelectedDate(todayDate)}
                type="button"
              >
                오늘
              </button>
            ) : null}
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <span
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm",
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
              className="survey-control flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 sm:min-h-11 sm:px-4 sm:text-base"
              onClick={() => saveWriting()}
              type="button"
            >
              <Save aria-hidden="true" size={18} />
              저장
            </button>
          </div>
        </div>

        <textarea
          className="survey-control min-h-[58dvh] w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3.5 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:min-h-[64dvh] sm:px-5 sm:py-5 sm:text-xl sm:leading-9"
          defaultValue={writingEntry.content}
          key={`${selectedDate}-${writingEntry.updatedAt}`}
          onBlur={(event) => saveWriting(event.currentTarget.value)}
          onChange={() => setHasUnsavedChanges(true)}
          placeholder="오늘의 작문을 여기에 작성하세요."
          ref={editorRef}
        />
      </section>
    </div>
  );
}
