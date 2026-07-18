"use client";

import { useState } from "react";

import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { formatDisplayWeek, getWeekKey } from "@/lib/utils";
import { updateWeeklyReflection, useWeeklyReflection } from "@/lib/weekly-store";

export function WeeklyReflectionPanel() {
  const [currentWeekKey] = useState(() => getWeekKey());
  const reflection = useWeeklyReflection(currentWeekKey);
  const hasReflection = Boolean(
    reflection.wins.trim() || reflection.blockers.trim() || reflection.nextFocus.trim(),
  );

  return (
    <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">주간 회고</h2>
          <p className="mt-1.5 text-base text-zinc-500">
            {formatDisplayWeek(currentWeekKey)} · 자동 저장
          </p>
        </div>
        {hasReflection ? (
          <SaveStatusIndicator status="saved" updatedAt={reflection.updatedAt} />
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ReflectionField
          label="잘 된 점"
          onChange={(value) => updateWeeklyReflection(currentWeekKey, { wins: value })}
          placeholder="이번 주 유지된 행동 루프"
          value={reflection.wins}
        />
        <ReflectionField
          label="막힌 점"
          onChange={(value) => updateWeeklyReflection(currentWeekKey, { blockers: value })}
          placeholder="반복을 방해한 요인"
          value={reflection.blockers}
        />
        <ReflectionField
          label="다음 집중"
          onChange={(value) => updateWeeklyReflection(currentWeekKey, { nextFocus: value })}
          placeholder="다음 주에 줄일 것 / 늘릴 것"
          value={reflection.nextFocus}
        />
      </div>
    </section>
  );
}

type ReflectionFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

function ReflectionField({ label, value, placeholder, onChange }: ReflectionFieldProps) {
  return (
    <label className="grid gap-2 text-base font-semibold text-zinc-700">
      {label}
      <textarea
        className="survey-control min-h-36 resize-none rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-base leading-7 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
        maxLength={20000}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
