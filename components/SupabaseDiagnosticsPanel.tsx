"use client";

import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Database, Play, XCircle } from "lucide-react";

import { readAllStoredDays } from "@/lib/daily-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { readAllWeeklyReflections } from "@/lib/weekly-store";
import { readAllWritingEntries } from "@/lib/writing-store";
import { cn } from "@/lib/utils";

type DiagnosticStatus = "idle" | "running" | "ok" | "error";

type DiagnosticItem = {
  label: string;
  message: string;
  status: DiagnosticStatus;
};

const tableNames = [
  "daily_logs",
  "daily_actions",
  "weekly_reflections",
  "daily_writings",
  "action_templates",
] as const;

export function SupabaseDiagnosticsPanel() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const localSummary = useMemo(
    () => ({
      days: readAllStoredDays().length,
      writings: readAllWritingEntries().filter((entry) => entry.content.trim()).length,
      weeks: readAllWeeklyReflections().length,
    }),
    [],
  );

  async function runDiagnostics() {
    setIsRunning(true);

    const nextItems: DiagnosticItem[] = [
      {
        label: "ENV",
        message: isSupabaseConfigured
          ? "Supabase URL / publishable key configured"
          : "Supabase env vars missing",
        status: isSupabaseConfigured ? "ok" : "error",
      },
      {
        label: "LOCAL",
        message: `${localSummary.days} days · ${localSummary.writings} writings · ${localSummary.weeks} weeks`,
        status: "ok",
      },
    ];

    setItems(nextItems);

    if (!supabase) {
      setIsRunning(false);
      return;
    }

    for (const tableName of tableNames) {
      const { count, error } = await supabase
        .from(tableName)
        .select("id", { count: "exact", head: true });

      nextItems.push({
        label: tableName,
        message: error ? error.message : `${count ?? 0} rows readable`,
        status: error ? "error" : "ok",
      });
      setItems([...nextItems]);
    }

    const probeId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `diagnostic-${crypto.randomUUID()}`
        : `diagnostic-${Date.now()}`;

    const { error: insertError } = await supabase.from("action_templates").insert({
      id: probeId,
      category: "diet_fitness",
      title: "diagnostic probe",
      description: "temporary write test",
    });

    if (insertError) {
      nextItems.push({
        label: "WRITE",
        message: insertError.message,
        status: "error",
      });
      setItems([...nextItems]);
      setIsRunning(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("action_templates")
      .delete()
      .eq("id", probeId);

    nextItems.push({
      label: "WRITE",
      message: deleteError ? `Write ok, cleanup failed: ${deleteError.message}` : "Write and cleanup ok",
      status: deleteError ? "error" : "ok",
    });
    setItems([...nextItems]);
    setIsRunning(false);
  }

  const status = items.length === 0 ? "idle" : items.some((item) => item.status === "error") ? "error" : "ok";

  return (
    <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-emerald-200 bg-emerald-50 text-emerald-700">
            <Activity aria-hidden="true" size={21} />
          </div>
          <div className="min-w-0">
            <p className="survey-kicker">Diagnostics</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-950">Supabase 상태 진단</h2>
            <p className="mt-1.5 text-base leading-7 text-zinc-500">
              환경변수, 테이블 읽기, 임시 쓰기와 삭제를 한 번에 확인합니다.
            </p>
          </div>
        </div>
        <button
          className="survey-control flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-base font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-60"
          disabled={isRunning}
          onClick={runDiagnostics}
          type="button"
        >
          <Play aria-hidden="true" size={17} />
          {isRunning ? "확인 중" : "진단 실행"}
        </button>
      </div>

      <div className="mt-5 grid gap-2">
        <div
          className={cn(
            "survey-chip flex items-center gap-2 rounded-md border px-3 py-2 text-base font-semibold",
            status === "ok" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            status === "error" && "border-red-200 bg-red-50 text-red-700",
            status === "idle" && "border-zinc-200 bg-zinc-50 text-zinc-600",
          )}
        >
          {status === "error" ? (
            <XCircle aria-hidden="true" size={17} />
          ) : status === "ok" ? (
            <CheckCircle2 aria-hidden="true" size={17} />
          ) : (
            <Database aria-hidden="true" size={17} />
          )}
          {status === "idle" ? "아직 진단 전" : status === "ok" ? "연동 정상" : "확인 필요"}
        </div>

        {items.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((item) => (
              <div
                className={cn(
                  "survey-chip min-w-0 rounded-md border px-3 py-2",
                  item.status === "ok"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50",
                )}
                key={item.label}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-zinc-950" title={item.message}>
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
