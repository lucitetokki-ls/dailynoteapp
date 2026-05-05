"use client";

import { AppNav } from "@/components/AppNav";
import { useClientReady } from "@/lib/client-ready";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isClientReady = useClientReady();

  return (
    <main className="app-shell min-h-dvh overflow-x-hidden bg-[#f4f1eb] text-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[90rem] flex-col overflow-x-hidden px-4 py-4 sm:px-7 sm:py-7 lg:px-10">
        <AppNav />
        {isClientReady ? children : null}
      </div>
    </main>
  );
}
