"use client";

import { BarChart3, CheckCircle2, CircleDashed, Star } from "lucide-react";

import { ActionDialogTrigger } from "@/components/ActionDialogTrigger";
import { ExpandableText } from "@/components/ExpandableText";
import { WeeklyReflectionPanel } from "@/components/WeeklyReflectionPanel";
import { useRecentStoredDays } from "@/lib/daily-store";
import {
  getAverageSlotSatisfaction,
  getFilledSlotCount,
  getActionForSlot,
  getSlotFillMap,
} from "@/lib/slot-metrics";
import { cn, formatDisplayDate } from "@/lib/utils";
import { dailyActionSlots, slotMeta, type DailyActionSlot } from "@/types/daily-action";

const totalWindowDays = 7;
const slotCount = dailyActionSlots.length;
const totalSlots = totalWindowDays * dailyActionSlots.length;
const slotShortLabels: Record<DailyActionSlot, string> = {
  diet: "식단",
  fitness: "운동",
  vibe_coding: "코딩",
  writing: "공부",
  organization: "정리",
  relationships: "관계",
};

function getActionTitle(day: ReturnType<typeof useRecentStoredDays>[number], slot: DailyActionSlot) {
  return `${formatDisplayDate(day.dailyLog.date)} · ${slotMeta[slot].label}`;
}

