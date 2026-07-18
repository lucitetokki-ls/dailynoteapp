"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Database, Download, RotateCcw, ShieldAlert, Trash2, Upload } from "lucide-react";

import { SupabaseDiagnosticsPanel } from "@/components/SupabaseDiagnosticsPanel";
import { SupabaseStatusCard } from "@/components/SupabaseStatusCard";
import {
  maxBackupFileBytes,
  parseDailyNoteBackup,
  type DailyNoteBackup,
} from "@/lib/backup";
import {
  clearAllStoredDays,
  clearStoredDay,
  readStoredDay,
  updateStoredDay,
  useStoredDays,
  writeStoredDays,
} from "@/lib/daily-store";
import { clearAllRemoteData } from "@/lib/data-maintenance";
import {
  decryptDailyNoteBackup,
  encryptDailyNoteBackup,
  isEncryptedDailyNoteBackup,
} from "@/lib/encrypted-backup";
import { readActionTemplates, writeActionTemplates } from "@/lib/template-store";
import { createId, getDateKeyFromOffset, getTodayDateKey } from "@/lib/utils";
import {
  clearAllWeeklyReflections,
  useWeeklyReflections,
  writeWeeklyReflections,
} from "@/lib/weekly-store";
import {
  clearAllWritingEntries,
  useWritingEntries,
  writeWritingEntries,
} from "@/lib/writing-store";
import { dailyActionSlots, slotMeta, type DailyAction } from "@/types/daily-action";

const sampleDescriptions = {
  diet: "단백질 중심으로 식사 구성",
  fitness: "퇴근 후 30분 걷기",
  vibe_coding: "작게 고치고 바로 확인",
  writing: "생각 정리용 초안 작성",
  organization: "미뤄둔 파일과 메일 한 묶음 정리",
  relationships: "먼저 안부를 묻고 대화 나누기",
} as const;

type DeleteScope = "today" | "all";

type SettingsFeedback = {
  tone: "success" | "error";
  message: string;
};

