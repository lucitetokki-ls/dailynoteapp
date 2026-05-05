"use client";

import { useState } from "react";
import {
  Check,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  actionCategories,
  categoryMeta,
  type ActionCategory,
  type DailyAction,
} from "@/types/daily-action";

type ActionCardProps = {
  action: DailyAction;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DailyAction>) => void;
};

export function ActionCard({ action, onDelete, onUpdate }: ActionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCategory, setDraftCategory] = useState<ActionCategory>(action.category);
  const [draftTitle, setDraftTitle] = useState(action.title);
  const [draftDescription, setDraftDescription] = useState(action.description);
  const [isReflectionEditing, setIsReflectionEditing] = useState(
    action.reflection.trim().length === 0,
  );
  const [draftReflection, setDraftReflection] = useState(action.reflection);

  function resetDraft() {
    setDraftCategory(action.category);
    setDraftTitle(action.title);
    setDraftDescription(action.description);
  }

  function handleSave() {
    if (!draftTitle.trim()) {
      return;
    }

    onUpdate(action.id, {
      category: draftCategory,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
    });
    setIsEditing(false);
  }

  function handleReflectionSave() {
    onUpdate(action.id, {
      reflection: draftReflection.trim(),
    });
    setIsReflectionEditing(false);
  }

  return (
    <article className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {isEditing ? (
          <div className="grid min-w-0 flex-1 gap-3">
            <div className="grid grid-cols-3 gap-2">
              {actionCategories.map((category) => (
                <button
                  className={cn(
                    "min-h-10 rounded-md border px-2 text-sm font-semibold transition",
                    draftCategory === category
                      ? "survey-chip-active border-zinc-950 bg-zinc-950 text-white"
                      : "survey-chip border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
                  )}
                  key={category}
                  onClick={() => setDraftCategory(category)}
                  type="button"
                >
                  {categoryMeta[category].shortLabel}
                </button>
              ))}
            </div>
            <input
              className="survey-control h-12 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-lg font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="행동 제목"
              value={draftTitle}
            />
            <input
              className="survey-control h-11 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
              onChange={(event) => setDraftDescription(event.target.value)}
              placeholder="메모"
              value={draftDescription}
            />
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-zinc-950">{action.title}</h3>
            {action.description ? (
              <p className="mt-1.5 text-base leading-7 text-zinc-500">{action.description}</p>
            ) : null}
          </div>
        )}

        <div className="flex shrink-0 gap-1">
          {isEditing ? (
            <>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
                onClick={handleSave}
                title="저장"
                type="button"
              >
                <Check aria-hidden="true" size={18} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => {
                  resetDraft();
                  setIsEditing(false);
                }}
                title="취소"
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => setIsEditing(true)}
                title="수정"
                type="button"
              >
                <Pencil aria-hidden="true" size={18} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => onDelete(action.id)}
                title="삭제"
                type="button"
              >
                <Trash2 aria-hidden="true" size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <span className="mr-1 text-base font-semibold text-zinc-600">만족도</span>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border transition",
              score <= action.satisfaction
                ? "border-amber-200 bg-amber-50 text-amber-600"
                : "border-zinc-200 bg-white text-zinc-300 hover:text-zinc-500",
            )}
            key={score}
            onClick={() => onUpdate(action.id, { satisfaction: score })}
            title={`만족도 ${score}`}
            type="button"
          >
            <Star
              aria-hidden="true"
              fill={score <= action.satisfaction ? "currentColor" : "none"}
              size={17}
            />
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-zinc-700">행동 회고</span>
          <div className="flex gap-1">
            {isReflectionEditing ? (
              <>
                <button
                  className="survey-control flex h-9 w-9 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
                  onClick={handleReflectionSave}
                  title="행동 회고 저장"
                  type="button"
                >
                  <Check aria-hidden="true" size={17} />
                </button>
                {action.reflection ? (
                  <button
                    className="survey-control flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                    onClick={() => {
                      setDraftReflection(action.reflection);
                      setIsReflectionEditing(false);
                    }}
                    title="행동 회고 수정 취소"
                    type="button"
                  >
                    <X aria-hidden="true" size={17} />
                  </button>
                ) : null}
              </>
            ) : (
              <button
                className="survey-control flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={() => setIsReflectionEditing(true)}
                title="행동 회고 수정"
                type="button"
              >
                <Pencil aria-hidden="true" size={17} />
              </button>
            )}
          </div>
        </div>

        {isReflectionEditing ? (
          <textarea
            className="survey-control min-h-36 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
            onChange={(event) => setDraftReflection(event.target.value)}
            placeholder="이 행동에서 배운 점, 다음에 이어갈 점"
            value={draftReflection}
          />
        ) : (
          <div className="survey-control min-h-28 whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-7 text-zinc-950">
            {action.reflection}
          </div>
        )}
      </div>
    </article>
  );
}
