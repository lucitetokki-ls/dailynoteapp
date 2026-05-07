"use client";

import { ChangeEvent, useRef } from "react";
import { Database, Download, RotateCcw, ShieldAlert, Trash2, Upload } from "lucide-react";

import { SupabaseDiagnosticsPanel } from "@/components/SupabaseDiagnosticsPanel";
import { SupabaseStatusCard } from "@/components/SupabaseStatusCard";
import {
  clearAllStoredDays,
  clearStoredDay,
  readAllStoredDays,
  readStoredDay,
  updateStoredDay,
  writeStoredDay,
  type StoredDay,
} from "@/lib/daily-store";
import { readActionTemplates, writeActionTemplates } from "@/lib/template-store";
import { createId, getDateKeyFromOffset, getTodayDateKey } from "@/lib/utils";
import {
  clearAllWeeklyReflections,
  readAllWeeklyReflections,
  writeWeeklyReflections,
} from "@/lib/weekly-store";
import type { ActionTemplate } from "@/types/action-template";
import { dailyActionSlots, slotMeta, type DailyAction } from "@/types/daily-action";

const sampleDescriptions = {
  diet: "단백질 중심으로 식사 구성",
  fitness: "퇴근 후 30분 걷기",
  vibe_coding: "작게 고치고 바로 확인",
  writing: "생각 정리용 초안 작성",
} as const;

type DailyNoteBackup = {
  app: "daily-note-app";
  version: 1;
  exportedAt: string;
  days: StoredDay[];
  templates: ActionTemplate[];
  weeklyReflections: ReturnType<typeof readAllWeeklyReflections>;
};

export function SettingsPanel() {
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleSeedSampleData() {
    Array.from({ length: 7 }, (_, index) => getDateKeyFromOffset(-index)).forEach(
      (date, dayIndex) => {
        const existingDay = readStoredDay(date);

        if (existingDay.actions.length > 0) {
          return;
        }

        const now = new Date().toISOString();
        const actions: DailyAction[] = dailyActionSlots.map((slot, actionIndex) => ({
          id: createId(),
          dailyLogId: existingDay.dailyLog.id,
          slot,
          category: slotMeta[slot].category,
          title: slotMeta[slot].label,
          description:
            actionIndex <= 3 - (dayIndex % 3) ? sampleDescriptions[slot] : "",
          status: "done",
          satisfaction: Math.max(3, 5 - ((dayIndex + actionIndex) % 3)),
          reflection: actionIndex === 0 ? "작게라도 실행했다." : "",
          createdAt: now,
          updatedAt: now,
        }));

        updateStoredDay(date, () => ({
          dailyLog: {
            ...existingDay.dailyLog,
            dailyMood: "steady",
            dailyReflection:
              dayIndex % 2 === 0
                ? "완벽하지 않아도 네 슬롯 중 일부를 유지했다."
                : "오늘 채운 슬롯과 비운 슬롯을 분명히 확인했다.",
            updatedAt: now,
          },
          actions,
        }));
      },
    );
  }

  function handleClearToday() {
    if (window.confirm("오늘 기록을 삭제할까요? Supabase에 연결된 경우 원격 기록도 삭제됩니다.")) {
      clearStoredDay(getTodayDateKey());
    }
  }

  function handleClearAll() {
    const confirmation = window.prompt(
      "모든 기록을 삭제하려면 DELETE를 입력하세요. Supabase에 연결된 경우 원격 기록도 삭제됩니다.",
    );

    if (confirmation === "DELETE") {
      clearAllStoredDays();
      clearAllWeeklyReflections();
    }
  }

  function handleExportBackup() {
    const backup: DailyNoteBackup = {
      app: "daily-note-app",
      version: 1,
      exportedAt: new Date().toISOString(),
      days: readAllStoredDays(),
      templates: readActionTemplates(),
      weeklyReflections: readAllWeeklyReflections(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `daily-note-backup-${getTodayDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as Partial<DailyNoteBackup>;

      if (parsed.app !== "daily-note-app" || !Array.isArray(parsed.days)) {
        throw new Error("Invalid backup file.");
      }

      parsed.days.forEach((day) => {
        if (day?.dailyLog?.date) {
          writeStoredDay(day.dailyLog.date, day);
        }
      });

      if (Array.isArray(parsed.templates)) {
        writeActionTemplates(parsed.templates);
      }

      if (Array.isArray(parsed.weeklyReflections)) {
        writeWeeklyReflections(parsed.weeklyReflections);
      }

      window.alert("백업을 가져왔습니다.");
    } catch {
      window.alert("백업 파일을 읽지 못했습니다.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero">
        <p className="survey-kicker">Settings</p>
        <h1 className="survey-title mt-3 max-w-5xl text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
          저장과 데이터 관리
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
          네 개의 고정 기록 슬롯, Supabase 동기화, 백업과 삭제 작업을 관리합니다.
        </p>
      </header>

      <SupabaseStatusCard />
      <SupabaseDiagnosticsPanel />

      <section className="grid gap-4 lg:grid-cols-3">
        <ActionPanel
          description="최근 7일에 4슬롯 구조 예시 데이터를 채웁니다."
          icon={Database}
          onClick={handleSeedSampleData}
          title="샘플 7일 추가"
        />
        <ActionPanel
          description="로컬 기록과 주간 회고를 JSON 파일로 내보냅니다."
          icon={Download}
          onClick={handleExportBackup}
          title="백업 내보내기"
        />
        <ActionPanel
          description="이전에 내보낸 JSON 백업을 다시 불러옵니다."
          icon={Upload}
          onClick={() => importInputRef.current?.click()}
          title="백업 가져오기"
        />
      </section>

      <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-red-200 bg-red-50 text-red-700">
            <ShieldAlert aria-hidden="true" size={21} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">위험 작업</h2>
            <p className="mt-1.5 text-base leading-7 text-zinc-500">
              삭제 작업은 로컬 저장소와 Supabase 연결 상태에 영향을 줍니다.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="survey-control flex min-h-14 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 text-base font-semibold text-zinc-700 transition hover:bg-white"
            onClick={handleClearToday}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={19} />
            오늘 기록 초기화
          </button>
          <button
            className="survey-control flex min-h-14 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-base font-semibold text-red-700 transition hover:bg-white"
            onClick={handleClearAll}
            type="button"
          >
            <Trash2 aria-hidden="true" size={19} />
            전체 기록 삭제
          </button>
        </div>
      </section>

      <input
        accept="application/json"
        className="hidden"
        onChange={handleImportBackup}
        ref={importInputRef}
        type="file"
      />
    </div>
  );
}

type ActionPanelProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ "aria-hidden": true; size: number }>;
  onClick: () => void;
};

function ActionPanel({ title, description, icon: Icon, onClick }: ActionPanelProps) {
  return (
    <button
      className="survey-card rounded-lg border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-emerald-200 bg-emerald-50 text-emerald-700">
        <Icon aria-hidden={true} size={21} />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-base leading-7 text-zinc-500">{description}</p>
    </button>
  );
}
