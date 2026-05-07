"use client";

import { LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type SettingsGateProps = {
  children: React.ReactNode;
};

const settingsPassword = "LUTO";

export function SettingsGate({ children }: SettingsGateProps) {
  const [accessState, setAccessState] = useState<"checking" | "granted" | "denied">("checking");

  const requestPassword = useCallback(() => {
    const password = window.prompt("설정 페이지 암호를 입력하세요.");

    if (password === settingsPassword) {
      setAccessState("granted");
      return;
    }

    setAccessState("denied");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(requestPassword, 0);

    return () => window.clearTimeout(timer);
  }, [requestPassword]);

  if (accessState === "granted") {
    return children;
  }

  return (
    <div className="settings-gate">
      <header className="settings-gate-hero survey-hero">
        <p className="survey-kicker">Settings</p>
        <h1 className="survey-title mt-3">Access Control</h1>
        <p className="mt-4">설정 페이지는 암호 확인 후 진입합니다.</p>
      </header>

      <section className="settings-gate-panel survey-card">
        <div className="settings-gate-icon">
          <LockKeyhole aria-hidden="true" size={24} />
        </div>
        <p className="survey-kicker mt-5">Settings Locked</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
          설정 접근 제한
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-500">
          설정 페이지에 접근하려면 암호가 필요합니다.
        </p>
        <button
          className="settings-gate-button survey-control"
          onClick={requestPassword}
          type="button"
        >
          암호 입력
        </button>
        {accessState === "denied" ? (
          <p className="mt-3 text-sm font-semibold text-red-700">
            암호가 맞지 않습니다.
          </p>
        ) : null}
      </section>
    </div>
  );
}
