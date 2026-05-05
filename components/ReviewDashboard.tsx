"use client";

import { BarChart3, CheckCircle2, CircleDashed, Star } from "lucide-react";

import { WeeklyReflectionPanel } from "@/components/WeeklyReflectionPanel";
import { useRecentStoredDays } from "@/lib/daily-store";
import {
  getAverageSlotSatisfaction,
  getFilledSlotCount,
  getSlotFillMap,
} from "@/lib/slot-metrics";
import { cn, formatDisplayDate } from "@/lib/utils";
import { dailyActionSlots, slotMeta, type DailyActionSlot } from "@/types/daily-action";

const totalWindowDays = 7;
const totalSlots = totalWindowDays * dailyActionSlots.length;

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
          <p className="survey-kicker">Weekly Review</p>
          <h1 className="survey-title mt-3 text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
            최근 7일 로그 흐름
          </h1>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
            채웠는지보다 어떤 행동이 어떤 리듬으로 남았는지 가볍게 훑어봅니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={BarChart3} label="Log Marks" value={`${filledSlots}/${totalSlots}`} />
          <StatCard icon={CheckCircle2} label="Complete" value={`${fullDays}/7`} tone="emerald" />
          <StatCard icon={CircleDashed} label="Daily Avg" value={averageDailySlots.toString()} tone="sky" />
          <StatCard icon={Star} label="Avg Score" value={averageSatisfaction.toString()} tone="amber" />
        </div>
      </header>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">7일 로그 매트릭스</h2>
            <p className="mt-1.5 text-base text-zinc-500">
              행동의 흐름을 보는 보조 지도입니다.
            </p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            {weeklyRate}% density
          </span>
        </div>

        <div className="survey-card overflow-x-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
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
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-950">슬롯별 로그 밀도</h2>
          <span className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-base font-semibold text-zinc-600">
            전체 {weeklyRate}%
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dailyActionSlots.map((slot) => {
            const filledCount = days.filter((day) => getSlotFillMap(day.actions)[slot]).length;
            const rate = Math.round((filledCount / totalWindowDays) * 100);

            return (
              <article
                className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                key={slot}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-950">
                      {slotMeta[slot].label}
                    </h3>
                    <p className="mt-1.5 text-base text-zinc-500">
                      {filledCount}일 로그 · {totalWindowDays - filledCount}일 공백
                    </p>
                  </div>
                  <span className="text-3xl font-semibold text-zinc-950">{rate}%</span>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <WeeklyReflectionPanel />

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950">최근 7일</h2>
        <div className="grid gap-3">
          {days.map((day) => {
            const filledCount = getFilledSlotCount(day.actions);
            const fillMap = getSlotFillMap(day.actions);

            return (
              <article
                className="survey-card survey-list-row grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_120px]"
                key={day.dailyLog.date}
              >
                <div>
                  <p className="text-lg font-semibold text-zinc-950">
                    {formatDisplayDate(day.dailyLog.date)}
                  </p>
                  <p className="mt-1 text-base text-zinc-500">
                    {filledCount === 4 ? "모든 슬롯 기록" : `${filledCount}/4 슬롯 기록`}
                  </p>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {dailyActionSlots.map((slot) => (
                      <SlotPill filled={fillMap[slot]} key={slot} slot={slot} />
                    ))}
                  </div>
                  <p className="mt-3 line-clamp-2 text-base leading-7 text-zinc-500">
                    {day.dailyLog.dailyReflection || "회고가 비어 있습니다."}
                  </p>
                </div>

                <div className="flex items-center justify-start lg:justify-end">
                  <span className="survey-chip rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-lg font-semibold text-zinc-700">
                    {filledCount}/4
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
          <div
            aria-label={`${slotMeta[slot].label} ${day.dailyLog.date} ${
              filled ? "logged" : "empty"
            }`}
            className="slot-heat-cell"
            data-filled={filled}
            key={`${slot}-${day.dailyLog.date}`}
            title={`${day.dailyLog.date} · ${slotMeta[slot].label}`}
          />
        );
      })}
    </>
  );
}

type SlotPillProps = {
  slot: DailyActionSlot;
  filled: boolean;
};

function SlotPill({ slot, filled }: SlotPillProps) {
  return (
    <span
      className={cn(
        "rounded-md border px-2.5 py-1 text-sm font-semibold",
        filled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-400",
      )}
    >
      {slotMeta[slot].label}
    </span>
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
