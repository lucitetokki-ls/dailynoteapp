"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ExpandableText } from "@/components/ExpandableText";
import { useStoredDays } from "@/lib/daily-store";
import { calculateCompletionRate } from "@/lib/score";
import { cn, formatDisplayDate } from "@/lib/utils";
import {
  actionCategories,
  categoryMeta,
  statusMeta,
  type ActionCategory,
  type ActionStatus,
} from "@/types/daily-action";

const statusIcons = {
  done: CheckCircle2,
  partial: CircleDashed,
  skipped: XCircle,
};

export function CategoryHistory() {
  const days = useStoredDays();
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>("diet_fitness");

  const categoryActions = useMemo(() => {
    return days
      .flatMap((day) =>
        day.actions.map((action) => ({
          ...action,
          date: day.dailyLog.date,
        })),
      )
      .filter((action) => action.category === selectedCategory)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [days, selectedCategory]);

  const completionRate = calculateCompletionRate(categoryActions);

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero grid gap-5">
        <div className="max-w-5xl text-left">
          <p className="survey-kicker">카테고리 기록</p>
          <h1 className="survey-title mt-3 text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
            카테고리별 행동 히스토리
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
            각 영역에서 어떤 행동을 이어왔는지 확인합니다.
          </p>
        </div>

        <div className="category-stat-card survey-card survey-stat rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <p className="text-base font-semibold text-zinc-500">
            {categoryMeta[selectedCategory].label}
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <p className="text-3xl font-semibold text-zinc-950 sm:text-4xl">{categoryActions.length}</p>
            <span className="category-rate-badge survey-chip rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-lg font-semibold text-zinc-700">
              {completionRate}%
            </span>
          </div>
        </div>
      </header>

      <div className="category-tabs grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {actionCategories.map((category) => (
          <button
            className={cn(
              "min-h-14 rounded-md border px-3 text-base font-semibold transition",
              selectedCategory === category
                ? "survey-chip-active border-zinc-950 bg-zinc-950 text-zinc-950"
                : "survey-chip border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
            )}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {categoryMeta[category].shortLabel}
          </button>
        ))}
      </div>

      <section className="history-list grid">
        {categoryActions.length > 0 ? (
          categoryActions.map((action) => {
            const StatusIcon = statusIcons[action.status as ActionStatus];

            return (
              <article
                className="survey-card survey-list-row history-row grid gap-4 border border-zinc-200 bg-white p-4 lg:grid-cols-[180px_minmax(0,1fr)_130px]"
                key={action.id}
              >
                <div>
                  <p className="text-base font-semibold text-zinc-950">
                    {formatDisplayDate(action.date)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">만족도 {action.satisfaction}/5</p>
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-zinc-950">
                    {action.title}
                  </h2>
                  <ExpandableText
                    className="mt-1.5"
                    fallback="메모가 비어 있습니다."
                    previewLines={2}
                    text={[action.description, action.reflection].filter(Boolean).join("\n\n")}
                    title={`${formatDisplayDate(action.date)} · ${action.title}`}
                  />
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <span className="survey-chip flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-semibold text-zinc-700">
                    <StatusIcon aria-hidden="true" size={17} />
                    {statusMeta[action.status].label}
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            title="아직 기록 없음"
            description="선택한 카테고리에 저장된 행동이 없습니다."
          />
        )}
      </section>
    </div>
  );
}
