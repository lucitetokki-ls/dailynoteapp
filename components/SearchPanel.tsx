"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ActionDialogTrigger } from "@/components/ActionDialogTrigger";
import { EmptyState } from "@/components/EmptyState";
import { useStoredDays } from "@/lib/daily-store";
import { cn, formatDisplayDate } from "@/lib/utils";
import {
  actionCategories,
  categoryMeta,
  statusMeta,
  type ActionCategory,
} from "@/types/daily-action";

type CategoryFilter = "all" | ActionCategory;

export function SearchPanel() {
  const days = useStoredDays();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return days
      .flatMap((day) =>
        day.actions.map((action) => ({
          ...action,
          date: day.dailyLog.date,
          dailyReflection: day.dailyLog.dailyReflection,
        })),
      )
      .filter((action) => {
        const matchesCategory = category === "all" || action.category === category;
        const haystack = [
          action.title,
          action.description,
          action.reflection,
          action.dailyReflection,
          categoryMeta[action.category].label,
          statusMeta[action.status].label,
        ]
          .join(" ")
          .toLowerCase();

        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
      })
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }, [category, days, query]);

  return (
    <div className="search-panel grid gap-8 pb-12">
      <header className="survey-hero">
        <p className="survey-kicker">기록 검색</p>
        <h1 className="survey-title mt-3 max-w-5xl text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
          행동 기록 검색
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
          행동 내용, 짧은 회고, 오늘 회고를 한 번에 찾아봅니다.
        </p>
      </header>

      <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="grid gap-2 text-base font-semibold text-zinc-700">
          검색어
          <div className="survey-control flex h-14 items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 focus-within:border-zinc-400 focus-within:bg-white">
            <Search aria-hidden="true" className="shrink-0 text-zinc-400" size={20} />
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-lg text-zinc-950 outline-none placeholder:text-zinc-400"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="식단, 운동, 작문, 정리, 관계, 회고"
              value={query}
            />
          </div>
        </label>

        <div className="search-filter-grid mt-5">
          <FilterGroup
            activeValue={category}
            items={[
              { label: "전체", value: "all" },
              ...actionCategories.map((item) => ({
                label: categoryMeta[item].shortLabel,
                value: item,
              })),
            ]}
            onChange={(value) => setCategory(value as CategoryFilter)}
          />
        </div>
      </section>

      <section className="search-results-section grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-950">검색 결과</h2>
          <span className="survey-chip rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            {results.length}
          </span>
        </div>

        {results.length > 0 ? (
          <div className="history-list grid">
            {results.map((action) => (
              <article
                className="survey-card survey-list-row history-row grid gap-4 border border-zinc-200 bg-white p-4 lg:grid-cols-[180px_minmax(0,1fr)_150px]"
                key={action.id}
              >
                <div>
                  <p className="text-base font-semibold text-zinc-950">
                    {formatDisplayDate(action.date)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {categoryMeta[action.category].label}
                  </p>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-zinc-950">{action.title}</h3>
                  <ActionDialogTrigger
                    action={action}
                    className="mt-1 block text-left"
                    date={action.date}
                    fallback="메모가 비어 있습니다."
                    title={`${formatDisplayDate(action.date)} · ${action.title}`}
                  >
                    <p
                      className="line-clamp-2 whitespace-pre-line text-sm leading-6 text-zinc-500"
                      title={[action.description, action.reflection].filter(Boolean).join("\n\n")}
                    >
                      {[action.description, action.reflection].filter(Boolean).join("\n\n") ||
                        "메모가 비어 있습니다."}
                    </p>
                  </ActionDialogTrigger>
                </div>
                <div className="flex items-center justify-start lg:justify-end">
                  <span className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-700">
                    {statusMeta[action.status].label} · {action.satisfaction}/5
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="검색 결과 없음"
            description="검색어와 카테고리를 조금 넓혀서 다시 확인하세요."
          />
        )}
      </section>
    </div>
  );
}

type FilterGroupProps = {
  activeValue: string;
  items: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
};

function FilterGroup({ activeValue, items, onChange }: FilterGroupProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <button
          className={cn(
            "min-h-12 rounded-md border px-2 text-sm font-semibold transition",
            activeValue === item.value
              ? "survey-chip-active border-zinc-950 bg-zinc-950 text-white"
              : "survey-chip border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
          )}
          key={item.value}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
