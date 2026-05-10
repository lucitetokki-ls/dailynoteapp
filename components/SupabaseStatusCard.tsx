"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, XCircle } from "lucide-react";

import {
  isSupabaseConfigured,
  requiredSupabaseTables,
  supabase,
  supabaseConfigIssue,
} from "@/lib/supabase";

type SupabaseStatus = "checking" | "ready" | "schema-missing" | "not-configured" | "error";

const statusCopy = {
  checking: {
    title: "Supabase 확인 중",
    description: "프로젝트 연결과 필수 테이블 상태를 확인하고 있습니다.",
  },
  ready: {
    title: "Supabase 준비 완료",
    description: "필수 테이블을 모두 읽을 수 있어 원격 동기화가 활성화됩니다.",
  },
  "schema-missing": {
    title: "Schema 실행 필요",
    description: "Supabase SQL Editor에서 supabase/schema.sql 내용을 다시 실행해야 합니다.",
  },
  "not-configured": {
    title: "환경 변수 필요",
    description: supabaseConfigIssue ?? ".env.local에 Supabase URL과 publishable key가 필요합니다.",
  },
  error: {
    title: "Supabase 확인 실패",
    description: "네트워크, API key, RLS 정책, 또는 프로젝트 설정을 확인해야 합니다.",
  },
} satisfies Record<SupabaseStatus, { title: string; description: string }>;

export function SupabaseStatusCard() {
  const [status, setStatus] = useState<SupabaseStatus>(
    isSupabaseConfigured ? "checking" : "not-configured",
  );
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let ignore = false;

    async function checkSupabase() {
      if (!supabase) {
        setStatus("not-configured");
        setDetail(supabaseConfigIssue ?? "");
        return;
      }

      for (const tableName of requiredSupabaseTables) {
        const { error } = await supabase.from(tableName).select("id").limit(1);

        if (ignore) {
          return;
        }

        if (!error) {
          continue;
        }

        setDetail(`${tableName}: ${error.message}`);

        if (error.code === "PGRST205" || /not exist|could not find|schema cache/i.test(error.message)) {
          setStatus("schema-missing");
          return;
        }

        setStatus("error");
        return;
      }

      setStatus("ready");
      setDetail("");
    }

    void checkSupabase();

    return () => {
      ignore = true;
    };
  }, []);

  const Icon = status === "ready" ? CheckCircle2 : status === "checking" ? Database : XCircle;
  const tone =
    status === "ready"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "checking"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <section className="survey-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 ${tone}`}
        >
          <Icon aria-hidden="true" size={21} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">{statusCopy[status].title}</h2>
          <p className="mt-1.5 text-base leading-7 text-zinc-500">
            {detail || statusCopy[status].description}
          </p>
        </div>
      </div>
    </section>
  );
}
