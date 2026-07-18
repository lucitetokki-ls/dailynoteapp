"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Dumbbell,
  Handshake,
  ListChecks,
  Salad,
  Sparkles,
  Star,
} from "lucide-react";

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
  writing: BookOpen,
  organization: ListChecks,
  relationships: Handshake,
};

type FixedDailyActionsProps = {
  actions: DailyAction[];
  dateKey: string;
  onUpdateSlot: (slot: DailyActionSlot, updates: Partial<DailyAction>) => void;
};

export function FixedDailyActions({ actions, dateKey, onUpdateSlot }: FixedDailyActionsProps) {
  const [activeSlot, setActiveSlot] = useState<DailyActionSlot>(() => {
    return (
      dailyActionSlots.find((slot) => !getActionForSlot(actions, slot)?.description?.trim()) ??
      dailyActionSlots[0]
    );
  });
  const [expandedSlot, setExpandedSlot] = useState<DailyActionSlot | null>(null);

  function focusSlot(slot: DailyActionSlot) {
    setActiveSlot(slot);

    window.requestAnimationFrame(() => {
      const card = document.getElementById(`daily-slot-${slot}`);
      const input = card?.querySelector<HTMLTextAreaElement>('[data-field="description"]');

      card?.scrollIntoView({ block: "start" });
      input?.focus({ preventScroll: true });
    });
  }

  return (
    <section aria-labelledby="daily-slots-heading" className="daily-slots-section grid gap-3">
      <div className="daily-slots-heading flex items-end justify-between gap-3">
        <div className="daily-slots-title-row flex min-w-0 items-baseline gap-3">
          <p className="survey-kicker">오늘의 여섯 영역</p>
          <h2 className="text-2xl font-semibold text-zinc-950" id="daily-slots-heading">
            행동 기록
          </h2>
        </div>
        <span className="daily-slots-hint text-sm text-zinc-500">하나씩 열어 빠르게 기록하세요.</span>
      </div>
      <div aria-label="행동 영역 바로가기" className="daily-slot-jumpbar" role="navigation">
        {dailyActionSlots.map((slot) => {
          const action = getActionForSlot(actions, slot);
          const isFilled = Boolean(action?.description.trim() || action?.reflection.trim());

          return (
            <button
              aria-label={`${slotMeta[slot].label} 입력으로 이동${isFilled ? ", 기록됨" : ""}`}
              aria-pressed={activeSlot === slot}
              className="daily-slot-jump"
              data-filled={isFilled}
              key={`jump-${slot}`}
              onClick={() => focusSlot(slot)}
              type="button"
            >
              <span>{slotMeta[slot].label}</span>
              <span aria-hidden="true" className="daily-slot-jump-dot" />
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {dailyActionSlots.map((slot) => {
          const action = getActionForSlot(actions, slot);

          return (
            <FixedDailyActionCard
              action={action}
              active={activeSlot === slot}
              expanded={expandedSlot === slot}
              key={`${dateKey}-${slot}`}
              onActivate={() => setActiveSlot(slot)}
              onUpdateSlot={onUpdateSlot}
              onToggle={() => setExpandedSlot((current) => (current === slot ? null : slot))}
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
  active: boolean;
  expanded: boolean;
  slot: DailyActionSlot;
  onActivate: () => void;
  onUpdateSlot: (slot: DailyActionSlot, updates: Partial<DailyAction>) => void;
  onToggle: () => void;
};

function FixedDailyActionCard({
  action,
  active,
  expanded,
  slot,
  onActivate,
  onUpdateSlot,
  onToggle,
}: FixedDailyActionCardProps) {
  const Icon = slotIcons[slot];
  const [description, setDescription] = useState(action?.description ?? "");
  const [reflection, setReflection] = useState(action?.reflection ?? "");
  const [satisfaction, setSatisfaction] = useState(action?.satisfaction ?? 3);
  const [isDirty, setIsDirty] = useState(false);
  const isFilled = Boolean(description.trim() || reflection.trim());
  const detailsId = `daily-slot-details-${slot}`;

  useEffect(() => {
    if (isDirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDescription(action?.description ?? "");
      setReflection(action?.reflection ?? "");
      setSatisfaction(action?.satisfaction ?? 3);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [action?.description, action?.id, action?.reflection, action?.satisfaction, isDirty]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      onUpdateSlot(slot, {
        description,
        reflection,
        satisfaction,
      });
      setIsDirty(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [description, isDirty, onUpdateSlot, reflection, satisfaction, slot]);

  function saveDraft(
    nextDescription = description,
    nextReflection = reflection,
    nextSatisfaction = satisfaction,
  ) {
    onUpdateSlot(slot, {
      description: nextDescription,
      reflection: nextReflection,
      satisfaction: nextSatisfaction,
    });
    setIsDirty(false);
  }

  function handleDescriptionInput(value: string) {
    setDescription(value);
    setIsDirty(true);
  }

  function handleReflectionInput(value: string) {
    setReflection(value);
    setIsDirty(true);
  }

  return (
    <article
      className="daily-slot-card survey-card rounded-lg border border-zinc-200 bg-white shadow-sm transition"
      data-active={active}
      data-dirty={isDirty}
      data-expanded={expanded}
      data-filled={isFilled}
      data-slot={slot}
      id={`daily-slot-${slot}`}
      onFocusCapture={onActivate}
    >
      <div className="daily-slot-card-header flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="survey-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 sm:h-11 sm:w-11">
            <Icon aria-hidden="true" size={18} />
          </div>
          <div className="daily-slot-heading min-w-0">
            <h3 className="text-xl font-semibold leading-none text-zinc-950 sm:text-2xl">
              {slotMeta[slot].label}
            </h3>
            <p className="daily-slot-description mt-1 text-sm leading-snug text-zinc-500 sm:mt-1 sm:text-base">
              {slotMeta[slot].description}
            </p>
          </div>
        </div>
        <div className="daily-slot-card-actions flex shrink-0 items-center gap-1.5">
          <span
            data-state={isDirty ? "editing" : isFilled ? "saved" : "idle"}
            className={cn(
              "slot-state-pill shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold sm:px-2.5 sm:py-1 sm:text-sm",
              isDirty && "border-amber-200 bg-amber-50 text-amber-700",
              !isDirty && isFilled && "border-emerald-200 bg-emerald-50 text-emerald-700",
              !isDirty && !isFilled && "border-zinc-200 bg-zinc-50 text-zinc-500",
            )}
          >
            {isDirty ? "작성 중" : isFilled ? "기록됨" : "미기록"}
          </span>
          <button
            aria-controls={detailsId}
            aria-expanded={expanded}
            aria-label={`${slotMeta[slot].label} 회고와 만족도 ${expanded ? "접기" : "펼치기"}`}
            className="daily-slot-toggle survey-control flex h-11 w-11 items-center justify-center border border-zinc-200 bg-white text-zinc-700"
            onClick={onToggle}
            type="button"
          >
            <ChevronDown aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      <div className="daily-slot-primary">
        <label className="grid gap-2 text-sm font-semibold text-zinc-700 sm:text-base">
          행동 내용
          <textarea
            className="survey-control daily-slot-input min-h-20 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:px-4 sm:text-lg sm:leading-8"
            data-field="description"
            maxLength={10000}
            onBlur={(event) => saveDraft(event.currentTarget.value)}
            onInput={(event) => handleDescriptionInput(event.currentTarget.value)}
            placeholder={slotMeta[slot].actionPlaceholder}
            value={description}
          />
        </label>
      </div>

      <div className="daily-slot-card-body daily-slot-details grid gap-4" id={detailsId}>
        <div className="grid gap-3 sm:gap-4">
          <label className="grid gap-2 text-sm font-semibold text-zinc-700 sm:text-base">
            짧은 회고
            <textarea
              className="survey-control daily-slot-input min-h-24 resize-y rounded-md border border-zinc-200 bg-zinc-50 px-3.5 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white sm:px-4"
              data-field="reflection"
              maxLength={10000}
              onBlur={(event) => saveDraft(description, event.currentTarget.value)}
              onInput={(event) => handleReflectionInput(event.currentTarget.value)}
              placeholder={slotMeta[slot].reflectionPlaceholder}
              value={reflection}
            />
          </label>
        </div>

        <div className="satisfaction-row flex flex-wrap items-center gap-2">
          <span className="satisfaction-label mr-1 text-sm font-semibold text-zinc-600 sm:text-base">
            만족도
          </span>
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              aria-label={`만족도 ${score}`}
              aria-pressed={score === satisfaction}
              className={cn(
                "satisfaction-button flex h-8 w-8 items-center justify-center rounded-md border transition sm:h-9 sm:w-9",
                score <= satisfaction
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : "border-zinc-200 bg-white text-zinc-300 hover:text-zinc-500",
              )}
              data-tooltip={`만족도 ${score}`}
              key={score}
              onClick={() => {
                setSatisfaction(score);
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
      </div>
    </article>
  );
}