export function SettingsPanel() {
  const importInputRef = useRef<HTMLInputElement>(null);
  const storedDays = useStoredDays();
  const weeklyReflections = useWeeklyReflections();
  const writingEntries = useWritingEntries();
  const [pendingDelete, setPendingDelete] = useState<DeleteScope | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState("");

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
            actionIndex < dailyActionSlots.length - (dayIndex % 3)
              ? sampleDescriptions[slot]
              : "",
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
                ? "완벽하지 않아도 고정 슬롯 중 일부를 유지했다."
                : "오늘 채운 슬롯과 비운 슬롯을 분명히 확인했다.",
            updatedAt: now,
          },
          actions,
        }));
      },
    );
    setFeedback({ tone: "success", message: "최근 7일 샘플 데이터를 확인했습니다." });
  }

  function requestDelete(scope: DeleteScope) {
    setPendingDelete(scope);
    setDeleteConfirmation("");
    setFeedback(null);
  }

  function cancelDelete() {
    setPendingDelete(null);
    setDeleteConfirmation("");
  }

  async function confirmDelete() {
    if (pendingDelete === "all" && deleteConfirmation !== "DELETE") {
      setFeedback({ tone: "error", message: "전체 삭제를 진행하려면 DELETE를 정확히 입력하세요." });
      return;
    }

    setIsWorking(true);

    try {
      if (pendingDelete === "today") {
        const result = await clearStoredDay(getTodayDateKey());
        setFeedback({
          tone: result.ok || result.queued ? "success" : "error",
          message: result.ok
            ? "오늘 기록을 삭제했습니다."
            : result.queued
              ? "로컬 기록을 삭제했고 원격 삭제는 재연결 후 처리합니다."
              : "오늘 기록을 삭제하지 못했습니다.",
        });
      }

      if (pendingDelete === "all") {
        const result = await clearAllRemoteData();

        if (!result.ok && !result.queued) {
          throw new Error(
            "message" in result ? String(result.message ?? "Remote delete failed.") : "Remote delete failed.",
          );
        }

        await Promise.all([
          clearAllStoredDays({ syncRemote: false }),
          clearAllWritingEntries({ syncRemote: false }),
          clearAllWeeklyReflections({ syncRemote: false }),
        ]);
        setFeedback({
          tone: "success",
          message: result.ok
            ? "전체 기록을 삭제했습니다."
            : "로컬 기록을 삭제했고 원격 삭제는 재연결 후 처리합니다.",
        });
      }

      cancelDelete();
    } catch {
      setFeedback({ tone: "error", message: "삭제를 완료하지 못했습니다. 잠시 후 다시 시도하세요." });
    } finally {
      setIsWorking(false);
    }
  }

  async function handleExportBackup() {
    const backup: DailyNoteBackup = {
      app: "daily-note-app",
      version: 3,
      exportedAt: new Date().toISOString(),
      days: storedDays,
      writingEntries,
      templates: readActionTemplates(),
      weeklyReflections,
    };
    if (backupPassphrase && backupPassphrase.length < 8) {
      setFeedback({ tone: "error", message: "암호화 비밀번호는 8자 이상 입력하세요." });
      return;
    }

    setIsWorking(true);
    try {
      const exportValue = backupPassphrase
        ? await encryptDailyNoteBackup(backup, backupPassphrase)
        : backup;
      const blob = new Blob([JSON.stringify(exportValue, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `daily-note-backup-${getTodayDateKey()}${backupPassphrase ? "-encrypted" : ""}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({
        tone: "success",
        message: backupPassphrase
          ? "암호화된 백업 파일을 만들었습니다. 비밀번호를 잊지 마세요."
          : "백업 파일을 만들었습니다. 민감한 기록이 포함되므로 안전하게 보관하세요.",
      });
    } catch {
      setFeedback({ tone: "error", message: "백업 파일을 만들지 못했습니다." });
    } finally {
      setIsWorking(false);
    }
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      if (file.size > maxBackupFileBytes) {
        throw new Error("Backup file is too large.");
      }

      const rawBackup = JSON.parse(await file.text()) as unknown;
      const decryptedBackup = isEncryptedDailyNoteBackup(rawBackup)
        ? await decryptDailyNoteBackup(rawBackup, backupPassphrase)
        : rawBackup;
      const parsed = parseDailyNoteBackup(decryptedBackup);

      setIsWorking(true);
      const resultGroups = await Promise.all([
        writeStoredDays(parsed.days),
        parsed.templates.length > 0
          ? writeActionTemplates(parsed.templates).then((result) => [result])
          : Promise.resolve([]),
        parsed.writingEntries.length > 0
          ? writeWritingEntries(parsed.writingEntries)
          : Promise.resolve([]),
        parsed.weeklyReflections.length > 0
          ? writeWeeklyReflections(parsed.weeklyReflections)
          : Promise.resolve([]),
      ]);
      const results = resultGroups.flat();
      const queuedCount = results.filter((result) => "queued" in result && result.queued).length;
      const failedCount = results.filter((result) => !result.ok && !("queued" in result && result.queued)).length;

      if (failedCount > 0) {
        throw new Error("One or more backup records failed to import.");
      }

      setFeedback({
        tone: "success",
        message:
          queuedCount > 0
            ? `백업을 가져왔습니다. ${queuedCount}건은 재연결 후 동기화됩니다.`
            : "백업을 로컬과 Supabase에 모두 가져왔습니다.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "백업 파일의 형식이 올바르지 않거나 허용 크기를 초과했습니다.",
      });
    } finally {
      setIsWorking(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-8 pb-12">
      <header className="survey-hero">
        <p className="survey-kicker">설정</p>
        <h1 className="survey-title mt-3 max-w-5xl text-5xl font-semibold leading-tight text-zinc-950 sm:text-6xl">
          저장과 데이터 관리
        </h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-600">
          여섯 개의 고정 기록 슬롯, Supabase 동기화, 백업과 삭제 작업을 관리합니다.
        </p>
      </header>

      <SupabaseStatusCard />
      <SupabaseDiagnosticsPanel />

      <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <label className="grid max-w-xl gap-2 text-sm font-semibold text-zinc-800">
          백업 암호화 비밀번호 (선택)
          <input
            autoComplete="new-password"
            className="survey-control h-11 rounded-md border border-zinc-200 bg-white px-3 text-base text-zinc-950 outline-none focus:border-emerald-400"
            disabled={isWorking}
            minLength={8}
            onChange={(event) => setBackupPassphrase(event.target.value)}
            placeholder="8자 이상 입력하면 내보내기 파일을 암호화합니다"
            type="password"
            value={backupPassphrase}
          />
        </label>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          암호화 백업을 가져올 때도 같은 비밀번호를 먼저 입력하세요. 비밀번호는 저장되지 않습니다.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActionPanel
          description="최근 7일에 6슬롯 구조 예시 데이터를 채웁니다."
          icon={Database}
          onClick={handleSeedSampleData}
          title="샘플 7일 추가"
        />
        <ActionPanel
          description="일일 기록, 작문, 주간 회고를 JSON 파일로 내보냅니다."
          icon={Download}
          onClick={() => void handleExportBackup()}
          title="백업 내보내기"
        />
        <ActionPanel
          description="이전에 내보낸 JSON 백업을 다시 불러옵니다."
          icon={Upload}
          onClick={() => importInputRef.current?.click()}
          title="백업 가져오기"
        />
      </section>

      {feedback ? (
        <div
          className={
            feedback.tone === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-700"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700"
          }
          role="status"
        >
          {feedback.message}
        </div>
      ) : null}

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
            onClick={() => requestDelete("today")}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={19} />
            오늘 기록 초기화
          </button>
          <button
            className="survey-control flex min-h-14 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-base font-semibold text-red-700 transition hover:bg-white"
            onClick={() => requestDelete("all")}
            type="button"
          >
            <Trash2 aria-hidden="true" size={19} />
            전체 기록 삭제
          </button>
        </div>

        {pendingDelete ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-base font-semibold text-red-800">
              {pendingDelete === "today" ? "오늘 기록을 삭제합니다." : "모든 기록을 삭제합니다."}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-red-700">
              Supabase에 연결된 경우 원격 기록에도 삭제 요청이 전달됩니다.
            </p>
            {pendingDelete === "all" ? (
              <label className="mt-3 grid gap-2 text-sm font-semibold text-red-800">
                전체 삭제 확인 문구
                <input
                  className="survey-control h-11 rounded-md border border-red-200 bg-white px-3 text-base font-semibold text-zinc-950 outline-none focus:border-red-400"
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder="DELETE"
                  value={deleteConfirmation}
                />
              </label>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="survey-control min-h-11 rounded-md border border-red-300 bg-red-600 px-4 text-base font-semibold text-white transition hover:bg-red-700"
                disabled={isWorking}
                onClick={() => void confirmDelete()}
                type="button"
              >
                {isWorking ? "처리 중" : "삭제 실행"}
              </button>
              <button
                className="survey-control min-h-11 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={cancelDelete}
                type="button"
              >
                취소
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <input
        accept="application/json"
        aria-label="백업 파일 가져오기"
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
