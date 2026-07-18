import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-50 p-6 text-zinc-950">
      <section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="survey-kicker">404</p>
        <h1 className="mt-3 text-3xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <Link className="mt-6 inline-flex font-semibold underline" href="/">
          오늘 기록으로 돌아가기
        </Link>
      </section>
    </main>
  );
}
