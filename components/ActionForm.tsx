"use client";

import { FormEvent, useState } from "react";
import { Dumbbell, PenLine, Plus, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { actionCategories, categoryMeta, type ActionCategory } from "@/types/daily-action";

const categoryIcons = {
  diet_fitness: Dumbbell,
  vibe_coding: Sparkles,
  writing: PenLine,
};

type ActionFormProps = {
  onAddAction: (input: {
    category: ActionCategory;
    title: string;
    description: string;
  }) => void;
};

export function ActionForm({ onAddAction }: ActionFormProps) {
  const [category, setCategory] = useState<ActionCategory>("diet_fitness");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onAddAction({
      category,
      title: title.trim(),
      description: description.trim(),
    });

    setTitle("");
    setDescription("");
  }

  return (
    <form
      className="survey-card survey-card-strong flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">새 행동 추가</h2>
          <p className="mt-1.5 text-base text-zinc-500">오늘 실행한 행동을 크게 적어둡니다.</p>
        </div>
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white transition hover:bg-zinc-800"
          title="행동 추가"
          type="submit"
        >
          <Plus aria-hidden="true" size={23} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {actionCategories.map((item) => {
          const Icon = categoryIcons[item];
          const isSelected = category === item;

          return (
            <button
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition",
                isSelected
                  ? "survey-chip-active border-zinc-950 bg-zinc-950 text-white"
                  : "survey-chip border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
              )}
              key={item}
              onClick={() => setCategory(item)}
              title={categoryMeta[item].label}
              type="button"
            >
              <Icon aria-hidden="true" size={19} />
              <span>{categoryMeta[item].shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="grid flex-1 gap-5">
        <label className="grid gap-2 text-base font-semibold text-zinc-700">
          행동
          <input
            className="survey-control h-16 rounded-md border border-zinc-200 bg-zinc-50 px-4 text-xl text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="오늘 실행한 행동"
            value={title}
          />
        </label>
        <label className="grid gap-2 text-base font-semibold text-zinc-700">
          메모
          <textarea
            className="survey-control min-h-36 flex-1 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-lg leading-8 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="상황, 이유, 다음에 이어갈 점"
            value={description}
          />
        </label>
      </div>
    </form>
  );
}
