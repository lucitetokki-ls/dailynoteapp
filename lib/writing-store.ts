"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { JSONContent } from "@tiptap/core";

import {
  isSupabaseConfigured,
  retrySupabaseMutation,
  supabase,
  type SupabaseMutationResult,
} from "@/lib/supabase";
import { createStableUuid, getTodayDateKey } from "@/lib/utils";
import type { WritingEntry } from "@/types/writing-entry";

const writingStoragePrefix = "daily-note-writing:";
const writingStoreEventName = "daily-note-writing-store-change";
const writingSyncEventName = "daily-note-writing-sync-change";
const writingDatePattern = /^\d{4}-\d{2}-\d{2}$/;

let writingSnapshotVersion = 0;
let writingSyncVersion = 0;
const loadedWritingDates = new Set<string>();
let loadedAllWritingEntries = false;
const writingSyncStatuses = new Map<string, WritingSyncStatus>();

export type WritingSyncStatus = {
  status: "local-only" | "saving" | "saved" | "error";
  message: string;
  updatedAt: string | null;
};

const defaultWritingSyncStatus: WritingSyncStatus = {
  status: isSupabaseConfigured ? "saved" : "local-only",
  message: isSupabaseConfigured ? "Supabase 대기 중" : "로컬 저장만 사용 중",
  updatedAt: null,
};

type WritingEntryRow = {
  id: string;
  date: string;
  content: string;
  content_json?: JSONContent | null;
  content_markdown?: string | null;
  created_at: string;
  updated_at: string;
};

export type WritingEntryDraft = {
  content: string;
  contentJson?: JSONContent | null;
  contentMarkdown?: string;
};

function isJsonContent(value: unknown): value is JSONContent {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getWritingContent(entry: Pick<WritingEntry, "content" | "contentMarkdown">) {
  return selectWritingContent(entry.contentMarkdown, entry.content);
}

function selectWritingContent(preferred: string | null | undefined, fallback: string | null | undefined) {
  return preferred?.trim() ? preferred : fallback ?? preferred ?? "";
}

function hasWritingContent(entry: Pick<WritingEntry, "content" | "contentMarkdown" | "contentJson">) {
  return Boolean(entry.contentJson) || getWritingContent(entry).trim().length > 0;
}

function normalizeWritingEntry(
  entry: Partial<WritingEntry> | null | undefined,
  date: string,
): WritingEntry {
  const fallback = createDefaultWritingEntry(date);
  const contentMarkdown = selectWritingContent(entry?.contentMarkdown, entry?.content);

  return {
    id: entry?.id ?? fallback.id,
    date: entry?.date ?? fallback.date,
    content: contentMarkdown,
    contentJson: isJsonContent(entry?.contentJson) ? entry.contentJson : null,
    contentMarkdown,
    createdAt: entry?.createdAt ?? fallback.createdAt,
    updatedAt: entry?.updatedAt ?? fallback.updatedAt,
  };
}

function getWritingStorageKey(date: string) {
  return `${writingStoragePrefix}${date}`;
}

function emitWritingStoreChange() {
  writingSnapshotVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(writingStoreEventName));
  }
}

function emitWritingSyncChange() {
  writingSyncVersion += 1;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(writingSyncEventName));
  }
}

function setWritingSyncStatus(date: string, nextStatus: WritingSyncStatus) {
  writingSyncStatuses.set(date, nextStatus);
  emitWritingSyncChange();
}

