"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

import { RichWritingPreview } from "@/components/RichWritingEditor";
import { formatDisplayDate } from "@/lib/utils";
import type { WritingEntry } from "@/types/writing-entry";

type WritingEntryDialogProps = {
  entry: WritingEntry | null;
  onClose: () => void;
};

function getEntryContent(entry: WritingEntry) {
  return entry.contentMarkdown?.trim() ? entry.contentMarkdown : entry.content;
}

export function WritingEntryDialog({ entry, onClose }: WritingEntryDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entry) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [entry, onClose]);

  if (!entry) {
    return null;
  }

  const title = entry.title.trim() || "제목 없는 작문";

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="dialog-panel writing-entry-dialog survey-card flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
      >
        <div className="dialog-header flex items-start justify-between gap-4 border-b-2 border-zinc-900/80 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="survey-kicker">{formatDisplayDate(entry.date)}</p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-zinc-950 sm:text-3xl" id={titleId}>
              {title}
            </h2>
          </div>
          <button
            aria-label="작문 닫기"
            className="survey-control flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
          <RichWritingPreview
            contentJson={entry.contentJson}
            fallbackMarkdown={getEntryContent(entry)}
          />
        </div>
      </div>
    </div>
  );
}
