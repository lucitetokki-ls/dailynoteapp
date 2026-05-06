"use client";

import Image from "next/image";

import { AppNav } from "@/components/AppNav";
import { useClientReady } from "@/lib/client-ready";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isClientReady = useClientReady();

  return (
    <main className="app-shell min-h-dvh overflow-x-hidden text-zinc-950">
      <div className="app-frame min-h-dvh">
        <aside className="app-sidebar">
          <div className="app-brand">
            <p className="app-brand-title">ROUTINE</p>
            <p className="app-brand-subtitle">DAILY_LOG_V1.0</p>
          </div>

          <AppNav />

          <div className="app-sidebar-footer">
            <div className="app-user">
              <div className="app-user-icon">
                <Image
                  alt="Lucite Tokki profile"
                  className="app-user-image"
                  height={64}
                  priority={false}
                  src="/lucitetokki-profile.png"
                  width={64}
                />
              </div>
              <div>
                <p className="app-user-label">GRINDING</p>
                <p className="app-user-name">LUCITE TOKKI</p>
              </div>
            </div>
            <div className="app-command">ACTION_LOOP_ACTIVE</div>
          </div>
        </aside>

        <section className="app-main">
          <div className="app-content">
            {isClientReady ? children : null}
          </div>
        </section>
      </div>
    </main>
  );
}
