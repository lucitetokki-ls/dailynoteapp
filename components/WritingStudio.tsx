"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";

import {
  addDaysToDateKey,
  cn,
  formatDisplayDate,
  getTodayDateKey,
} from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { ExpandableText } from "@/components/ExpandableText";
import {
  useWritingEntries,
  useWritingEntry,
  useWritingSyncStatus,
  writeWritingEntry,
} from "@/lib/writing-store";

export function WritingStudio() {
  const [todayDate] = useState(() => getTodayDateKey());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const writingEntry = useWritingEntry(selectedDate);
  const writingEntries = useWritingEntries();
  const syncStatus = useWritingSyncStatus(selectedDate);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isToday = selectedDate === todayDate;
  const recentEntries = writingEntries.filter((entry) => entry.content.trim()).slice(0, 6);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function saveWriting(nextText = editorRef.current?.value ?? "") {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    writeWritingEntry(selectedDate, nextText);
    setHasUnsavedChanges(false);
  }

  function scheduleWritingSave(nextText: string) {
    setHasUnsavedChanges(true);

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      writeWritingEntry(selectedDate, nextText);
      setHasUnsavedChanges(false);
      saveTimerRef.current = null;
    }, 1100);
  }

  return (
    <div className="writing-studio grid gap-5 pb-9 sm:gap-6 sm:pb-12">
      <section className="survey-hero grid gap-4">
        <div className="text-left">
          <p className="survey-kicker">Writing</p>
          <h1 className="survey-title mt-2.5 text-4xl font-semibold leading-tight text-zinc-950 sm:mt-3 sm:text-6xl">
            1일 1작문
          </h1>
          <p className="mt-2.5 max-w-3xl text-[0.95rem] leading-7 text-zinc-600 sm:mt-3 sm:text-xl sm:leading-8">
            하루에 하나의 긴 글을 남기는 전용 작성 공간입니다.
          </p>
        </div>
      </section>

      <section className="survey-card grid gap-3.5 rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm sm:gap-4 sm:p-5">
        <div className="writing-toolbar flex min-w-0 flex-wrap items-center justify-between gap-3">
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

          <div className="writing-save-cluster flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <span
              className={cn(
                "sync-status-pill rounded-md border px-2.5 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm",
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
              {hasUnsavedChanges ? "입력 중" : syncStatus.message}
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
          aria-label={`${formatDisplayDate(selectedDate)} 작문 입력`}
          className="survey-control writing-editor min-h-[26rem] w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3.5 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:min-h-[34rem] sm:px-5 sm:py-5 sm:text-xl sm:leading-9"
          defaultValue={writingEntry.content}
          key={`${selectedDate}-${writingEntry.updatedAt}`}
          onBlur={(event) => saveWriting(event.currentTarget.value)}
          onChange={(event) => scheduleWritingSave(event.currentTarget.value)}
          placeholder="오늘의 작문을 여기에 작성하세요."
          ref={editorRef}
        />
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-950">최근 작문</h2>
          <span className="survey-chip rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            {recentEntries.length}
          </span>
        </div>

        {recentEntries.length > 0 ? (
          <div className="grid gap-3">
            {recentEntries.map((entry) => (
              <article
                className="survey-card survey-list-row grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:p-5"
                key={entry.id}
              >
                <button
                  className="survey-chip w-fit rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-base font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() => setSelectedDate(entry.date)}
                  type="button"
                >
                  {formatDisplayDate(entry.date)}
                </button>
                <ExpandableText
                  fallback="작문 내용이 비어 있습니다."
                  previewLines={2}
                  text={entry.content}
                  title={`${formatDisplayDate(entry.date)} · 1일 1작문`}
                />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 저장된 작문 없음"
            description="첫 작문을 저장하면 최근 목록에서 바로 다시 열 수 있습니다."
          />
        )}
      </section>
    </div>
  );
}
