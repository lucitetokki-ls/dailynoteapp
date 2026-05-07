"use client";

import { useEffect, useId, useState } from "react";
import { Check, Pencil, Star, Trash2, X } from "lucide-react";

import { deleteStoredAction, updateStoredAction } from "@/lib/daily-store";
import { blockDialogReopen, canOpenDialog, stopDialogEvent } from "@/lib/dialog-guard";
import { cn } from "@/lib/utils";
import type { DailyAction } from "@/types/daily-action";

type ActionDialogTriggerProps = {
  action?: DailyAction;
  ariaLabel?: string;
  children: React.ReactNode;
  className?: string;
  dataFilled?: boolean;
  date: string;
  fallback?: string;
  title: string;
};

export function ActionDialogTrigger({
  action,
  ariaLabel,
  children,
  className,
  dataFilled,
  date,
  fallback = "기록이 비어 있습니다.",
  title,
}: ActionDialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState(action?.description ?? "");
  const [draftReflection, setDraftReflection] = useState(action?.reflection ?? "");
  const [draftSatisfaction, setDraftSatisfaction] = useState(action?.satisfaction ?? 3);
  const titleId = useId();
  const content = [action?.description, action?.reflection].filter(Boolean).join("\n\n").trim();
  const displayText = content || fallback;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        blockDialogReopen();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!action || !content) {
    return (
      <span
        aria-label={ariaLabel}
        className={className}
        data-filled={dataFilled}
        title={fallback}
      >
        {children}
      </span>
    );
  }

  function handleSave() {
    if (!action) {
      return;
    }

    updateStoredAction(date, action.id, {
      description: draftDescription.trim(),
      reflection: draftReflection.trim(),
      satisfaction: draftSatisfaction,
    });
    setIsEditing(false);
  }

  function openDialog() {
    if (!action || !canOpenDialog()) {
      return;
    }

    setDraftDescription(action.description);
    setDraftReflection(action.reflection);
    setDraftSatisfaction(action.satisfaction);
    setIsEditing(false);
    setIsOpen(true);
  }

  function handleDelete() {
    if (!action || !window.confirm("이 행동 기록을 삭제할까요?")) {
      return;
    }

    deleteStoredAction(date, action.id);
    blockDialogReopen();
    setIsOpen(false);
  }

  function closeDialog() {
    blockDialogReopen();
    setIsOpen(false);
  }

  return (
    <>
      <button
        aria-label={ariaLabel ?? `${title} 전문 보기`}
        className={cn("cursor-pointer", className)}
        data-filled={dataFilled}
        data-tooltip="전문 보기"
        onClick={openDialog}
        type="button"
      >
        {children}
      </button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm"
          onClick={closeDialog}
          onPointerDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div
            className="dialog-panel survey-card max-h-[84vh] w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-header flex items-start justify-between gap-4 border-b-2 border-zinc-900/80 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="survey-kicker">{isEditing ? "Edit Log" : "Full Text"}</p>
                <h2
                  className="mt-1 truncate text-xl font-semibold text-zinc-950 sm:text-2xl"
                  id={titleId}
                >
                  {title}
                </h2>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {isEditing ? (
                  <button
                    aria-label="수정 저장"
                    className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-emerald-700 transition hover:bg-emerald-50"
                    data-tooltip="저장"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSave();
                    }}
                    onPointerDown={stopDialogEvent}
                    type="button"
                  >
                    <Check aria-hidden="true" size={18} />
                  </button>
                ) : (
                  <button
                    aria-label="수정"
                    className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                    data-tooltip="수정"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing(true);
                    }}
                    onPointerDown={stopDialogEvent}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                )}
                <button
                  aria-label="삭제"
                  className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 transition hover:bg-red-50"
                  data-tooltip="삭제"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete();
                  }}
                  onPointerDown={stopDialogEvent}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
                <button
                  aria-label="닫기"
                  className="survey-control flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                  data-tooltip="닫기"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeDialog();
                  }}
                  onPointerDown={stopDialogEvent}
                  type="button"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-[64vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {isEditing ? (
                <div className="grid gap-4">
                  <label className="grid gap-2 text-base font-semibold text-zinc-700">
                    행동 내용
                    <textarea
                      className="survey-control min-h-36 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                      onChange={(event) => setDraftDescription(event.target.value)}
                      value={draftDescription}
                    />
                  </label>
                  <label className="grid gap-2 text-base font-semibold text-zinc-700">
                    회고
                    <textarea
                      className="survey-control min-h-32 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                      onChange={(event) => setDraftReflection(event.target.value)}
                      value={draftReflection}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-base font-semibold text-zinc-600">만족도</span>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        aria-label={`만족도 ${score}`}
                        aria-pressed={score <= draftSatisfaction}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md border transition",
                          score <= draftSatisfaction
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : "border-zinc-200 bg-white text-zinc-300 hover:text-zinc-500",
                        )}
                        key={score}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDraftSatisfaction(score);
                        }}
                        onPointerDown={stopDialogEvent}
                        type="button"
                      >
                        <Star
                          aria-hidden="true"
                          fill={score <= draftSatisfaction ? "currentColor" : "none"}
                          size={17}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-base leading-8 text-zinc-700 sm:text-lg">
                  {displayText}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
