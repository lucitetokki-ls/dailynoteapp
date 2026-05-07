"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";

import { blockDialogReopen, canOpenDialog, stopDialogEvent } from "@/lib/dialog-guard";
import { cn } from "@/lib/utils";

type TextDialogTriggerProps = {
  title: string;
  text?: string;
  fallback?: string;
  className?: string;
  ariaLabel?: string;
  dataFilled?: boolean;
  children: React.ReactNode;
};

export function TextDialogTrigger({
  title,
  text,
  fallback = "기록이 비어 있습니다.",
  className,
  ariaLabel,
  dataFilled,
  children,
}: TextDialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const content = text?.trim();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        blockDialogReopen();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function openDialog() {
    if (!canOpenDialog()) {
      return;
    }

    setIsOpen(true);
  }

  function closeDialog() {
    blockDialogReopen();
    setIsOpen(false);
  }

  if (!content) {
    return (
      <span
        aria-label={ariaLabel}
        className={className}
        data-filled={dataFilled}
        title={fallback}
      >
        {children}
      </span>
    );
  }

  return (
    <>
      <button
        aria-label={ariaLabel ?? `${title} 전문 보기`}
        className={cn("cursor-pointer", className)}
        data-filled={dataFilled}
        data-tooltip="전문 보기"
        onClick={openDialog}
        type="button"
      >
        {children}
      </button>

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm"
          onClick={closeDialog}
          onPointerDown={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div
            className="dialog-panel survey-card max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-header flex items-start justify-between gap-4 border-b-2 border-zinc-900/80 bg-white px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="survey-kicker">Full Text</p>
                <h2
                  className="mt-1 truncate text-xl font-semibold text-zinc-950 sm:text-2xl"
                  id={titleId}
                >
                  {title}
                </h2>
              </div>
              <button
                aria-label="닫기"
                className="survey-control flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                data-tooltip="닫기"
                onClick={(event) => {
                  event.stopPropagation();
                  closeDialog();
                }}
                onPointerDown={stopDialogEvent}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <p className="whitespace-pre-line text-base leading-8 text-zinc-700 sm:text-lg">
                {content}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
