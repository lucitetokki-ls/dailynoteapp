"use client";

import { CheckCircle2, HardDrive, LoaderCircle, TriangleAlert } from "lucide-react";

import type { SupabaseSyncStatus } from "@/lib/daily-store";

type SyncToastProps = {
  syncStatus: SupabaseSyncStatus;
};

const statusIcon = {
  "local-only": HardDrive,
  saving: LoaderCircle,
  saved: CheckCircle2,
  error: TriangleAlert,
};

export function SyncToast({ syncStatus }: SyncToastProps) {
  const Icon = statusIcon[syncStatus.status];

  if (!syncStatus.updatedAt) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="sync-toast"
      data-dismissible={syncStatus.status === "saving" ? "false" : "true"}
      data-status={syncStatus.status}
      key={`${syncStatus.status}-${syncStatus.updatedAt}`}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={syncStatus.status === "saving" ? "animate-spin" : undefined}
        size={18}
      />
      <span>{syncStatus.message}</span>
    </div>
  );
}
