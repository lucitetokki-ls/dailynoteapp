"use client";

import { LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type SettingsGateProps = {
  children: React.ReactNode;
};

const settingsPassword = "LUTO";
const settingsAccessKey = "daily-note:settings-access";

export function SettingsGate({ children }: SettingsGateProps) {
  const [accessState, setAccessState] = useState<"checking" | "granted" | "denied">("checking");
  const [password, setPassword] = useState("");
  const [hasTried, setHasTried] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAccessState(
        window.sessionStorage.getItem(settingsAccessKey) === "granted" ? "granted" : "denied",
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === settingsPassword) {
      window.sessionStorage.setItem(settingsAccessKey, "granted");
      setAccessState("granted");
      return;
    }

    setHasTried(true);
    setPassword("");
  }

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
          설정 페이지에 접근하려면 암호를 입력하세요.
        </p>

        <form className="mt-6 grid gap-3 text-left" onSubmit={handleSubmit}>
          <label
            className="grid gap-2 text-sm font-semibold text-zinc-700"
            htmlFor="settings-password"
          >
            암호
          </label>
          <input
            autoComplete="current-password"
            autoFocus
            className="survey-control h-12 rounded-none border border-zinc-950 bg-zinc-50 px-3 text-base font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:bg-white"
            id="settings-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Settings password"
            type="password"
            value={password}
          />
          <button className="settings-gate-button survey-control" type="submit">
            설정 열기
          </button>
        </form>

        {accessState === "checking" ? (
          <p className="mt-3 text-sm font-semibold text-zinc-500">접근 상태 확인 중</p>
        ) : null}
        {hasTried ? (
          <p className="mt-3 text-sm font-semibold text-red-700">
            암호가 맞지 않습니다.
          </p>
        ) : null}
      </section>
    </div>
  );
}
