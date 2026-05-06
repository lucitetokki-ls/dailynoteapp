"use client";

import { useState } from "react";
import { Dumbbell, PenLine, Salad, Sparkles, Star } from "lucide-react";

import { getActionForSlot } from "@/lib/slot-metrics";
import { cn } from "@/lib/utils";
import {
  dailyActionSlots,
  slotMeta,
  type DailyAction,
  type DailyActionSlot,
} from "@/types/daily-action";

const slotIcons = {
  diet: Salad,
  fitness: Dumbbell,
  vibe_coding: Sparkles,
  writing: PenLine,
};

type FixedDailyActionsProps = {
  actions: DailyAction[];
  dateKey: string;
  onUpdateSlot: (slot: DailyActionSlot, updates: Partial<DailyAction>) => void;
};

export function FixedDailyActions({ actions, dateKey, onUpdateSlot }: FixedDailyActionsProps) {
  return (
    <section>
      <div className="grid gap-4 lg:grid-cols-2">
        {dailyActionSlots.map((slot) => {
          const action = getActionForSlot(actions, slot);

          return (
            <FixedDailyActionCard
              action={action}
              key={`${dateKey}-${slot}-${action?.id ?? "empty"}`}
              onUpdateSlot={onUpdateSlot}
              slot={slot}
            />
          );
        })}
      </div>
    </section>
  );
}

type FixedDailyActionCardProps = {
  action?: DailyAction;
  slot: DailyActionSlot;
  onUpdateSlot: (slot: DailyActionSlot, updates: Partial<DailyAction>) => void;
};

function FixedDailyActionCard({ action, slot, onUpdateSlot }: FixedDailyActionCardProps) {
  const Icon = slotIcons[slot];
  const [draft, setDraft] = useState<Partial<DailyAction> | null>(null);
  const description = draft?.description ?? action?.description ?? "";
  const reflection = draft?.reflection ?? action?.reflection ?? "";
  const satisfaction = draft?.satisfaction ?? action?.satisfaction ?? 3;
  const isFilled = Boolean(description.trim() || reflection.trim());

  function saveDraft(nextDescription = description, nextReflection = reflection) {
    onUpdateSlot(slot, {
      description: nextDescription,
      reflection: nextReflection,
      satisfaction,
    });
  }

  function handleDescriptionInput(value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      description: value,
    }));
  }

  function handleReflectionInput(value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      reflection: value,
    }));
  }

  return (
    <article
      className="daily-slot-card survey-card grid grid-rows-[auto_1fr_auto] gap-3.5 rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm transition sm:min-h-[28rem] sm:gap-5 sm:p-5"
      data-filled={isFilled}
      data-slot={slot}
    >
      <div className="daily-slot-card-header flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="survey-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 sm:h-11 sm:w-11">
            <Icon aria-hidden="true" size={18} />
          </div>
          <div className="daily-slot-heading min-w-0">
            <h3 className="text-xl font-semibold leading-none text-zinc-950 sm:text-2xl">{slotMeta[slot].label}</h3>
            <p className="daily-slot-description mt-1 text-sm leading-snug text-zinc-500 sm:mt-1 sm:text-base">
              {slotMeta[slot].description}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold sm:px-2.5 sm:py-1 sm:text-sm",
            isFilled
              ? "border-zinc-200 bg-white text-zinc-600"
              : "border-zinc-200 bg-zinc-50 text-zinc-500",
          )}
        >
          {isFilled ? "Log" : "Ready"}
        </span>
      </div>

      <div className="grid gap-3 sm:gap-4">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700 sm:text-base">
          행동 내용
          <textarea
            className="survey-control daily-slot-input min-h-32 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:px-4 sm:text-lg sm:leading-8"
            defaultValue={description}
            data-field="description"
            onBlur={(event) => {
              const nextDescription = event.currentTarget.value;
              handleDescriptionInput(nextDescription);
              saveDraft(nextDescription);
            }}
            onInput={(event) => handleDescriptionInput(event.currentTarget.value)}
            placeholder={`${slotMeta[slot].label}에서 오늘 실행한 한 가지`}
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-zinc-700 sm:text-base">
          짧은 회고
          <textarea
            className="survey-control daily-slot-input min-h-24 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:px-4"
            defaultValue={reflection}
            data-field="reflection"
            onBlur={(event) => {
              const nextReflection = event.currentTarget.value;
              handleReflectionInput(nextReflection);
              saveDraft(description, nextReflection);
            }}
            onInput={(event) => handleReflectionInput(event.currentTarget.value)}
            placeholder="이어갈 점 또는 고칠 점"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-zinc-600 sm:text-base">만족도</span>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            aria-label={`만족도 ${score}`}
            aria-pressed={score <= satisfaction}
            className={cn(
              "satisfaction-button flex h-8 w-8 items-center justify-center rounded-md border transition sm:h-9 sm:w-9",
              score <= satisfaction
                ? "border-amber-200 bg-amber-50 text-amber-600"
                : "border-zinc-200 bg-white text-zinc-300 hover:text-zinc-500",
            )}
            data-tooltip={`만족도 ${score}`}
            key={score}
            onClick={() => {
              setDraft((currentDraft) => ({
                ...currentDraft,
                satisfaction: score,
              }));
              onUpdateSlot(slot, {
                description,
                reflection,
                satisfaction: score,
              });
            }}
            title={`만족도 ${score}`}
            type="button"
          >
            <Star
              aria-hidden="true"
              fill={score <= satisfaction ? "currentColor" : "none"}
              size={17}
            />
          </button>
        ))}
      </div>
    </article>
  );
}
