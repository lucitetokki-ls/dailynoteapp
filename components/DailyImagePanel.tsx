"use client";

import Image from "next/image";
import { useState } from "react";

export function DailyImagePanel() {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div className="survey-card survey-card-strong relative flex h-full min-h-[14rem] overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:min-h-[24rem] xl:min-h-[28rem]">
      {hasImageError ? (
        <div className="survey-grid-panel flex min-h-full flex-1 items-center justify-center border-2 border-dashed border-zinc-200 p-6 text-center">
          <p className="max-w-sm text-base leading-7 text-zinc-500">
            public/lucitetokki-profile.png 이미지를 넣으면 이 영역에 표시됩니다.
          </p>
        </div>
      ) : (
        <Image
          alt="Lucitetokki daily action visual"
          className="object-cover"
          fill
          onError={() => setHasImageError(true)}
          priority
          sizes="(min-width: 1280px) 460px, 100vw"
          src="/lucitetokki-profile.png"
        />
      )}
    </div>
  );
}
