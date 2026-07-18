"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";

import {
  addDaysToDateKey,
  formatDisplayDate,
  getTodayDateKey,
} from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import {
  RichWritingEditor,
  type RichWritingChange,
} from "@/components/RichWritingEditor";
import { WritingEntryDialog } from "@/components/WritingEntryDialog";
import {
  readWritingEntry,
  loadWritingEntry,
  useRecentWritingEntries,
  useWritingEntry,
  useWritingSyncStatus,
  writeWritingEntry,
  type WritingEntryDraft,
} from "@/lib/writing-store";
import type { WritingEntry } from "@/types/writing-entry";

type WritingStudioDraft = RichWritingChange & Required<Pick<WritingEntryDraft, "title">>;

function createDraftFromEntry(entry: WritingEntry): WritingStudioDraft {
  const contentMarkdown = getEntryContent(entry);

  return {
    title: entry.title,
    content: contentMarkdown,
    contentJson: entry.contentJson ?? null,
    contentMarkdown,
  };
}

function getEntryContent(entry: WritingEntry) {
  return entry.contentMarkdown?.trim() ? entry.contentMarkdown : entry.content;
}

function hasEntryContent(entry: WritingEntry) {
  return (
    entry.title.trim().length > 0 ||
    Boolean(entry.contentJson) ||
    getEntryContent(entry).trim().length > 0
  );
}

