"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import type { DailyLog } from "@/types/daily-log";

type DailyReflectionProps = {
  dailyLog: DailyLog;
  onUpdateLog: (updates: Partial<DailyLog>) => void;
};

export function DailyReflection({ dailyLog, onUpdateLog }: DailyReflectionProps) {
  const hasReflection = dailyLog.dailyReflection.trim().length > 0;
  const [isEditing, setIsEditing] = useState(!hasReflection);
  const [draftReflection, setDraftReflection] = useState(dailyLog.dailyReflection);
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dailyLog.updatedAt));

  function handleSave() {
    onUpdateLog({
      dailyMood: dailyLog.dailyMood,
      dailyReflection: draftReflection.trim(),
    });
    setIsEditing(false);
  }

  return (
    <section className="survey-card flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">오늘 회고</h2>
          <p className="mt-1.5 text-base text-zinc-500">작성 후 언제든 다시 수정할 수 있습니다.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasReflection ? (
            <span className="hidden rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 sm:inline">
              저장 {updatedAt}
            </span>
          ) : null}
          {isEditing ? (
            <>
              <button
                className="survey-control flex h-10 w-10 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
                onClick={handleSave}
                title="회고 저장"
                type="button"
              >
                <Check aria-hidden="true" size={18} />
              </button>
              {hasReflection ? (
                <button
                  className="survey-control flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                  onClick={() => {
                    setDraftReflection(dailyLog.dailyReflection);
                    setIsEditing(false);
                  }}
                  title="수정 취소"
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              ) : null}
            </>
          ) : (
            <button
              className="survey-control flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
              onClick={() => setIsEditing(true)}
              title="회고 수정"
              type="button"
            >
              <Pencil aria-hidden="true" size={18} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          className="survey-control min-h-56 flex-1 w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-lg leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:min-h-72"
          onChange={(event) => setDraftReflection(event.target.value)}
          placeholder="오늘의 행동에서 배운 점, 이어갈 점, 고칠 점"
          value={draftReflection}
        />
      ) : (
        <div className="survey-control min-h-56 flex-1 whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-lg leading-8 text-zinc-950 sm:min-h-72">
          {dailyLog.dailyReflection}
        </div>
      )}
    </section>
  );
}
