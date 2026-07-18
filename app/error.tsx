"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Daily Note route error", error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-50 p-6 text-zinc-950">
      <section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="survey-kicker">오류 복구</p>
        <h1 className="mt-3 text-3xl font-semibold">화면을 불러오지 못했습니다</h1>
        <p className="mt-3 leading-7 text-zinc-600">
          브라우저에 저장된 기록은 그대로 유지됩니다. 잠시 후 화면을 다시 불러오세요.
        </p>
        <button
          className="survey-control mt-6 min-h-11 rounded-md bg-zinc-950 px-4 font-semibold text-white"
          onClick={unstable_retry}
          type="button"
        >
          다시 불러오기
        </button>
      </section>
    </main>
  );
}
