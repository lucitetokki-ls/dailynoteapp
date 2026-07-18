"use client";

import {
  CheckCircle2,
  HardDrive,
  LoaderCircle,
  PencilLine,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type SaveStatus = "editing" | "saving" | "saved" | "local-only" | "error";

type SaveStatusIndicatorProps = {
  className?: string;
  status: SaveStatus;
  updatedAt?: string | null;
};

const statusIcon = {
  editing: PencilLine,
  saving: LoaderCircle,
  saved: CheckCircle2,
  "local-only": HardDrive,
  error: TriangleAlert,
};

function formatSavedTime(updatedAt?: string | null) {
  if (!updatedAt) {
    return null;
  }

  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SaveStatusIndicator({
  className,
  status,
  updatedAt,
}: SaveStatusIndicatorProps) {
  const Icon = statusIcon[status];
  const savedTime = formatSavedTime(updatedAt);
  const label = {
    editing: "작성 중",
    saving: "저장 중",
    saved: savedTime ? `저장됨 · ${savedTime}` : "저장 준비됨",
    "local-only": savedTime ? `오프라인 저장됨 · ${savedTime}` : "오프라인 저장",
    error: "저장 실패",
  }[status];

  return (
    <span
      className={cn("sync-status-pill save-status-indicator", className)}
      data-status={status}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={status === "saving" ? "animate-spin" : undefined}
        size={15}
      />
      <span>{label}</span>
    </span>
  );
}
