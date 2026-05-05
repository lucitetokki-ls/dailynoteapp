"use client";

import { AppNav } from "@/components/AppNav";
import { useClientReady } from "@/lib/client-ready";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isClientReady = useClientReady();

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#f4f1eb] text-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col overflow-x-hidden px-3 py-3 sm:px-7 sm:py-7 lg:px-10">
        <AppNav />
        {isClientReady ? children : null}
      </div>
    </main>
  );
}
