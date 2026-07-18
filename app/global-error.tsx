"use client";

export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <html data-scroll-behavior="smooth" lang="ko">
      <body>
        <main style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 560 }}>
            <h1>Daily Note를 시작하지 못했습니다</h1>
            <p>기록은 브라우저 저장소에 남아 있습니다. 앱을 다시 시작해 주세요.</p>
            <button onClick={unstable_retry} type="button">
              다시 시작
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