export function ReviewDashboard() {
  const days = useRecentStoredDays(totalWindowDays);
  const filledSlots = days.reduce((total, day) => total + getFilledSlotCount(day.actions), 0);
  const fullDays = days.filter((day) => getFilledSlotCount(day.actions) === dailyActionSlots.length).length;
  const averageDailySlots = Number((filledSlots / totalWindowDays).toFixed(1));
  const averageSatisfaction = getAverageSlotSatisfaction(days.flatMap((day) => day.actions));
  const weeklyRate = Math.round((filledSlots / totalSlots) * 100);
  const dayLabels = days.map((day) => day.dailyLog.date.slice(5).replace("-", "/"));

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero grid gap-5">
        <div className="max-w-5xl text-left">
          <p className="survey-kicker">7일 리뷰</p>
          <h1 className="survey-title mt-3 text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
            최근 7일 로그 흐름
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
            채웠는지보다 어떤 행동이 어떤 리듬으로 남았는지 가볍게 훑어봅니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={BarChart3} label="기록" value={`${filledSlots}/${totalSlots}`} />
          <StatCard icon={CheckCircle2} label="전부 기록" value={`${fullDays}/7`} tone="emerald" />
          <StatCard icon={CircleDashed} label="일평균" value={averageDailySlots.toString()} tone="sky" />
          <StatCard icon={Star} label="만족도" value={averageSatisfaction.toString()} tone="amber" />
        </div>
      </header>

      <section className="grid gap-4">
        <div className="review-section-heading flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">7일 로그 매트릭스</h2>
            <p className="mt-1.5 text-base text-zinc-500">
              행동의 흐름을 보는 보조 지도입니다.
            </p>
          </div>
          <span className="review-density-badge rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            {weeklyRate}% density
          </span>
        </div>

        <div className="survey-card hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:block">
          <div className="min-w-[680px]">
            <div className="grid grid-cols-[120px_repeat(7,minmax(0,1fr))] gap-2">
              <div />
              {dayLabels.map((label) => (
                <div
                  className="text-center text-sm font-semibold text-zinc-500"
                  key={label}
                >
                  {label}
                </div>
              ))}
              {dailyActionSlots.map((slot) => (
                <HeatmapRow days={days} key={slot} slot={slot} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 md:hidden">
          {days.map((day) => {
            const filledCount = getFilledSlotCount(day.actions);
            const fillMap = getSlotFillMap(day.actions);

            return (
              <article
                className="review-mobile-matrix-card survey-card grid gap-3 rounded-lg border border-zinc-200 bg-white p-3.5 shadow-sm"
                key={`mobile-matrix-${day.dailyLog.date}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-zinc-950">
                    {formatDisplayDate(day.dailyLog.date)}
                  </p>
                  <span className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm font-semibold text-zinc-700">
                    {filledCount}/{slotCount}
                  </span>
                </div>
                <div className="review-mobile-slot-grid grid grid-cols-3 gap-2">
                  {dailyActionSlots.map((slot) => (
                    <ActionDialogTrigger
                      action={getActionForSlot(day.actions, slot)}
                      ariaLabel={`${formatDisplayDate(day.dailyLog.date)} ${slotMeta[slot].label} 전문 보기`}
                      className={cn(
                        "min-h-9 border border-zinc-200 px-1.5 py-2 text-center text-[0.72rem] font-semibold leading-tight transition",
                        fillMap[slot]
                          ? "bg-emerald-50 text-emerald-700 hover:bg-white"
                          : "bg-zinc-50 text-zinc-400",
                      )}
                      dataFilled={fillMap[slot]}
                      date={day.dailyLog.date}
                      key={`mobile-matrix-${day.dailyLog.date}-${slot}`}
                      title={getActionTitle(day, slot)}
                    >
                      {slotShortLabels[slot]}
                    </ActionDialogTrigger>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-950">슬롯별 로그 밀도</h2>
          <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            전체 {weeklyRate}%
          </span>
        </div>

        <div className="review-density-list survey-card border border-zinc-200 bg-white">
          {dailyActionSlots.map((slot) => {
            const filledCount = days.filter((day) => getSlotFillMap(day.actions)[slot]).length;
            const rate = Math.round((filledCount / totalWindowDays) * 100);

            return (
              <article
                className="review-density-row grid items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(8rem,1fr)_minmax(10rem,2fr)_4rem] sm:px-5"
                key={slot}
              >
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950">{slotMeta[slot].label}</h3>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {filledCount}일 기록 · {totalWindowDays - filledCount}일 공백
                  </p>
                </div>
                <div
                  aria-label={`${slotMeta[slot].label} 기록 밀도 ${rate}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={rate}
                  className="review-density-track h-2 bg-zinc-100"
                  role="progressbar"
                >
                  <div
                    className="review-density-fill h-full bg-emerald-400"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-right text-xl font-semibold text-zinc-950">{rate}%</span>
              </article>
            );
          })}
        </div>
      </section>

      <WeeklyReflectionPanel />

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950">최근 7일</h2>
        <div className="history-list grid">
          {days.map((day) => {
            const filledCount = getFilledSlotCount(day.actions);
            const fillMap = getSlotFillMap(day.actions);

            return (
              <article
                className="survey-card survey-list-row history-row grid gap-4 border border-zinc-200 bg-white p-4 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_120px]"
                key={day.dailyLog.date}
              >
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    {formatDisplayDate(day.dailyLog.date)}
                  </p>
                  <p className="mt-1 text-base text-zinc-500">
                    {filledCount === slotCount
                      ? "모든 슬롯 기록"
                      : `${filledCount}/${slotCount} 슬롯 기록`}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {dailyActionSlots.map((slot) => (
                      <SlotPill
                        day={day}
                        filled={fillMap[slot]}
                        key={slot}
                        slot={slot}
                      />
                    ))}
                  </div>
                  <ExpandableText
                    className="mt-3"
                    fallback="회고가 비어 있습니다."
                    previewLines={2}
                    text={day.dailyLog.dailyReflection}
                    title={`${formatDisplayDate(day.dailyLog.date)} · Daily Reflection`}
                  />
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <span className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-lg font-semibold text-zinc-700">
                    {filledCount}/{slotCount}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type HeatmapRowProps = {
  slot: DailyActionSlot;
  days: ReturnType<typeof useRecentStoredDays>;
};

function HeatmapRow({ slot, days }: HeatmapRowProps) {
  return (
    <>
      <div className="flex items-center text-base font-semibold text-zinc-700">
        {slotMeta[slot].label}
      </div>
      {days.map((day) => {
        const filled = getSlotFillMap(day.actions)[slot];

        return (
          <ActionDialogTrigger
            action={getActionForSlot(day.actions, slot)}
            ariaLabel={`${slotMeta[slot].label} ${day.dailyLog.date} ${
              filled ? "logged 전문 보기" : "empty"
            }`}
            className="slot-heat-cell"
            dataFilled={filled}
            date={day.dailyLog.date}
            key={`${slot}-${day.dailyLog.date}`}
            title={`${day.dailyLog.date} · ${slotMeta[slot].label}`}
          >
            <span className="sr-only">{slotMeta[slot].label}</span>
          </ActionDialogTrigger>
        );
      })}
    </>
  );
}

type SlotPillProps = {
  slot: DailyActionSlot;
  filled: boolean;
  day: ReturnType<typeof useRecentStoredDays>[number];
};

function SlotPill({ slot, filled, day }: SlotPillProps) {
  return (
    <ActionDialogTrigger
      action={getActionForSlot(day.actions, slot)}
      ariaLabel={`${formatDisplayDate(day.dailyLog.date)} ${slotMeta[slot].label} 전문 보기`}
      className={cn(
        "rounded-md border px-2.5 py-1 text-sm font-semibold transition",
        filled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-white"
          : "border-zinc-200 bg-zinc-50 text-zinc-400",
      )}
      date={day.dailyLog.date}
      title={getActionTitle(day, slot)}
    >
      {slotMeta[slot].label}
    </ActionDialogTrigger>
  );
}

type StatCardProps = {
  icon: React.ComponentType<{ "aria-hidden": true; size: number }>;
  label: string;
  value: string;
  tone?: "zinc" | "emerald" | "sky" | "amber";
};

const statTone = {
  zinc: "text-zinc-950",
  emerald: "text-emerald-700",
  sky: "text-sky-700",
  amber: "text-amber-600",
};

function StatCard({ icon: Icon, label, value, tone = "zinc" }: StatCardProps) {
  return (
    <div className="survey-card survey-stat rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 sm:text-base">
        <Icon aria-hidden={true} size={18} />
        {label}
      </div>
      <p className={`mt-1.5 text-3xl font-semibold sm:text-4xl ${statTone[tone]}`}>{value}</p>
    </div>
  );
}
