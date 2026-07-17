"use client";

import { useMemo, useState } from "react";
import { Activity, CheckCircle2, Database, Play, XCircle } from "lucide-react";

import { useStoredDays } from "@/lib/daily-store";
import {
  isSupabaseConfigured,
  requiredSupabaseTables,
  supabase,
  supabaseConfigIssue,
} from "@/lib/supabase";
import { useWeeklyReflections } from "@/lib/weekly-store";
import { useWritingEntries } from "@/lib/writing-store";
import { cn } from "@/lib/utils";

type DiagnosticStatus = "idle" | "running" | "ok" | "error";

type DiagnosticItem = {
  label: string;
  message: string;
  status: DiagnosticStatus;
};

function createProbeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createProbeDate() {
  const day = String((Date.now() % 27) + 1).padStart(2, "0");

  return `2099-12-${day}`;
}

export function SupabaseDiagnosticsPanel() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const storedDays = useStoredDays();
  const writingEntries = useWritingEntries();
  const weeklyReflections = useWeeklyReflections();
  const localSummary = useMemo(
    () => ({
      days: storedDays.length,
      writings: writingEntries.filter(
        (entry) => entry.contentJson || (entry.contentMarkdown ?? entry.content).trim(),
      ).length,
      weeks: weeklyReflections.length,
    }),
    [storedDays, weeklyReflections, writingEntries],
  );

  async function runDiagnostics() {
    setIsRunning(true);

    const nextItems: DiagnosticItem[] = [
      {
        label: "ENV",
        message: isSupabaseConfigured
          ? "Supabase URL / publishable key configured"
          : supabaseConfigIssue || "Supabase env vars missing",
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

    const client = supabase;

    for (const tableName of requiredSupabaseTables) {
      const { count, error } = await client
        .from(tableName)
        .select("id", { count: "exact", head: true });

      nextItems.push({
        label: tableName,
        message: error ? error.message : `${count ?? 0} rows readable`,
        status: error ? "error" : "ok",
      });
      setItems([...nextItems]);
    }

    const probeId = createProbeId();
    const actionProbeId = createProbeId();
    const weekProbeId = createProbeId();
    const writingProbeId = createProbeId();
    const templateProbeId = `diagnostic-${probeId}`;
    const probeDate = createProbeDate();
    const probeWeek = `2099-W${String((Date.now() % 52) + 1).padStart(2, "0")}`;
    const insertedLabels: string[] = [];

    try {
      const { error: logError } = await client.from("daily_logs").insert({
        id: probeId,
        date: probeDate,
        daily_mood: "steady",
        daily_reflection: "diagnostic probe",
      });

      if (logError) {
        throw new Error(`daily_logs insert failed: ${logError.message}`);
      }

      insertedLabels.push("daily_logs");

      const { error: actionError } = await client.from("daily_actions").insert({
        id: actionProbeId,
        daily_log_id: probeId,
        slot: "diet",
        category: "diet_fitness",
        title: "diagnostic probe",
        description: "temporary write test",
        status: "done",
        satisfaction: 3,
        reflection: "",
      });

      if (actionError) {
        throw new Error(`daily_actions insert failed: ${actionError.message}`);
      }

      insertedLabels.push("daily_actions");

      const { error: weekError } = await client.from("weekly_reflections").insert({
        id: weekProbeId,
        week_key: probeWeek,
        wins: "diagnostic probe",
        blockers: "",
        next_focus: "",
      });

      if (weekError) {
        throw new Error(`weekly_reflections insert failed: ${weekError.message}`);
      }

      insertedLabels.push("weekly_reflections");

      const { error: writingError } = await client.from("daily_writings").insert({
        id: writingProbeId,
        date: probeDate,
        title: "diagnostic probe",
        content: "diagnostic probe",
        content_markdown: "diagnostic probe",
        content_json: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "diagnostic probe" }],
            },
          ],
        },
      });

      if (writingError) {
        throw new Error(`daily_writings insert failed: ${writingError.message}`);
      }

      insertedLabels.push("daily_writings");

      const { error: templateError } = await client.from("action_templates").insert({
        id: templateProbeId,
        category: "diet_fitness",
        title: "diagnostic probe",
        description: "temporary write test",
      });

      if (templateError) {
        throw new Error(`action_templates insert failed: ${templateError.message}`);
      }

      insertedLabels.push("action_templates");

      nextItems.push({
        label: "WRITE",
        message: `${insertedLabels.length} tables writable`,
        status: "ok",
      });
    } catch (error) {
      nextItems.push({
        label: "WRITE",
        message: error instanceof Error ? error.message : "Write probe failed",
        status: "error",
      });
    } finally {
      const cleanupErrors: string[] = [];

      const cleanupSteps = [
        () => client.from("action_templates").delete().eq("id", templateProbeId),
        () => client.from("weekly_reflections").delete().eq("id", weekProbeId),
        () => client.from("daily_writings").delete().eq("id", writingProbeId),
        () => client.from("daily_actions").delete().eq("id", actionProbeId),
        () => client.from("daily_logs").delete().eq("id", probeId),
      ] as const;

      for (const cleanupStep of cleanupSteps) {
        const { error } = await cleanupStep();

        if (error) {
          cleanupErrors.push(error.message);
        }
      }

      nextItems.push({
        label: "CLEANUP",
        message:
          cleanupErrors.length > 0
            ? `Cleanup needs review: ${cleanupErrors[0]}`
            : "Temporary rows cleaned up",
        status: cleanupErrors.length > 0 ? "error" : "ok",
      });
    }

    setItems([...nextItems]);
    setIsRunning(false);
  }

  const status =
    items.length === 0
      ? "idle"
      : items.some((item) => item.status === "error")
        ? "error"
        : "ok";

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
                <p
                  className="mt-1 truncate text-base font-semibold text-zinc-950"
                  title={item.message}
                >
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
