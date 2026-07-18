"use client";

import type { Session } from "@supabase/supabase-js";
import { KeyRound, LockKeyhole } from "lucide-react";
import {
  createContext,
  type FormEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { flushSyncQueue } from "@/lib/sync-engine";
import { isSupabaseConfigured, supabase, supabaseConfigIssue } from "@/lib/supabase";

type AuthContextValue = {
  session: Session | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAppAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAppAuth must be used inside AuthGate.");
  }

  return value;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"checking" | "signed-out" | "signed-in" | "recovery">(
    () => (supabase ? "checking" : "signed-in"),
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setStatus(event === "PASSWORD_RECOVERY" ? "recovery" : nextSession ? "signed-in" : "signed-out");

      if (nextSession) {
        window.setTimeout(() => void flushSyncQueue(), 0);
      }
    });

    void client.auth.getSession().then(({ data: current, error }) => {
      if (error) {
        console.warn("Failed to restore Supabase session", error.message);
      }

      setSession(current.session);
      setStatus((currentStatus) =>
        currentStatus === "recovery" ? currentStatus : current.session ? "signed-in" : "signed-out",
      );
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      session,
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
      },
    }),
    [session],
  );

  if (!isSupabaseConfigured) {
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
        {supabaseConfigIssue ? (
          <p className="sr-only">Supabase 비활성화: {supabaseConfigIssue}</p>
        ) : null}
      </AuthContext.Provider>
    );
  }

  if (status === "checking") {
    return <AuthLoading />;
  }

  if (status === "recovery") {
    return <PasswordRecovery onComplete={() => setStatus("signed-in")} />;
  }

  if (status === "signed-out") {
    return <SignIn />;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

function AuthLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fcfbf8] px-5 text-zinc-950">
      <p className="text-sm font-semibold tracking-[0.12em] text-zinc-500">세션 확인 중</p>
    </main>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#fcfbf8] px-5 py-10 text-zinc-950 sm:px-8 sm:py-16">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-5xl content-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <header>
          <p className="survey-kicker">PRIVATE DAILY LOG</p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-7xl">
            With the door closed
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-zinc-500">
            기록은 지정된 계정으로만 열립니다. 한 번 로그인하면 이 브라우저에서는 세션이 유지됩니다.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || isWorking) {
      return;
    }

    setIsWorking(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setIsWorking(false);

    if (error) {
      setMessage("이메일 또는 비밀번호를 확인하세요.");
    }
  }

  async function sendRecoveryEmail() {
    if (!supabase || !email.trim() || isWorking) {
      setMessage("먼저 가입에 사용한 이메일을 입력하세요.");
      return;
    }

    setIsWorking(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/?recovery=1`,
    });
    setIsWorking(false);
    setMessage(
      error
        ? "메일을 보내지 못했습니다. 잠시 후 다시 시도하세요."
        : "비밀번호 설정 메일을 보냈습니다. 받은편지함을 확인하세요.",
    );
  }

  return (
    <AuthFrame>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
          <LockKeyhole aria-hidden="true" size={20} />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">로그인</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            이메일
            <input
              autoComplete="email"
              className="h-12 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-base outline-none transition focus:border-emerald-500 focus:bg-white"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            비밀번호
            <input
              autoComplete="current-password"
              className="h-12 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-base outline-none transition focus:border-emerald-500 focus:bg-white"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="min-h-12 rounded-md bg-zinc-950 px-4 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isWorking}
            type="submit"
          >
            {isWorking ? "확인 중" : "로그인"}
          </button>
        </form>
        <button
          className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline disabled:opacity-50"
          disabled={isWorking}
          onClick={() => void sendRecoveryEmail()}
          type="button"
        >
          첫 로그인 또는 비밀번호 재설정
        </button>
        {message ? <p className="mt-4 text-sm leading-6 text-zinc-600" role="status">{message}</p> : null}
      </section>
    </AuthFrame>
  );
}

function PasswordRecovery({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || password.length < 8 || password !== confirmation) {
      setMessage("8자 이상의 같은 비밀번호를 두 번 입력하세요.");
      return;
    }

    setIsWorking(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsWorking(false);

    if (error) {
      setMessage("비밀번호를 저장하지 못했습니다. 재설정 메일을 다시 요청하세요.");
      return;
    }

    onComplete();
  }

  return (
    <AuthFrame>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
          <KeyRound aria-hidden="true" size={20} />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">새 비밀번호 설정</h2>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            새 비밀번호
            <input
              autoComplete="new-password"
              className="h-12 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-base outline-none focus:border-emerald-500 focus:bg-white"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-700">
            비밀번호 확인
            <input
              autoComplete="new-password"
              className="h-12 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-base outline-none focus:border-emerald-500 focus:bg-white"
              minLength={8}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
          </label>
          <button
            className="min-h-12 rounded-md bg-zinc-950 px-4 text-base font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            disabled={isWorking}
            type="submit"
          >
            {isWorking ? "저장 중" : "비밀번호 저장"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm leading-6 text-red-700" role="alert">{message}</p> : null}
      </section>
    </AuthFrame>
  );
}