function mapWritingEntryRow(row: WritingEntryRow): WritingEntry {
  const contentMarkdown = selectWritingContent(row.content_markdown, row.content);

  return {
    id: row.id,
    date: row.date,
    content: contentMarkdown,
    contentJson: isJsonContent(row.content_json) ? row.content_json : null,
    contentMarkdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWritingEntryToRow(entry: WritingEntry) {
  const contentMarkdown = getWritingContent(entry);

  return {
    id: entry.id,
    date: entry.date,
    content: contentMarkdown,
    content_json: entry.contentJson ?? null,
    content_markdown: contentMarkdown,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

export function createDefaultWritingEntry(date: string): WritingEntry {
  const fallbackTimestamp = `${date}T00:00:00.000Z`;

  return {
    id: createStableUuid(`daily-writing:${date}`),
    date,
    content: "",
    contentJson: null,
    contentMarkdown: "",
    createdAt: fallbackTimestamp,
    updatedAt: fallbackTimestamp,
  };
}

function readWritingEntryFromLocalStorage(date: string): WritingEntry {
  if (typeof window === "undefined") {
    return createDefaultWritingEntry(date);
  }

  const raw = window.localStorage.getItem(getWritingStorageKey(date));

  if (!raw) {
    return createDefaultWritingEntry(date);
  }

  try {
    return normalizeWritingEntry(JSON.parse(raw) as Partial<WritingEntry>, date);
  } catch {
    return createDefaultWritingEntry(date);
  }
}

function writeWritingEntryLocally(date: string, entry: WritingEntry) {
  window.localStorage.setItem(getWritingStorageKey(date), JSON.stringify(normalizeWritingEntry(entry, date)));
  emitWritingStoreChange();
}

async function fetchWritingEntryFromSupabase(date: string) {
  if (!supabase) {
    return undefined;
  }

  const { data, error } = await supabase
    .from("daily_writings")
    .select("*")
    .eq("date", date)
    .maybeSingle<WritingEntryRow>();

  if (error) {
    console.warn("Failed to fetch daily writing from Supabase", error.message);
    setWritingSyncStatus(date, {
      status: "error",
      message: "Writing 테이블 확인 필요",
      updatedAt: new Date().toISOString(),
    });
    return null;
  }

  return data ? mapWritingEntryRow(data) : null;
}

async function syncWritingEntryFromSupabase(date: string) {
  if (!isSupabaseConfigured || loadedWritingDates.has(date)) {
    return;
  }

  loadedWritingDates.add(date);

  const remoteEntry = await fetchWritingEntryFromSupabase(date);

  if (remoteEntry === undefined) {
    loadedWritingDates.delete(date);
    return;
  }

  if (remoteEntry) {
    const localEntry = readWritingEntryFromLocalStorage(date);

    if (
      hasWritingContent(localEntry) &&
      (!hasWritingContent(remoteEntry) || localEntry.updatedAt > remoteEntry.updatedAt)
    ) {
      return;
    }

    writeWritingEntryLocally(date, remoteEntry);
  }
}

async function syncAllWritingEntriesFromSupabase() {
  if (!isSupabaseConfigured || !supabase || loadedAllWritingEntries) {
    return;
  }

  loadedAllWritingEntries = true;

  const { data, error } = await supabase
    .from("daily_writings")
    .select("*")
    .order("date", { ascending: false })
    .returns<WritingEntryRow[]>();

  if (error) {
    console.warn("Failed to fetch daily writings from Supabase", error.message);
    loadedAllWritingEntries = false;
    return;
  }

  (data ?? []).forEach((row) => {
    const remoteEntry = mapWritingEntryRow(row);
    const localEntry = readWritingEntryFromLocalStorage(remoteEntry.date);

    loadedWritingDates.add(remoteEntry.date);

    if (
      hasWritingContent(localEntry) &&
      (!hasWritingContent(remoteEntry) || localEntry.updatedAt > remoteEntry.updatedAt)
    ) {
      return;
    }

    writeWritingEntryLocally(remoteEntry.date, remoteEntry);
  });
}

async function persistWritingEntryToSupabase(
  entry: WritingEntry,
): Promise<SupabaseMutationResult> {
  if (!supabase) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("daily_writings")
    .upsert(mapWritingEntryToRow(entry), { onConflict: "date" });

  if (error) {
    console.warn("Failed to save daily writing to Supabase", error.message);
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export function readWritingEntry(date: string): WritingEntry {
  if (typeof window === "undefined") {
    return createDefaultWritingEntry(date);
  }

  return readWritingEntryFromLocalStorage(date);
}

export function readAllWritingEntries() {
  if (typeof window === "undefined") {
    return [];
  }

  const entries: WritingEntry[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(writingStoragePrefix)) {
      continue;
    }

    const date = key.slice(writingStoragePrefix.length);

    if (!writingDatePattern.test(date)) {
      continue;
    }

    entries.push(readWritingEntryFromLocalStorage(date));
  }

  return entries.sort((first, second) => second.date.localeCompare(first.date));
}

export function writeWritingEntry(date: string, nextContent: string | WritingEntryDraft) {
  const currentEntry = readWritingEntry(date);
  const now = new Date().toISOString();
  const draft =
    typeof nextContent === "string"
      ? {
          content: nextContent,
          contentJson: null,
          contentMarkdown: nextContent,
        }
      : nextContent;
  const contentMarkdown = draft.contentMarkdown ?? draft.content;
  const nextEntry: WritingEntry = {
    ...currentEntry,
    content: contentMarkdown,
    contentJson: draft.contentJson ?? null,
    contentMarkdown,
    updatedAt: now,
  };

  writeWritingEntryLocally(date, nextEntry);

  if (!isSupabaseConfigured) {
    setWritingSyncStatus(date, {
      status: "local-only",
      message: "로컬 저장됨",
      updatedAt: now,
    });
    return;
  }

  setWritingSyncStatus(date, {
    status: "saving",
    message: "Supabase 저장 중",
    updatedAt: now,
  });

  void retrySupabaseMutation(() => persistWritingEntryToSupabase(nextEntry)).then((result) => {
    setWritingSyncStatus(date, {
      status: result.ok ? "saved" : "error",
      message: result.ok ? "Supabase 저장됨" : result.message || "Supabase 저장 실패",
      updatedAt: new Date().toISOString(),
    });
  });
}

export function writeWritingEntries(entries: WritingEntry[]) {
  entries.forEach((entry) => {
    const normalizedEntry = normalizeWritingEntry(entry, entry.date);

    writeWritingEntryLocally(normalizedEntry.date, normalizedEntry);

    if (isSupabaseConfigured) {
      void retrySupabaseMutation(() => persistWritingEntryToSupabase(normalizedEntry));
    }
  });
}

export function clearAllWritingEntries() {
  if (typeof window !== "undefined") {
    const keysToRemove: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      const date = key?.slice(writingStoragePrefix.length);

      if (key?.startsWith(writingStoragePrefix) && date && writingDatePattern.test(date)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    emitWritingStoreChange();
  }

  if (supabase) {
    const client = supabase;

    void retrySupabaseMutation(async () => {
      const { error } = await client
        .from("daily_writings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        console.warn("Failed to delete daily writings from Supabase", error.message);
        return { ok: false, message: error.message };
      }

      return { ok: true };
    });
  }
}

function subscribeToWritingEntry(onStoreChange: () => void) {
  window.addEventListener(writingStoreEventName, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(writingStoreEventName, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToWritingSyncStatus(onStoreChange: () => void) {
  window.addEventListener(writingSyncEventName, onStoreChange);

  return () => window.removeEventListener(writingSyncEventName, onStoreChange);
}

function getWritingSnapshot() {
  if (typeof window === "undefined") {
    return "server";
  }

  return `${writingSnapshotVersion}:${window.localStorage.length}`;
}

function getWritingSyncSnapshot() {
  return `${writingSyncVersion}:${writingSyncStatuses.size}`;
}

function getServerSnapshot() {
  return "server";
}

export function readWritingSyncStatus(date: string) {
  return writingSyncStatuses.get(date) ?? defaultWritingSyncStatus;
}

export function useWritingEntry(date = getTodayDateKey()) {
  useSyncExternalStore(subscribeToWritingEntry, getWritingSnapshot, getServerSnapshot);
  useEffect(() => {
    void syncWritingEntryFromSupabase(date);
  }, [date]);
  return readWritingEntry(date);
}

export function useWritingEntries() {
  useSyncExternalStore(subscribeToWritingEntry, getWritingSnapshot, getServerSnapshot);
  useEffect(() => {
    void syncAllWritingEntriesFromSupabase();
  }, []);

  return readAllWritingEntries();
}

export function useWritingSyncStatus(date: string) {
  useSyncExternalStore(subscribeToWritingSyncStatus, getWritingSyncSnapshot, getServerSnapshot);

  return readWritingSyncStatus(date);
}