export function WritingStudio() {
  const [todayDate] = useState(() => getTodayDateKey());
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const writingEntry = useWritingEntry(selectedDate);
  const writingEntries = useRecentWritingEntries(6);
  const syncStatus = useWritingSyncStatus(selectedDate);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{ date: string; draft: WritingStudioDraft } | null>(null);
  const writingEntryRef = useRef(writingEntry);
  const [draft, setDraft] = useState(() => createDraftFromEntry(writingEntry));
  const [previewEntry, setPreviewEntry] = useState<WritingEntry | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isToday = selectedDate === todayDate;
  const writingSourceKey = `${selectedDate}:${writingEntry.updatedAt}`;
  const recentEntries = writingEntries.filter(hasEntryContent);
  const writingStats = useMemo(() => {
    const contentMarkdown = draft.contentMarkdown;
    const plainText = contentMarkdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#>*_\-[\]()]/g, " ")
      .trim();

    return {
      characters: contentMarkdown.length,
      lines: contentMarkdown.length > 0 ? contentMarkdown.split(/\r\n|\r|\n/).length : 0,
      words: plainText ? plainText.split(/\s+/).length : 0,
    };
  }, [draft]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      const pendingSave = pendingSaveRef.current;

      if (pendingSave) {
        writeWritingEntry(pendingSave.date, pendingSave.draft);
      }
    };
  }, []);

  useEffect(() => {
    writingEntryRef.current = writingEntry;
  });

  useEffect(() => {
    if (pendingSaveRef.current?.date === selectedDate) {
      return;
    }

    setDraft(createDraftFromEntry(writingEntryRef.current));
    setHasUnsavedChanges(false);
  }, [selectedDate, writingSourceKey]);

  function flushPendingWriting() {
    const pendingSave = pendingSaveRef.current;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!pendingSave) {
      return;
    }

    writeWritingEntry(pendingSave.date, pendingSave.draft);
    pendingSaveRef.current = null;
    setHasUnsavedChanges(false);
  }

  function saveWriting(nextDraft = draft) {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    writeWritingEntry(selectedDate, nextDraft);
    pendingSaveRef.current = null;
    setHasUnsavedChanges(false);
  }

  function scheduleWritingSave(nextDraft: WritingStudioDraft) {
    setDraft(nextDraft);
    setHasUnsavedChanges(true);
    pendingSaveRef.current = {
      date: selectedDate,
      draft: nextDraft,
    };

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      const pendingSave = pendingSaveRef.current;

      if (pendingSave) {
        writeWritingEntry(pendingSave.date, pendingSave.draft);
      }

      pendingSaveRef.current = null;
      setHasUnsavedChanges(false);
      saveTimerRef.current = null;
    }, 1100);
  }

  function scheduleTitleSave(title: string) {
    scheduleWritingSave({
      ...draft,
      title,
    });
  }

  function scheduleContentSave(nextContent: RichWritingChange) {
    scheduleWritingSave({
      ...nextContent,
      title: draft.title,
    });
  }

  function selectDate(nextDate: string) {
    flushPendingWriting();
    setDraft(createDraftFromEntry(readWritingEntry(nextDate)));
    setHasUnsavedChanges(false);
    setSelectedDate(nextDate);
  }

  function shiftSelectedDate(amount: number) {
    selectDate(addDaysToDateKey(selectedDate, amount));
  }

  const closePreview = useCallback(() => setPreviewEntry(null), []);

  return (
    <div className="writing-studio grid gap-5 pb-9 sm:gap-6 sm:pb-12">
      <section className="survey-hero grid gap-4">
        <div className="text-left">
          <p className="survey-kicker">작문</p>
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
              aria-label="이전 날짜"
              className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:h-11 sm:w-11"
              onClick={() => shiftSelectedDate(-1)}
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
              aria-label="다음 날짜"
              className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11"
              disabled={isToday}
              onClick={() => shiftSelectedDate(1)}
              title="다음 날짜"
              type="button"
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
            {!isToday ? (
              <button
                className="survey-control min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:min-h-11 sm:px-4 sm:text-base"
                onClick={() => selectDate(todayDate)}
                type="button"
              >
                오늘
              </button>
            ) : null}
          </div>

          <div className="writing-save-cluster flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
            <SaveStatusIndicator
              status={hasUnsavedChanges ? "editing" : syncStatus.status}
              updatedAt={syncStatus.updatedAt}
            />
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

        <div className="writing-stat-strip" aria-label="작문 통계">
          <span className="tabular-nums">{writingStats.characters}자</span>
          <span className="tabular-nums">{writingStats.words}단어</span>
          <span className="tabular-nums">{writingStats.lines}줄</span>
          <span>서식 편집</span>
        </div>

        <label className="writing-title-field grid gap-2" htmlFor="writing-title">
          <span className="survey-kicker">제목</span>
          <input
            className="survey-control writing-title-input min-h-12 w-full border border-zinc-200 bg-white px-3.5 text-xl font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 sm:min-h-14 sm:px-4 sm:text-2xl"
            id="writing-title"
            maxLength={120}
            onBlur={flushPendingWriting}
            onChange={(event) => scheduleTitleSave(event.currentTarget.value)}
            placeholder="작문 제목을 입력하세요"
            type="text"
            value={draft.title}
          />
        </label>

        <RichWritingEditor
          ariaLabel={`${formatDisplayDate(selectedDate)} 리치 작문 입력`}
          contentJson={draft.contentJson}
          fallbackMarkdown={draft.contentMarkdown || draft.content}
          key={selectedDate}
          onBlur={flushPendingWriting}
          onChange={scheduleContentSave}
          sourceKey={writingSourceKey}
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
          <div className="writing-recent-list divide-y divide-zinc-200 border border-zinc-200 bg-white">
            {recentEntries.map((entry) => (
              <button
                aria-label={`${entry.title.trim() || "제목 없는 작문"} 전체 글 보기`}
                className="writing-recent-title survey-control flex min-h-14 w-full items-center px-4 py-3 text-left text-base font-semibold text-zinc-900 transition hover:bg-zinc-50 focus-visible:bg-zinc-50 sm:min-h-16 sm:px-5 sm:text-lg"
                key={entry.id}
                onClick={() => {
                  void loadWritingEntry(entry.date).then(setPreviewEntry);
                }}
                type="button"
              >
                {entry.title.trim() || "제목 없는 작문"}
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 저장된 작문 없음"
            description="첫 작문을 저장하면 최근 목록에서 바로 다시 열 수 있습니다."
          />
        )}
      </section>

      <WritingEntryDialog entry={previewEntry} onClose={closePreview} />
    </div>
  );
}
