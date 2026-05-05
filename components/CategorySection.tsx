"use client";

import { Dumbbell, PenLine, Sparkles } from "lucide-react";

import { ActionCard } from "@/components/ActionCard";
import { actionCategories, categoryMeta, type DailyAction } from "@/types/daily-action";

const categoryIcons = {
  diet_fitness: Dumbbell,
  vibe_coding: Sparkles,
  writing: PenLine,
};

type CategorySectionProps = {
  actions: DailyAction[];
  onDeleteAction: (id: string) => void;
  onUpdateAction: (id: string, updates: Partial<DailyAction>) => void;
};

export function CategorySection({
  actions,
  onDeleteAction,
  onUpdateAction,
}: CategorySectionProps) {
  return (
    <div className="grid gap-8">
      {actionCategories.map((category) => {
        const Icon = categoryIcons[category];
        const categoryActions = actions.filter((action) => action.category === category);

        return (
          <section className="grid gap-4" key={category}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="survey-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700">
                  <Icon aria-hidden="true" size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-zinc-950">
                    {categoryMeta[category].label}
                  </h2>
                  <p className="truncate text-base text-zinc-500">
                    {categoryMeta[category].description}
                  </p>
                </div>
              </div>
              <span className="survey-chip rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
                {categoryActions.length}
              </span>
            </div>

            {categoryActions.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {categoryActions.map((action) => (
                  <ActionCard
                    action={action}
                    key={`${action.id}-${action.updatedAt}`}
                    onDelete={onDeleteAction}
                    onUpdate={onUpdateAction}
                  />
                ))}
              </div>
            ) : (
              <div className="survey-card rounded-lg border border-dashed border-zinc-300 bg-white/70 p-6 text-base text-zinc-500">
                아직 기록된 행동이 없습니다.
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
