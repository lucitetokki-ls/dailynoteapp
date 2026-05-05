"use client";

import { AppNav } from "@/components/AppNav";
import { useClientReady } from "@/lib/client-ready";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isClientReady = useClientReady();

  return (
    <main className="min-h-dvh bg-[#f4f1eb] text-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-7 sm:py-7 lg:px-10">
        <AppNav />
        {isClientReady ? children : null}
      </div>
    </main>
  );
}
