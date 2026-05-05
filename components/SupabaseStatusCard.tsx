"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, XCircle } from "lucide-react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type SupabaseStatus = "checking" | "ready" | "schema-missing" | "not-configured" | "error";

const statusCopy = {
  checking: {
    title: "Supabase 확인 중",
    description: "프로젝트 연결과 테이블 상태를 확인하고 있습니다.",
  },
  ready: {
    title: "Supabase 준비 완료",
    description: "daily_logs 테이블이 확인됐고 앱 동기화가 활성화됩니다.",
  },
  "schema-missing": {
    title: "Schema 실행 필요",
    description: "Supabase SQL Editor에서 supabase/schema.sql 내용을 실행해야 합니다.",
  },
  "not-configured": {
    title: "환경 변수 필요",
    description: ".env.local에 Supabase URL과 publishable key가 필요합니다.",
  },
  error: {
    title: "Supabase 확인 실패",
    description: "네트워크, API key, 또는 프로젝트 설정을 확인해야 합니다.",
  },
};

export function SupabaseStatusCard() {
  const [status, setStatus] = useState<SupabaseStatus>(
    isSupabaseConfigured ? "checking" : "not-configured",
  );

  useEffect(() => {
    let ignore = false;

    async function checkSupabase() {
      if (!supabase) {
        setStatus("not-configured");
        return;
      }

      const { error } = await supabase.from("daily_logs").select("id").limit(1);

      if (ignore) {
        return;
      }

      if (!error) {
        setStatus("ready");
        return;
      }

      if (error.code === "PGRST205" || error.message.includes("daily_logs")) {
        setStatus("schema-missing");
        return;
      }

      setStatus("error");
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
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 ${tone}`}>
          <Icon aria-hidden="true" size={21} />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">{statusCopy[status].title}</h2>
          <p className="mt-1.5 text-base leading-7 text-zinc-500">
            {statusCopy[status].description}
          </p>
        </div>
      </div>
    </section>
  );
}
